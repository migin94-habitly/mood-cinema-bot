import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MOOD_CONTEXT: Record<string, string> = {
  Epic: "эпичные, масштабные блокбастеры с потрясающими спецэффектами, боевики, фантастика, супергеройские фильмы. Примеры настроения: Дюна, Оппенгеймер, Интерстеллар, Мстители",
  Romantic: "романтические фильмы и сериалы, драмы о любви, романтические комедии. Примеры: Бриджертон, Нормальные люди, Ла-Ла Ленд, Дневник памяти",
  Scared: "хорроры, триллеры, мистика, саспенс. Примеры: Улыбка, Астрал, Тихое место, Очень странные дела, Призраки дома на холме",
  Funny: "комедии, ситкомы, стендап-шоу, пародии. Примеры: Тед Лассо, Медведь, Убийства в одном здании, Барби",
  Mysterious: "детективы, криминальные триллеры, загадочные истории. Примеры: Стеклянная луковица, Настоящий детектив, Тьма, Видеть",
  Relaxed: "лёгкие фильмы и сериалы для расслабленного просмотра, документалки о природе, feel-good кино. Примеры: Шеф-повар, Наша планета, Друзья, Тед Лассо",
};

async function searchTmdbPoster(title: string, year: number, apiKey: string): Promise<string | null> {
  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}&language=ru-RU`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (result?.poster_path) {
      return `https://image.tmdb.org/t/p/w500${result.poster_path}`;
    }
    return null;
  } catch {
    return null;
  }
}

async function searchTmdbPerson(name: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(name)}&language=ru-RU`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (result?.profile_path) {
      return `https://image.tmdb.org/t/p/w185${result.profile_path}`;
    }
    return null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    const moodContext = MOOD_CONTEXT[mood] || mood;

    const prompt = `Ты — эксперт по кино и сериалам с энциклопедическими знаниями о контенте стриминговых платформ.

ЗАДАЧА: Подбери 7 РЕАЛЬНЫХ фильмов и сериалов, которые идеально подходят под настроение "${mood}".
Контекст настроения: ${moodContext}

КРИТИЧЕСКИ ВАЖНЫЕ ТРЕБОВАНИЯ:
1. ТОЛЬКО РЕАЛЬНО СУЩЕСТВУЮЩИЕ фильмы и сериалы — никаких выдуманных!
2. Приоритет: контент 2022-2025 годов, но можно включить 1-2 культовых классики
3. Микс фильмов и сериалов (примерно 4 фильма + 3 сериала)
4. Рейтинги должны быть РЕАЛЬНЫМИ — используй свои знания о рейтингах IMDB и Кинопоиска
5. Указывай РЕАЛЬНУЮ платформу, где контент доступен для просмотра

ПЛАТФОРМЫ ДЛЯ ПОИСКА (приоритет):
- Netflix, Apple TV+, HBO Max, Amazon Prime Video, Disney+
- HDRezka, Кинопоиск HD, Okko, IVI, Wink
- Hulu, Paramount+

ДЛЯ КАЖДОГО ФИЛЬМА/СЕРИАЛА УКАЖИ:
- title: название на русском
- titleOriginal: оригинальное название на английском  
- year: год выпуска
- duration: длительность (для сериалов: "X сезонов")
- ratingImdb: рейтинг IMDB (от 1.0 до 10.0, реальный)
- ratingKinopoisk: рейтинг Кинопоиска (от 1.0 до 10.0, реальный)
- genres: жанры на русском
- description: захватывающее описание на русском (2-3 предложения)
- platform: основная платформа для просмотра
- type: "movie" или "series"
- actors: 2-3 главных актёра (реальные имена)

Для posterUrl используй: https://picsum.photos/seed/{titleOriginal_no_spaces}/400/600
Для imageUrl актёров: https://picsum.photos/seed/{actor_name_no_spaces}/100/100

ВАЖНО: НЕ повторяй очевидные фильмы. Включай как популярные хиты, так и менее известные жемчужины с высокими рейтингами.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Ты — профессиональный кинокритик и куратор контента для стриминговых платформ. Ты знаешь реальные рейтинги IMDB и Кинопоиска для всех популярных фильмов и сериалов. Ты никогда не выдумываешь фильмы — рекомендуешь только реально существующие."
          },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_movies",
              description: "Return 7 real movie/series recommendations based on mood with accurate IMDB and Kinopoisk ratings",
              parameters: {
                type: "object",
                properties: {
                  movies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string", description: "Russian title" },
                        titleOriginal: { type: "string", description: "Original English title" },
                        year: { type: "number" },
                        duration: { type: "string", description: "e.g. '148 мин' or '3 сезона'" },
                        ratingImdb: { type: "number", description: "Real IMDB rating 1.0-10.0" },
                        ratingKinopoisk: { type: "number", description: "Real Kinopoisk rating 1.0-10.0" },
                        genres: { type: "array", items: { type: "string" } },
                        description: { type: "string", description: "2-3 sentences in Russian" },
                        posterUrl: { type: "string" },
                        platform: { type: "string", description: "Streaming platform name" },
                        type: { type: "string", enum: ["movie", "series"] },
                        actors: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              imageUrl: { type: "string" }
                            },
                            required: ["name", "imageUrl"]
                          }
                        }
                      },
                      required: ["id", "title", "titleOriginal", "year", "duration", "ratingImdb", "ratingKinopoisk", "genres", "description", "posterUrl", "platform", "type", "actors"]
                    }
                  }
                },
                required: ["movies"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_movies" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    let movies: any[] = [];
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      movies = args.movies || [];
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          movies = Array.isArray(parsed) ? parsed : parsed.movies || [];
        } catch {
          console.error("Failed to parse AI response content");
        }
      }
    }

    // Enrich with TMDB posters if API key is available
    if (TMDB_API_KEY && movies.length > 0) {
      const enriched = await Promise.all(
        movies.map(async (movie: any) => {
          // Search for movie poster
          const posterUrl = await searchTmdbPoster(
            movie.titleOriginal || movie.title,
            movie.year,
            TMDB_API_KEY
          );
          if (posterUrl) movie.posterUrl = posterUrl;

          // Search for actor photos
          if (movie.actors && Array.isArray(movie.actors)) {
            const actorsWithPhotos = await Promise.all(
              movie.actors.map(async (actor: any) => {
                const photoUrl = await searchTmdbPerson(actor.name, TMDB_API_KEY);
                if (photoUrl) actor.imageUrl = photoUrl;
                return actor;
              })
            );
            movie.actors = actorsWithPhotos;
          }

          return movie;
        })
      );
      movies = enriched;
    }

    return new Response(JSON.stringify({ movies }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("movie-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
