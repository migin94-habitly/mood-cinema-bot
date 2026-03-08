import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, MousePointerClick, Heart, Film, TrendingUp, Bookmark, Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

function DateFilter({ label, date, onSelect }: { label: string; date: Date | undefined; onSelect: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal h-9 text-xs gap-1.5", !date && "text-muted-foreground")}>
          <CalendarIcon className="size-3.5" />
          {date ? format(date, 'dd.MM.yyyy') : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}

function exportCSV(events: any[], watchlistItems: any[]) {
  const rows = [['type', 'user', 'data', 'date']];
  events.forEach(e => rows.push([e.event_type, e.telegram_user_id, JSON.stringify(e.event_data ?? {}), e.created_at]));
  watchlistItems.forEach(w => {
    const m = w.movie_data as any;
    rows.push(['watchlist_item', w.telegram_user_id, m?.title ?? w.movie_id, w.created_at]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moodflix-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    if (params.get('key') === ADMIN_PASSWORD) setAuthenticated(true);
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

  const inRange = useCallback((dateStr: string) => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(dateStr);
    if (dateFrom && d < new Date(dateFrom.setHours(0, 0, 0, 0))) return false;
    if (dateTo && d > new Date(new Date(dateTo).setHours(23, 59, 59, 999))) return false;
    return true;
  }, [dateFrom, dateTo]);

  const filteredEvents = useMemo(() => events.filter(e => inRange(e.created_at)), [events, inRange]);
  const filteredWatchlist = useMemo(() => watchlistItems.filter(w => inRange(w.created_at)), [watchlistItems, inRange]);

  const uniqueUsers = useMemo(() => new Set(filteredEvents.map(e => e.telegram_user_id)).size, [filteredEvents]);
  const totalSwipes = useMemo(() => filteredEvents.filter(e => e.event_type === 'swipe_like' || e.event_type === 'swipe_pass').length, [filteredEvents]);
  const totalLikes = useMemo(() => filteredEvents.filter(e => e.event_type === 'swipe_like').length, [filteredEvents]);
  const likeRate = totalSwipes > 0 ? Math.round((totalLikes / totalSwipes) * 100) : 0;

  const dailyActivity = useMemo(() => {
    const days: Record<string, { sessions: number; swipes: number; likes: number }> = {};
    const now = dateTo ?? new Date();
    const start = dateFrom ?? new Date(new Date().setDate(new Date().getDate() - 13));
    const diff = Math.min(Math.ceil((+now - +start) / 86400000), 60);
    for (let i = diff; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = { sessions: 0, swipes: 0, likes: 0 };
    }
    filteredEvents.forEach(e => {
      const day = e.created_at?.slice(0, 10);
      if (!days[day]) return;
      if (e.event_type === 'session_start') days[day].sessions++;
      if (e.event_type === 'swipe_like' || e.event_type === 'swipe_pass') days[day].swipes++;
      if (e.event_type === 'swipe_like') days[day].likes++;
    });
    return Object.entries(days).map(([date, v]) => ({ date: date.slice(5), ...v }));
  }, [filteredEvents, dateFrom, dateTo]);

  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.filter(e => e.event_type === 'mood_select').forEach(e => {
      const mood = (e.event_data as any)?.mood ?? 'Unknown';
      counts[mood] = (counts[mood] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  const topMovies = useMemo(() => {
    const counts: Record<string, { title: string; count: number }> = {};
    filteredWatchlist.forEach(item => {
      const movie = item.movie_data as any;
      const title = movie?.title ?? item.movie_id;
      if (!counts[item.movie_id]) counts[item.movie_id] = { title, count: 0 };
      counts[item.movie_id].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredWatchlist]);

  const avgWatchlist = useMemo(() => {
    const perUser: Record<string, number> = {};
    filteredWatchlist.forEach(i => { perUser[i.telegram_user_id] = (perUser[i.telegram_user_id] || 0) + 1; });
    const users = Object.values(perUser);
    return users.length > 0 ? (users.reduce((a, b) => a + b, 0) / users.length).toFixed(1) : '0';
  }, [filteredWatchlist]);

  const clearFilters = () => { setDateFrom(undefined); setDateTo(undefined); };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">📊 MoodFlix Dashboard</h1>
        <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to app</button>
      </div>

      {/* Filters & Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <DateFilter label="С даты" date={dateFrom} onSelect={setDateFrom} />
        <DateFilter label="По дату" date={dateTo} onSelect={setDateTo} />
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9">Сбросить</Button>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={() => exportCSV(filteredEvents, filteredWatchlist)}>
          <Download className="size-3.5" /> Экспорт CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Пользователи" value={uniqueUsers} icon={<Users className="size-4" />} sub="уникальных" />
        <KPICard label="Свайпы" value={totalSwipes} icon={<MousePointerClick className="size-4" />} sub={`${likeRate}% лайков`} />
        <KPICard label="Добавлено в список" value={filteredWatchlist.length} icon={<Bookmark className="size-4" />} sub={`~${avgWatchlist} на юзера`} />
        <KPICard label="Всего событий" value={filteredEvents.length} icon={<TrendingUp className="size-4" />} />
      </div>

      {/* Daily Activity Chart */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Активность по дням</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyActivity}>
              <XAxis dataKey="date" stroke="hsl(270,10%,60%)" fontSize={12} />
              <YAxis stroke="hsl(270,10%,60%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(270,30%,12%)', border: '1px solid hsl(270,20%,22%)', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="sessions" stroke="hsl(272,90%,55%)" strokeWidth={2} dot={false} name="Сессии" />
              <Line type="monotone" dataKey="swipes" stroke="hsl(152,69%,50%)" strokeWidth={2} dot={false} name="Свайпы" />
              <Line type="monotone" dataKey="likes" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} name="Лайки" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Популярные настроения</h2>
          {moodDistribution.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {moodDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(270,30%,12%)', border: '1px solid hsl(270,20%,22%)', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-muted-foreground text-sm">Нет данных</p>}
        </div>

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
          ) : <p className="text-muted-foreground text-sm">Нет данных</p>}
        </div>
      </div>

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
