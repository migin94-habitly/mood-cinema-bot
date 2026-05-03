import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sends Telegram messages to Pro users about new cinema sessions
 * for movies in their watchlist (or recently liked).
 *
 * Triggered daily by pg_cron. Idempotent via notifications_log.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN missing');

    // 1. Active Pro users with cinema_alerts enabled
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('telegram_user_id, telegram_chat_id')
      .eq('cinema_alerts', true);
    if (!prefs?.length) {
      return json({ ok: true, sent: 0, reason: 'no prefs' });
    }

    const userIds = prefs.map((p) => p.telegram_user_id);
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('telegram_user_id, expires_at, status, tier')
      .in('telegram_user_id', userIds);
    const proUsers = new Set(
      (subs || [])
        .filter((s) => s.tier === 'pro' && s.status === 'active' &&
          (!s.expires_at || new Date(s.expires_at) > new Date()))
        .map((s) => s.telegram_user_id)
    );
    const eligible = prefs.filter((p) => proUsers.has(p.telegram_user_id) && p.telegram_chat_id);
    if (!eligible.length) return json({ ok: true, sent: 0, reason: 'no pro' });

    // 2. Current cinema movies (titles in lowercase for matching)
    const { data: cinema } = await supabase
      .from('cinema_movies')
      .select('title, url, image_url, scraped_at');
    if (!cinema?.length) return json({ ok: true, sent: 0, reason: 'no cinema' });

    const cinemaByTitle = new Map<string, typeof cinema[0]>();
    for (const m of cinema) cinemaByTitle.set(normalize(m.title), m);

    let sentTotal = 0;

    for (const user of eligible) {
      // Watchlist of this user
      const { data: items } = await supabase
        .from('watchlist_items')
        .select('movie_data')
        .eq('telegram_user_id', user.telegram_user_id);
      if (!items?.length) continue;

      const matches: { movie: any; cinema: any }[] = [];
      for (const it of items) {
        const m: any = it.movie_data;
        const candidates = [m?.title, m?.titleOriginal].filter(Boolean).map(normalize);
        for (const c of candidates) {
          const hit = cinemaByTitle.get(c);
          if (hit) { matches.push({ movie: m, cinema: hit }); break; }
        }
      }
      if (!matches.length) continue;

      // Dedupe — skip if already notified this user about this cinema title
      const refKeys = matches.map((x) => normalize(x.cinema.title));
      const { data: alreadySent } = await supabase
        .from('notifications_log')
        .select('ref_key')
        .eq('telegram_user_id', user.telegram_user_id)
        .eq('kind', 'cinema_alert')
        .in('ref_key', refKeys);
      const sentSet = new Set((alreadySent || []).map((r) => r.ref_key));
      const fresh = matches.filter((x) => !sentSet.has(normalize(x.cinema.title)));
      if (!fresh.length) continue;

      // Compose message
      const lines = fresh.slice(0, 5).map((x) =>
        `🎬 <b>${escapeHtml(x.movie.title || x.cinema.title)}</b>\n<a href="${x.cinema.url}">Выбрать сеанс →</a>`
      );
      const text =
        `🌟 <b>Новые сеансы по твоему шортлисту</b>\n\n` +
        lines.join('\n\n') +
        `\n\n<i>Только для Pro-подписчиков. Отключить уведомления можно в профиле.</i>`;

      const tgResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegram_chat_id,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      const tgData = await tgResp.json();
      if (!tgData.ok) {
        console.error('TG send failed', user.telegram_user_id, tgData);
        continue;
      }

      // Log
      await supabase.from('notifications_log').insert(
        fresh.map((x) => ({
          telegram_user_id: user.telegram_user_id,
          kind: 'cinema_alert',
          ref_key: normalize(x.cinema.title),
          payload: { movie_title: x.movie.title, cinema_url: x.cinema.url },
        }))
      );
      sentTotal += 1;
    }

    return json({ ok: true, sent: sentTotal });
  } catch (e) {
    console.error('notify-cinema-alerts error', e);
    return json({ error: String(e) }, 500);
  }
});

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').trim();
}
function escapeHtml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}