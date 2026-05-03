import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Screen } from '@/types/movie';
import { PRO_PLANS, createProInvoice, activatePro } from '@/services/proService';
import { getTelegramWebApp, haptic } from '@/lib/telegram';

interface Props {
  reason?: string;
  onClose: () => void;
  onActivated: () => void;
  onNavigate: (screen: Screen) => void;
}

const FEATURES = [
  { icon: '∞', title: 'Безлимитные подборы', desc: 'Без дневного лимита в 10 запросов' },
  { icon: '🎨', title: 'Кастомные настроения', desc: '«Как Вильнев», «Для свидания» — любая идея' },
  { icon: '🎬', title: 'Приоритет кино', desc: 'Первыми получай уведомления о новых сеансах' },
  { icon: '📊', title: 'Личная аналитика', desc: 'Топ жанров, режиссёров, статистика года' },
  { icon: '🎁', title: 'Промокоды Ticketon', desc: 'Эксклюзивные скидки на билеты в кино' },
  { icon: '👥', title: 'Совместный подбор', desc: 'Свайпай с другом, мэтчите общие лайки' },
  { icon: '🌟', title: 'Pro-бейдж и ачивки', desc: 'Эксклюзивные достижения и значок в профиле' },
  { icon: '🚫', title: 'Без рекламы', desc: 'Чистый интерфейс без промо-блоков' },
];

export const PaywallScreen: React.FC<Props> = ({ reason, onClose, onActivated }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (loading) return;
    setLoading(true);
    haptic.medium();
    try {
      const url = await createProInvoice(selectedPlan);
      const tg = getTelegramWebApp();
      if (tg?.openInvoice) {
        tg.openInvoice(url, async (status) => {
          if (status === 'paid') {
            haptic.success();
            await activatePro(selectedPlan);
            onActivated();
          } else if (status === 'failed') {
            haptic.error();
          }
          setLoading(false);
        });
      } else {
        // Fallback (web preview)
        window.open(url, '_blank');
        setLoading(false);
      }
    } catch (e) {
      haptic.error();
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-y-auto">
      <header className="sticky top-0 z-30 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="size-9 rounded-full hover:bg-muted flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <h1 className="text-base font-bold flex-1">Cinemate Pro</h1>
      </header>

      <div className="px-5 pt-4 pb-32">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center size-20 mb-3 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(272 90% 55%), hsl(280 80% 65%))', boxShadow: '0 10px 40px hsla(272, 90%, 55%, 0.4)' }}>
            <span className="text-4xl">🌟</span>
          </div>
          <h2 className="text-2xl font-black mb-1">Cinemate Pro</h2>
          {reason ? (
            <p className="text-sm text-primary font-medium">{reason}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Открой все возможности приложения</p>
          )}
        </motion.div>

        {/* Plans */}
        <div className="space-y-2 mb-6">
          {PRO_PLANS.map((p) => {
            const active = selectedPlan === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { haptic.selection(); setSelectedPlan(p.id); }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  active ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border bg-surface/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-primary' : 'border-muted-foreground'}`}>
                    {active && <div className="size-2.5 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{p.title}</p>
                      {p.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{p.badge}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.pricePerMonth}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black">{p.stars} ⭐</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-surface/30 border border-border"
            >
              <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center text-lg shrink-0">
                {f.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-bold text-sm">{f.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center px-4 leading-relaxed">
          Оплата через Telegram Stars. Подписка не продлевается автоматически — продли вручную после окончания.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border px-5 py-4 pb-6">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, hsl(272 90% 55%), hsl(280 80% 65%))', color: 'white', boxShadow: '0 10px 30px hsla(272, 90%, 55%, 0.4)' }}
        >
          {loading ? 'Открываю...' : `Активировать за ${PRO_PLANS.find(p => p.id === selectedPlan)?.stars} ⭐`}
        </button>
      </div>
    </div>
  );
};