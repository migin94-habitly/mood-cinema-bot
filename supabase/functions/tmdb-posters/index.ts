import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map app moods to TMDB genre IDs (movie endpoints use these IDs).
const MOOD_GENRES: Record<string, number[]> = {
  Epic:       [28, 12, 878, 14],     // Action, Adventure, Sci-Fi, Fantasy
  Romantic:   [10749, 18],           // Romance, Drama
  Scared:     [27, 9648, 53],        // Horror, Mystery, Thriller
  Funny:      [35, 10751],           // Comedy, Family
  Mysterious: [9648, 80, 53],        // Mystery, Crime, Thriller
  Relaxed:    [10751, 16, 99, 10402],// Family, Animation, Documentary, Music
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const mood = url.searchParams.get("mood") || "Epic";
    const limit = Math.min(20, Math.max(6, parseInt(url.searchParams.get("limit") || "12")));
    const TMDB = Deno.env.get("TMDB_API_KEY");
    if (!TMDB) throw new Error("TMDB_API_KEY missing");
    const genres = (MOOD_GENRES[mood] || MOOD_GENRES.Epic).join(",");
    // Pull from 2 random pages for freshness
    const page = 1 + Math.floor(Math.random() * 4);
    const r = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB}&language=ru-RU&sort_by=popularity.desc&include_adult=false&with_genres=${genres}&vote_count.gte=300&page=${page}`
    );
    const j = await r.json();
    const items = (j.results || [])
      .filter((m: any) => m.poster_path)
      .slice(0, limit)
      .map((m: any) => ({
        title: m.title,
        poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
        year: (m.release_date || "").slice(0, 4),
      }));
    return new Response(JSON.stringify({ posters: items }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Browser + edge cache for 1h, serve stale up to 24h
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});