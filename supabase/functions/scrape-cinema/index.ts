import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// KZ city slugs that Ticketon supports
const SUPPORTED_CITIES = [
  "almaty","astana","shymkent","karaganda","aktobe","atyrau","aktau",
  "kostanay","oskemen","pavlodar","semey","taraz","kyzylorda","oral","taldykorgan",
];

async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 1500 }),
  });
  if (!res.ok) throw new Error(`firecrawl ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j?.data?.markdown || "";
}

interface ParsedMovie { title: string; url: string; image_url: string; age_rating: string; }

function parseListing(md: string, citySlug: string): ParsedMovie[] {
  // Each card looks like: [![Title](image)\n\n16+\n\n**Title** ... ](https://ticketon.kz/<city>/event/...)
  const out: ParsedMovie[] = [];
  const seen = new Set<string>();
  const re = /!\[([^\]]+)\]\((https:\/\/api-gw\.ticketon\.kz\/[^)]+)\)[\s\S]{0,400}?\]\((https:\/\/ticketon\.kz\/[a-z-]+\/event\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const title = m[1].trim();
    const image = m[2].trim();
    const url = m[3].trim();
    if (!url.includes(`/${citySlug}/event/`)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    // age rating: look for X+ pattern in 200 chars around match
    const ageMatch = md.slice(m.index, m.index + 500).match(/(\d{1,2}\+)/);
    out.push({ title, url, image_url: image, age_rating: ageMatch?.[1] || "" });
  }
  return out;
}

function parseDescription(md: string): string {
  // "## О событии" section, take last "###" subsection content
  const idx = md.search(/##\s*О\s*событии/i);
  if (idx === -1) return "";
  const chunk = md.slice(idx, idx + 4000);
  // Take everything after first "###" line
  const after = chunk.split(/###[^\n]*\n/);
  if (after.length < 2) return "";
  const text = after[after.length - 1].trim();
  // Cut at next markdown heading or "Видео" etc
  const cut = text.split(/\n(?:#{1,6}\s|\[)/)[0].trim();
  return cut.slice(0, 800);
}

async function scrapeCity(citySlug: string, apiKey: string, supabase: any, limit = 20) {
  const listingUrl = `https://ticketon.kz/${citySlug}/cinema`;
  const listingMd = await firecrawlScrape(listingUrl, apiKey);
  let movies = parseListing(listingMd, citySlug).slice(0, limit);
  console.log(`[${citySlug}] parsed ${movies.length} movies from listing`);

  // Enrich descriptions in parallel batches of 5
  const enriched: (ParsedMovie & { description: string })[] = [];
  for (let i = 0; i < movies.length; i += 5) {
    const batch = movies.slice(i, i + 5);
    const descs = await Promise.all(
      batch.map(m => firecrawlScrape(m.url, apiKey).then(parseDescription).catch(() => ""))
    );
    batch.forEach((m, k) => enriched.push({ ...m, description: descs[k] }));
  }

  // Replace city rows
  await supabase.from("cinema_movies").delete().eq("city", citySlug);
  if (enriched.length) {
    const rows = enriched.map(m => ({
      title: m.title,
      url: m.url,
      image_url: m.image_url || null,
      age_rating: m.age_rating || null,
      description: m.description || null,
      city: citySlug,
    }));
    const { error } = await supabase.from("cinema_movies").insert(rows);
    if (error) throw error;
  }
  return enriched.length;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    const body = await req.json().catch(() => ({}));
    const { action, movies, city, cities } = body || {};

    // NEW: action "refresh" — scrape Ticketon via Firecrawl for one or many cities
    if (action === "refresh") {
      if (!FIRECRAWL_API_KEY) {
        return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY missing" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const targets: string[] = Array.isArray(cities) && cities.length
        ? cities.filter((c: string) => SUPPORTED_CITIES.includes(c))
        : (city && SUPPORTED_CITIES.includes(city) ? [city] : ["almaty"]);
      const report: Record<string, number | string> = {};
      for (const c of targets) {
        try { report[c] = await scrapeCity(c, FIRECRAWL_API_KEY, supabase); }
        catch (e) { report[c] = `error: ${e instanceof Error ? e.message : String(e)}`; }
      }
      return new Response(JSON.stringify({ success: true, report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: "update" — bulk update cinema movies from admin
    if (action === "update" && Array.isArray(movies)) {
      // Clear old data
      await supabase.from("cinema_movies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const rows = movies.map((m: any) => ({
        title: m.title,
        url: m.url,
        image_url: m.image_url || null,
        age_rating: m.age_rating || null,
        description: m.description || null,
        city: m.city || "almaty",
      }));

      const { error } = await supabase.from("cinema_movies").insert(rows);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, count: rows.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: "list" — get current cinema movies
    if (action === "list") {
      const { data } = await supabase
        .from("cinema_movies")
        .select("*")
        .eq(city ? "city" : "id", city || "id")
        .order("scraped_at", { ascending: false });

      return new Response(JSON.stringify({ movies: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: refresh, update, list" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-cinema error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
