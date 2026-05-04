import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MOOD_CONTEXT: Record<string, string> = {
  Epic: "эпичные, масштабные блокбастеры с потрясающими спецэффектами, боевики, фантастика, супергеройские фильмы",
  Romantic: "романтические фильмы и сериалы, драмы о любви, романтические комедии",
  Scared: "хорроры, триллеры, мистика, саспенс",
  Funny: "комедии, ситкомы, стендап-шоу, пародии",
  Mysterious: "детективы, криминальные триллеры, загадочные истории",
  Relaxed: "лёгкие фильмы и сериалы для расслабленного просмотра, документалки о природе, feel-good кино",
};

interface CinemaMovie {
  title: string;
  url: string;
  image_url: string;
  age_rating: string;
}

async function getCinemaMoviesFromDB(city: string): Promise<CinemaMovie[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from("cinema_movies")
    .select("title, url, image_url, age_rating")
    .eq("city", city)
    .order("scraped_at", { ascending: false });
  
  if (error) {
    console.error("Failed to fetch cinema movies from DB:", error);
    return [];
  }
  
  console.log(`DB: loaded ${data?.length || 0} cinema movies for city=${city}`);
  return data || [];
}

async function tmdbQuery(path: string, params: Record<string, string>, apiKey: string) {
  const qs = new URLSearchParams({ api_key: apiKey, ...params }).toString();
  try {
    const res = await fetch(`https://api.themoviedb.org/3${path}?${qs}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function pickPoster(results: any[]): string | null {
  if (!Array.isArray(results)) return null;
  // Prefer entries that actually have a poster, sorted by popularity
  const withPoster = results.filter(r => r?.poster_path);
  withPoster.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  const r = withPoster[0];
  return r?.poster_path ? `https://image.tmdb.org/t/p/w780${r.poster_path}` : null;
}

async function searchTmdbPoster(
  titleRu: string,
  titleOriginal: string,
  year: number,
  type: string | undefined,
  apiKey: string,
): Promise<string | null> {
  const isSeries = type === 'series';
  const queries: Array<[string, Record<string, string>]> = [];
  const orig = (titleOriginal || '').trim();
  const ru = (titleRu || '').trim();

  // 1) Original title + year on the right endpoint
  if (orig) {
    queries.push([
      isSeries ? '/search/tv' : '/search/movie',
      { query: orig, language: 'en-US', ...(year ? { [isSeries ? 'first_air_date_year' : 'year']: String(year) } : {}) },
    ]);
    // 2) Original title without year
    queries.push([isSeries ? '/search/tv' : '/search/movie', { query: orig, language: 'en-US' }]);
    // 3) Multi search original
    queries.push(['/search/multi', { query: orig, language: 'en-US' }]);
  }
  // 4) RU title with year
  if (ru) {
    queries.push([
      isSeries ? '/search/tv' : '/search/movie',
      { query: ru, language: 'ru-RU', ...(year ? { [isSeries ? 'first_air_date_year' : 'year']: String(year) } : {}) },
    ]);
    queries.push(['/search/multi', { query: ru, language: 'ru-RU' }]);
  }

  for (const [path, params] of queries) {
    const data = await tmdbQuery(path, params, apiKey);
    const poster = pickPoster(data?.results || []);
    if (poster) return poster;
  }
  return null;
}

async function searchTmdbPerson(name: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(name)}&language=ru-RU`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (result?.profile_path) return `https://image.tmdb.org/t/p/w185${result.profile_path}`;
    return null;
  } catch { return null; }
}

function fallbackPoster(title: string): string {
  const safe = encodeURIComponent((title || 'Movie').slice(0, 40));
  // Brand-styled placeholder (dark + purple) that matches the app theme
  return `https://placehold.co/600x900/0F0A1F/A855F7/png?text=${safe}&font=montserrat`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mood, type, genre, excludeTitles, city } = await req.json();
    // city: KZ city slug ("almaty"...) or "other" / undefined → AI-only mode
    const cityKey = typeof city === "string" ? city : "almaty";
    const aiOnly = !cityKey || cityKey === "other";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    const moodContext = MOOD_CONTEXT[mood] || mood;

    // Load cinema movies from database (skip for AI-only / non-KZ users)
    const cinemaMovies = aiOnly ? [] : await getCinemaMoviesFromDB(cityKey);

    let typeConstraint = "Микс из 12 фильмов и 12 сериалов (всего 24). ОБЯЗАТЕЛЬНО включи минимум 12 сериалов с type='series'.";
    let totalCount = 24;
    if (type === "movie") {
      typeConstraint = "ТОЛЬКО ФИЛЬМЫ (24 штуки), никаких сериалов. Все результаты должны быть фильмами (type: 'movie').";
    } else if (type === "series") {
      typeConstraint = "ТОЛЬКО СЕРИАЛЫ (24 штуки), никаких фильмов. Все результаты ОБЯЗАТЕЛЬНО должны быть сериалами (type: 'series'). Включи разнообразные жанры: драмы, триллеры, комедии, фантастика, аниме, корейские дорамы, документальные сериалы, мини-сериалы.";
    }

    let genreConstraint = "";
    if (genre) genreConstraint = `\nОБЯЗАТЕЛЬНЫЙ ЖАНР: Все рекомендации ДОЛЖНЫ относиться к жанру "${genre}".`;

    let excludeConstraint = "";
    if (excludeTitles?.length > 0) {
      excludeConstraint = `\n\nЗАПРЕЩЁННЫЕ ФИЛЬМЫ (НЕ РЕКОМЕНДУЙ ИХ):\n${excludeTitles.join(", ")}`;
    }

    let cinemaContext = "";
    if (cinemaMovies.length > 0 && type !== "series") {
      const cinemaList = cinemaMovies.map(m =>
        `- "${m.title}" (возраст: ${m.age_rating || '?'}, ссылка: ${m.url})`
      ).join('\n');

      cinemaContext = `\n\n🎬 СЕЙЧАС В КИНОТЕАТРАХ АЛМАТЫ (${cinemaMovies.length} фильмов):\n${cinemaList}\n
ВАЖНЕЙШЕЕ ПРАВИЛО: Включи ВСЕ фильмы из кинотеатров, которые подходят под настроение "${mood}" (${moodContext}).
Для каждого: platform = "Кинотеатр", ticketonUrl = ссылка из списка.
Фильмы из кинотеатров ДОЛЖНЫ идти ПЕРВЫМИ в массиве movies.
После них добавь рекомендации из стриминговых сервисов до общего 12.`;
    }

    const prompt = `Подбери ${totalCount} РЕАЛЬНЫХ фильмов/сериалов под настроение "${mood}" (${moodContext}).
Тип: ${typeConstraint}${genreConstraint}
${cinemaContext}

Правила: только реальные тайтлы, рейтинги IMDB >6.5. Используй РАЗНЫЕ десятилетия и страны:
- 60% контента из 2020-2026 (свежие хиты),
- 25% из 2010-2019 (современная классика),
- 15% культовая классика 1970-2009.
Микс языков/стран: Голливуд, европейское кино, корейское, японское аниме, индийское, латиноамериканское, российское/советское — для богатства подборки.
titleOriginal — ОБЯЗАТЕЛЬНО оригинальное название латиницей (например "Breaking Bad", "Oppenheimer"), без перевода. Это критично для поиска постеров.
ЗАПРЕЩЕНО: дубликаты внутри одной подборки.
Кинотеатральные — первыми.
Платформы: Netflix, Apple TV+, HBO Max, Amazon Prime Video, Disney+, HDRezka, Кинопоиск HD, Okko, IVI, Wink, Кинотеатр, Hulu, Paramount+.

Для каждого: id, title, titleOriginal, year, duration, ratingImdb, ratingKinopoisk, genres (рус), description (1-2 предложения), platform, type, actors (2 актёра: name, imageUrl=""), ticketonUrl (только из списка кинотеатров).
posterUrl="" — будет подставлен сервером.${excludeConstraint}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Ты — кинокритик. Рекомендуешь только реальные фильмы с реальными рейтингами." },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_movies",
            description: `Return ${totalCount} real movie/series recommendations. Cinema movies MUST come first.`,
            parameters: {
              type: "object",
              properties: {
                movies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      titleOriginal: { type: "string" },
                      year: { type: "number" },
                      duration: { type: "string" },
                      ratingImdb: { type: "number" },
                      ratingKinopoisk: { type: "number" },
                      genres: { type: "array", items: { type: "string" } },
                      description: { type: "string" },
                      posterUrl: { type: "string" },
                      platform: { type: "string" },
                      type: { type: "string", enum: ["movie", "series"] },
                      actors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: { name: { type: "string" }, imageUrl: { type: "string" } },
                          required: ["name", "imageUrl"]
                        }
                      },
                      ticketonUrl: { type: "string" }
                    },
                    required: ["id", "title", "titleOriginal", "year", "duration", "ratingImdb", "ratingKinopoisk", "genres", "description", "posterUrl", "platform", "type", "actors"]
                  }
                }
              },
              required: ["movies"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_movies" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Слишком много запросов." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Необходимо пополнить баланс." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let movies: any[] = [];

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      movies = JSON.parse(toolCall.function.arguments).movies || [];
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try { const p = JSON.parse(content); movies = Array.isArray(p) ? p : p.movies || []; } catch {}
      }
    }

    // Enforce prioritization: cinema first, then streaming
    const cinemaResults: any[] = [];
    const streamingResults: any[] = [];

    for (const m of movies) {
      if (m.ticketonUrl && !m.ticketonUrl.startsWith('https://ticketon.kz/')) {
        m.ticketonUrl = null;
      }
      if (m.ticketonUrl || m.platform === 'Кинотеатр') {
        cinemaResults.push(m);
      } else {
        streamingResults.push(m);
      }
    }

    movies = [...cinemaResults, ...streamingResults];
    console.log(`Results: ${cinemaResults.length} cinema + ${streamingResults.length} streaming = ${movies.length} total (DB had ${cinemaMovies.length} movies)`);

    // Enrich posters in parallel (skip actor photos for speed — UI loads them on demand in details)
    if (TMDB_API_KEY && movies.length > 0) {
      const posters = await Promise.all(
        movies.map((m: any) =>
          searchTmdbPoster(m.title, m.titleOriginal, m.year, m.type, TMDB_API_KEY).catch(() => null)
        )
      );
      // Second pass: for those still missing, try the OPPOSITE type endpoint (AI sometimes mislabels)
      const retryIdx: number[] = [];
      posters.forEach((p, i) => { if (!p) retryIdx.push(i); });
      const retryPosters = await Promise.all(
        retryIdx.map(i => {
          const m = movies[i];
          const flippedType = m.type === 'series' ? 'movie' : 'series';
          return searchTmdbPoster(m.title, m.titleOriginal, m.year, flippedType, TMDB_API_KEY).catch(() => null);
        })
      );
      retryIdx.forEach((i, k) => { if (retryPosters[k]) posters[i] = retryPosters[k]; });

      movies = movies.map((m: any, i: number) => ({
        ...m,
        posterUrl: posters[i] || fallbackPoster(m.titleOriginal || m.title),
        actors: (m.actors || []).map((a: any) => ({ ...a, imageUrl: a.imageUrl || fallbackPoster(a.name) })),
      }));
    } else {
      movies = movies.map((m: any) => ({ ...m, posterUrl: m.posterUrl || fallbackPoster(m.title) }));
    }

    return new Response(JSON.stringify({
      movies,
      meta: {
        cinemaCount: cinemaResults.length,
        streamingCount: streamingResults.length,
        totalScraped: cinemaMovies.length,
        mood,
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("movie-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
