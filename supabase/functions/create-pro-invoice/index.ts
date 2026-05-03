import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { stars: number; days: number; title: string; description: string }> = {
  monthly: { stars: 99, days: 30, title: 'Cinemate Pro — 1 месяц', description: 'Безлимит AI-подборов, кастомные настроения, аналитика, без рекламы' },
  yearly: { stars: 799, days: 365, title: 'Cinemate Pro — 1 год', description: 'Год подписки со скидкой 33%. Все Pro-возможности.' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { planId, telegramUserId } = await req.json();
    const plan = PLANS[planId];
    if (!plan || !telegramUserId) {
      return new Response(JSON.stringify({ error: 'Invalid plan or user' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return new Response(JSON.stringify({ error: 'Bot token missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = `pro:${planId}:${telegramUserId}:${Date.now()}`;

    const tgResp = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: plan.title,
        description: plan.description,
        payload,
        provider_token: '', // Stars use empty provider_token
        currency: 'XTR',
        prices: [{ label: plan.title, amount: plan.stars }],
      }),
    });

    const tgData = await tgResp.json();
    if (!tgData.ok) {
      return new Response(JSON.stringify({ error: 'Telegram error', details: tgData }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ invoiceUrl: tgData.result, payload }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});