import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { action, movies } = await req.json();

    // Action: "update" — bulk update cinema movies from admin
    if (action === "update" && Array.isArray(movies)) {
      // Clear old data
      await supabase.from("cinema_movies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const rows = movies.map((m: any) => ({
        title: m.title,
        url: m.url,
        image_url: m.image_url || null,
        age_rating: m.age_rating || null,
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
        .order("scraped_at", { ascending: false });

      return new Response(JSON.stringify({ movies: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: "scrape" — attempt to scrape (may fail due to bot protection)
    if (action === "scrape") {
      try {
        const res = await fetch("https://ticketon.kz/almaty/cinema", {
          redirect: "manual",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": "city=almaty",
          },
        });

        // Check for bot protection
        if (res.status >= 300) {
          return new Response(JSON.stringify({ 
            error: "Ticketon has bot protection (Queue-it). Use manual update instead.",
            hint: "Call with action:'update' and provide movies array manually",
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ status: res.status, hint: "Check HTML manually" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          error: "Scraping blocked by bot protection",
          hint: "Use action:'update' with manual data",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: update, list, scrape" }), {
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
