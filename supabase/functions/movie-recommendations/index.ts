import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

async function searchTmdbPoster(title: string, year: number, apiKey: string): Promise<string | null> {
  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}&language=ru-RU`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (result?.poster_path) return `https://image.tmdb.org/t/p/w500${result.poster_path}`;
    return null;
  } catch { return null; }
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

interface CinemaMovie {
  title: string;
  url: string;
  imageUrl: string;
  ageRating: string;
  date: string;
  price: string;
}

async function scrapeTicketonCinema(): Promise<CinemaMovie[]> {
  try {
    const res = await fetch("https://ticketon.kz/almaty/cinema");
    if (!res.ok) return [];
    const html = await res.text();
    
    const movies: CinemaMovie[] = [];
    // Parse movie entries from HTML - look for event links with movie data
    const eventRegex = /href="(https:\/\/ticketon\.kz\/almaty\/event\/[^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?(\d+\+)[\s\S]*?<[^>]*>([^<]+)<[\s\S]*?(\d+ \w+, \d+:\d+)/g;
    
    // Simpler approach: extract structured data using regex on the full HTML
    const blockRegex = /<a[^>]*href="(https:\/\/ticketon\.kz\/almaty\/event\/[^"]+)"[^>]*class="[^"]*event-card[^"]*"[\s\S]*?<\/a>/g;
    
    // Fallback: parse from text content patterns
    const titleUrlPairs: { title: string; url: string }[] = [];
    const linkRegex = /href="(https:\/\/ticketon\.kz\/almaty\/event\/([^"]+))"[^>]*>/g;
    let match;
    const seenUrls = new Set<string>();
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      
      // Extract title from the slug
      const slug = match[2];
      // Convert slug to readable title: "tvoe-serdtse-budet-razbito-2026" -> "Твое сердце будет разбито"
      const cleanSlug = slug.replace(/-\d{4}$/, '').replace(/-/g, ' ');
      titleUrlPairs.push({ title: cleanSlug, url });
    }
    
    // Also try to extract actual titles from the HTML
    const titleRegex = /<(?:h\d|strong|b|span)[^>]*class="[^"]*(?:title|name)[^"]*"[^>]*>([^<]+)</g;
    
    // Use a more reliable approach - look for known movie title patterns in markdown-like content
    const strongRegex = /<strong[^>]*>([^<]+)<\/strong>/g;
    const titles: string[] = [];
    while ((match = strongRegex.exec(html)) !== null) {
      const t = match[1].trim();
      if (t.length > 2 && !t.includes('₸') && !t.includes('Freedom')) {
        titles.push(t);
      }
    }
    
    // Match titles with URLs
    for (let i = 0; i < Math.min(titleUrlPairs.length, 25); i++) {
      const pair = titleUrlPairs[i];
      // Skip non-movie events (sports, festivals)
      if (pair.url.includes('-vs-') || pair.url.includes('festival') || pair.url.includes('concert')) continue;
      
      const movieTitle = titles[i] || pair.title;
      movies.push({
        title: movieTitle.replace(/\s*\(\d{4}\)\s*$/, ''),
        url: pair.url,
        imageUrl: '',
        ageRating: '',
        date: '',
        price: '',
      });
    }
    
    return movies.slice(0, 15);
  } catch (e) {
    console.error("Failed to scrape ticketon:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mood, type, genre, excludeTitles } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    const moodContext = MOOD_CONTEXT[mood] || mood;

    // Scrape cinema movies in parallel with AI call
    const cinemaPromise = scrapeTicketonCinema();

    let typeConstraint = "Микс фильмов и сериалов (примерно 7 фильмов + 5 сериалов)";
    if (type === "movie") typeConstraint = "ТОЛЬКО ФИЛЬМЫ, никаких сериалов. Все 10 результатов должны быть фильмами (type: 'movie').";
    else if (type === "series") typeConstraint = "ТОЛЬКО СЕРИАЛЫ, никаких фильмов. Все 10 результатов должны быть сериалами (type: 'series').";

    let genreConstraint = "";
    if (genre) genreConstraint = `\nОБЯЗАТЕЛЬНЫЙ ЖАНР: Все рекомендации ДОЛЖНЫ относиться к жанру "${genre}". Это главный приоритет при подборе.`;

    let excludeConstraint = "";
    if (excludeTitles?.length > 0) {
      excludeConstraint = `\n\nЗАПРЕЩЁННЫЕ ФИЛЬМЫ (НЕ РЕКОМЕНДУЙ ИХ):\n${excludeTitles.join(", ")}`;
    }

    // Get cinema movies
    const cinemaMovies = await cinemaPromise;
    let cinemaContext = "";
    if (cinemaMovies.length > 0) {
      cinemaContext = `\n\nСЕЙЧАС В КИНОТЕАТРАХ АЛМАТЫ (ticketon.kz):\n${cinemaMovies.map(m => `- "${m.title}" (${m.url})`).join('\n')}\n\nЕсли какие-то из этих фильмов подходят под настроение "${mood}" (${moodContext}), ОБЯЗАТЕЛЬНО включи их в рекомендации (максимум 3-4 фильма из кинотеатров). Для таких фильмов установи platform: "Кинотеатр" и добавь поле ticketonUrl с соответствующей ссылкой из списка выше.`;
    }

    const prompt = `Ты — эксперт по кино и сериалам с энциклопедическими знаниями.

ЗАДАЧА: Подбери 12 РЕАЛЬНЫХ фильмов/сериалов под настроение "${mood}".
Контекст: ${moodContext}

ФИЛЬТРЫ:
- Тип: ${typeConstraint}${genreConstraint}
${cinemaContext}

ТРЕБОВАНИЯ:
1. ТОЛЬКО РЕАЛЬНО СУЩЕСТВУЮЩИЕ фильмы/сериалы
2. Приоритет: 2022-2026, можно 1-2 классики
3. Рейтинги РЕАЛЬНЫЕ (IMDB и Кинопоиск)
4. Указывай РЕАЛЬНУЮ платформу

ПЛАТФОРМЫ: Netflix, Apple TV+, HBO Max, Amazon Prime Video, Disney+, HDRezka, Кинопоиск HD, Okko, IVI, Wink, Hulu, Paramount+, Кинотеатр

ДЛЯ КАЖДОГО:
- title: русское название
- titleOriginal: английское название
- year, duration, ratingImdb (1-10), ratingKinopoisk (1-10)
- genres: жанры на русском
- description: 2-3 предложения на русском
- platform, type ("movie"/"series")
- actors: 2-3 актёра
- ticketonUrl: ссылка на ticketon.kz ТОЛЬКО если фильм сейчас в кинотеатрах Алматы (из списка выше), иначе null

posterUrl: https://picsum.photos/seed/{titleOriginal_no_spaces}/400/600
imageUrl актёров: https://picsum.photos/seed/{actor_name_no_spaces}/100/100

НЕ повторяй очевидные фильмы. Включай жемчужины.${excludeConstraint}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Ты — кинокритик и куратор. Рекомендуешь только реально существующие фильмы с реальными рейтингами." },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_movies",
            description: "Return 12 real movie/series recommendations",
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
                      ticketonUrl: { type: "string", description: "URL to ticketon.kz event page, null if not in cinemas" }
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

    // Clean up ticketonUrl - ensure only valid ticketon URLs
    movies = movies.map((m: any) => {
      if (m.ticketonUrl && !m.ticketonUrl.startsWith('https://ticketon.kz/')) {
        m.ticketonUrl = null;
      }
      return m;
    });

    // Enrich with TMDB
    if (TMDB_API_KEY && movies.length > 0) {
      movies = await Promise.all(movies.map(async (movie: any) => {
        const posterUrl = await searchTmdbPoster(movie.titleOriginal || movie.title, movie.year, TMDB_API_KEY);
        if (posterUrl) movie.posterUrl = posterUrl;
        if (movie.actors?.length) {
          movie.actors = await Promise.all(movie.actors.map(async (a: any) => {
            const photo = await searchTmdbPerson(a.name, TMDB_API_KEY);
            if (photo) a.imageUrl = photo;
            return a;
          }));
        }
        return movie;
      }));
    }

    return new Response(JSON.stringify({ movies }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("movie-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
