import { useEffect, useState, useCallback } from 'react';
import { fetchEngagementStats, touchStreak, EngagementStats } from '@/services/engagementService';
import { fetchProStatus, ProStatus } from '@/services/proService';

export function useEngagement() {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [pro, setPro] = useState<ProStatus>({ isPro: false, tier: 'free', expiresAt: null });

  const refresh = useCallback(async () => {
    const [s, p] = await Promise.all([fetchEngagementStats(), fetchProStatus()]);
    setStats(s);
    setPro(p);
  }, []);

  useEffect(() => {
    (async () => {
      await touchStreak();
      await refresh();
    })();
  }, [refresh]);

  return { stats, pro, refresh };
}