import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { days: number; stars: number }> = {
  monthly: { days: 30, stars: 99 },
  yearly: { days: 365, stars: 799 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { planId, telegramUserId, chargeId } = await req.json();
    const plan = PLANS[planId];
    if (!plan || !telegramUserId) {
      return new Response(JSON.stringify({ error: 'Invalid plan or user' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // extend from current expiry if still active
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle();

    const now = new Date();
    const baseDate = (existing?.expires_at && new Date(existing.expires_at) > now)
      ? new Date(existing.expires_at) : now;
    const newExpiry = new Date(baseDate.getTime() + plan.days * 86400_000);

    const row = {
      telegram_user_id: String(telegramUserId),
      tier: 'pro',
      status: 'active',
      expires_at: newExpiry.toISOString(),
      last_payment_charge_id: chargeId ?? null,
      last_payment_payload: planId,
      stars_paid: (existing?.stars_paid ?? 0) + plan.stars,
      updated_at: now.toISOString(),
    };

    const { error } = await supabase.from('subscriptions').upsert(row, { onConflict: 'telegram_user_id' });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, expiresAt: newExpiry.toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});