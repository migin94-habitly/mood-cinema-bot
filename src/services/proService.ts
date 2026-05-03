import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/hooks/usePersistence';

export interface ProStatus {
  isPro: boolean;
  tier: 'free' | 'pro';
  expiresAt: Date | null;
}

export async function fetchProStatus(): Promise<ProStatus> {
  const userId = getUserId();
  const { data } = await supabase
    .from('subscriptions')
    .select('tier, status, expires_at')
    .eq('telegram_user_id', userId)
    .maybeSingle();
  if (!data) return { isPro: false, tier: 'free', expiresAt: null };
  const expires = data.expires_at ? new Date(data.expires_at) : null;
  const isPro = data.tier === 'pro' && data.status === 'active' && (!expires || expires > new Date());
  return { isPro, tier: isPro ? 'pro' : 'free', expiresAt: expires };
}

export interface ProPlan {
  id: 'monthly' | 'yearly';
  title: string;
  stars: number;
  days: number;
  badge?: string;
  pricePerMonth: string;
}

export const PRO_PLANS: ProPlan[] = [
  { id: 'monthly', title: '1 месяц', stars: 99, days: 30, pricePerMonth: '99 ⭐ / мес' },
  { id: 'yearly', title: '1 год', stars: 799, days: 365, badge: '−33%', pricePerMonth: '67 ⭐ / мес' },
];

export const FREE_DAILY_LIMIT = 10;

export async function createProInvoice(planId: 'monthly' | 'yearly'): Promise<string> {
  const userId = getUserId();
  const { data, error } = await supabase.functions.invoke('create-pro-invoice', {
    body: { planId, telegramUserId: userId },
  });
  if (error) throw error;
  return data.invoiceUrl as string;
}

export async function activatePro(planId: 'monthly' | 'yearly', chargeId?: string): Promise<void> {
  const userId = getUserId();
  const { error } = await supabase.functions.invoke('activate-pro', {
    body: { planId, telegramUserId: userId, chargeId },
  });
  if (error) throw error;
}