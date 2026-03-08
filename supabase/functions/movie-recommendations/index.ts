import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Act as a movie recommendation expert. Suggest 5 movies that perfectly fit a '${mood}' mood. 
For each movie, provide realistic details including title, release year, duration, IMDb-like rating, genres, 
a short engaging description (in Russian), and a few main cast members.
For images, use 'https://picsum.photos/seed/{movie_title_no_spaces}/400/600' for posterUrl 
and 'https://picsum.photos/seed/{actor_name_no_spaces}/100/100' for actor image URLs.
Return ONLY movies and series. Mix well-known and hidden gems.`;

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
            content: "You are a movie recommendation expert. Always respond with valid JSON only, no markdown, no code blocks. Return an array of movie objects."
          },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_movies",
              description: "Return 5 movie recommendations based on mood",
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
                        year: { type: "number" },
                        duration: { type: "string" },
                        rating: { type: "number" },
                        genres: { type: "array", items: { type: "string" } },
                        description: { type: "string" },
                        posterUrl: { type: "string" },
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
                      required: ["id", "title", "year", "duration", "rating", "genres", "description", "posterUrl", "actors"]
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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ movies: args.movies }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        const movies = Array.isArray(parsed) ? parsed : parsed.movies || [];
        return new Response(JSON.stringify({ movies }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.error("Failed to parse AI response content");
      }
    }

    return new Response(JSON.stringify({ movies: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("movie-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
