import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, MousePointerClick, Heart, Film, TrendingUp, Bookmark } from 'lucide-react';

const ADMIN_PASSWORD = 'moodflix2024';

const COLORS = ['hsl(272,90%,55%)', 'hsl(152,69%,50%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)', 'hsl(200,80%,55%)', 'hsl(320,70%,55%)'];

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon, sub }) => (
  <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
    <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
    <div className="text-3xl font-bold text-foreground">{value}</div>
    {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Raw data
  const [events, setEvents] = useState<any[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);

  useEffect(() => {
    if (params.get('key') === ADMIN_PASSWORD) {
      setAuthenticated(true);
    }
  }, [params]);

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    (async () => {
      const [eventsRes, watchlistRes, statsRes] = await Promise.all([
        supabase.from('analytics_events').select('*').order('created_at', { ascending: true }),
        supabase.from('watchlist_items').select('*'),
        supabase.from('user_stats').select('*'),
      ]);
      setEvents(eventsRes.data ?? []);
      setWatchlistItems(watchlistRes.data ?? []);
      setUserStats(statsRes.data ?? []);
      setLoading(false);
    })();
  }, [authenticated]);

  // === Derived metrics ===
  const uniqueUsers = useMemo(() => new Set(events.map(e => e.telegram_user_id)).size, [events]);
  const totalSwipes = useMemo(() => events.filter(e => e.event_type === 'swipe_like' || e.event_type === 'swipe_pass').length, [events]);
  const totalLikes = useMemo(() => events.filter(e => e.event_type === 'swipe_like').length, [events]);
  const likeRate = totalSwipes > 0 ? Math.round((totalLikes / totalSwipes) * 100) : 0;

  // Daily activity (last 14 days)
  const dailyActivity = useMemo(() => {
    const days: Record<string, { sessions: number; swipes: number; likes: number }> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { sessions: 0, swipes: 0, likes: 0 };
    }
    events.forEach(e => {
      const day = e.created_at?.slice(0, 10);
      if (!days[day]) return;
      if (e.event_type === 'session_start') days[day].sessions++;
      if (e.event_type === 'swipe_like' || e.event_type === 'swipe_pass') days[day].swipes++;
      if (e.event_type === 'swipe_like') days[day].likes++;
    });
    return Object.entries(days).map(([date, v]) => ({ date: date.slice(5), ...v }));
  }, [events]);

  // Mood distribution
  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    events.filter(e => e.event_type === 'mood_select').forEach(e => {
      const mood = (e.event_data as any)?.mood ?? 'Unknown';
      counts[mood] = (counts[mood] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [events]);

  // Top watchlisted movies
  const topMovies = useMemo(() => {
    const counts: Record<string, { title: string; count: number }> = {};
    watchlistItems.forEach(item => {
      const movie = item.movie_data as any;
      const title = movie?.title ?? item.movie_id;
      if (!counts[item.movie_id]) counts[item.movie_id] = { title, count: 0 };
      counts[item.movie_id].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [watchlistItems]);

  // Avg watchlist size
  const avgWatchlist = useMemo(() => {
    const perUser: Record<string, number> = {};
    watchlistItems.forEach(i => { perUser[i.telegram_user_id] = (perUser[i.telegram_user_id] || 0) + 1; });
    const users = Object.values(perUser);
    return users.length > 0 ? (users.reduce((a, b) => a + b, 0) / users.length).toFixed(1) : '0';
  }, [watchlistItems]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">🔐 Admin Access Required</h1>
          <p className="text-muted-foreground text-sm">Добавьте <code className="bg-muted px-2 py-0.5 rounded text-xs">?key=пароль</code> в URL</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">📊 MoodFlix Dashboard</h1>
        <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to app
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Пользователи" value={uniqueUsers} icon={<Users className="size-4" />} sub="уникальных" />
        <KPICard label="Свайпы" value={totalSwipes} icon={<MousePointerClick className="size-4" />} sub={`${likeRate}% лайков`} />
        <KPICard label="Добавлено в список" value={watchlistItems.length} icon={<Bookmark className="size-4" />} sub={`~${avgWatchlist} на юзера`} />
        <KPICard label="Всего событий" value={events.length} icon={<TrendingUp className="size-4" />} />
      </div>

      {/* Daily Activity Chart */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Активность за 14 дней</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyActivity}>
              <XAxis dataKey="date" stroke="hsl(270,10%,60%)" fontSize={12} />
              <YAxis stroke="hsl(270,10%,60%)" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(270,30%,12%)', border: '1px solid hsl(270,20%,22%)', borderRadius: 8, color: '#fff' }}
              />
              <Line type="monotone" dataKey="sessions" stroke="hsl(272,90%,55%)" strokeWidth={2} dot={false} name="Сессии" />
              <Line type="monotone" dataKey="swipes" stroke="hsl(152,69%,50%)" strokeWidth={2} dot={false} name="Свайпы" />
              <Line type="monotone" dataKey="likes" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} name="Лайки" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Популярные настроения</h2>
          {moodDistribution.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {moodDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(270,30%,12%)', border: '1px solid hsl(270,20%,22%)', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Нет данных</p>
          )}
        </div>

        {/* Top Movies */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Film className="size-5" /> Топ фильмов в watchlist</h2>
          {topMovies.length > 0 ? (
            <div className="space-y-2">
              {topMovies.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate flex-1">{i + 1}. {m.title}</span>
                  <span className="text-muted-foreground ml-2 flex items-center gap-1"><Heart className="size-3" />{m.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Нет данных</p>
          )}
        </div>
      </div>

      {/* Swipe Stats Bar Chart */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Свайпы по дням</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyActivity}>
              <XAxis dataKey="date" stroke="hsl(270,10%,60%)" fontSize={12} />
              <YAxis stroke="hsl(270,10%,60%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(270,30%,12%)', border: '1px solid hsl(270,20%,22%)', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="likes" fill="hsl(152,69%,50%)" name="Лайки" radius={[4, 4, 0, 0]} />
              <Bar dataKey="swipes" fill="hsl(270,15%,20%)" name="Всего свайпов" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
