import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Ticketon cinema page
    const res = await fetch("https://ticketon.kz/almaty/cinema", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      console.error(`Ticketon fetch failed: ${res.status}`);
      return new Response(JSON.stringify({ error: `Fetch failed: ${res.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse HTML");

    const movies: { title: string; url: string; image_url: string | null; age_rating: string | null }[] = [];

    // Try multiple selectors for Ticketon's structure
    const selectors = [
      ".event-card", ".poster-card", ".movie-card",
      "[class*='event']", "[class*='poster']", "[class*='card']",
      "a[href*='/event/']", "a[href*='/cinema/']",
    ];

    // Strategy 1: Find links to cinema events
    const allLinks = doc.querySelectorAll("a[href]");
    const seenUrls = new Set<string>();

    for (const link of allLinks) {
      const href = (link as any).getAttribute("href") || "";
      const fullUrl = href.startsWith("http") ? href : `https://ticketon.kz${href}`;
      
      if (!fullUrl.includes("ticketon.kz") || seenUrls.has(fullUrl)) continue;
      if (!href.includes("/event/") && !href.match(/\/[a-z0-9-]+-\d+$/)) continue;
      
      // Skip navigation/utility links
      if (href === "/" || href === "/almaty/cinema" || href.includes("/category/")) continue;

      const img = (link as any).querySelector("img");
      const imageUrl = img?.getAttribute("src") || img?.getAttribute("data-src") || null;
      
      // Get title from various sources
      let title = "";
      const titleEl = (link as any).querySelector("h2, h3, h4, .title, [class*='title'], [class*='name']");
      if (titleEl) {
        title = titleEl.textContent?.trim() || "";
      } else if (img) {
        title = img.getAttribute("alt")?.trim() || "";
      }
      if (!title) {
        title = (link as any).textContent?.trim()?.substring(0, 100) || "";
      }
      
      if (!title || title.length < 2 || title.length > 100) continue;

      // Look for age rating
      const ageEl = (link as any).querySelector("[class*='age'], [class*='rating']");
      const ageRating = ageEl?.textContent?.trim() || null;

      seenUrls.add(fullUrl);
      movies.push({ title, url: fullUrl, image_url: imageUrl, age_rating: ageRating });
    }

    console.log(`Scraped ${movies.length} movies from Ticketon`);

    if (movies.length > 0) {
      // Clear old data and insert new
      await supabase.from("cinema_movies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const { error } = await supabase.from("cinema_movies").insert(movies);
      if (error) {
        console.error("Insert error:", error);
        return new Response(JSON.stringify({ error: error.message, scraped: movies.length }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: movies.length,
      movies: movies.map(m => m.title),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Scrape error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
