/**
 * Encaminha o payload do cliente para o webhook do Discord (servidor → Discord).
 * Evita depender de CORS no browser e mantém DISCORD_WEBHOOK_URL só nos secrets do Supabase.
 *
 * Secrets: 
 * - DISCORD_WEBHOOK_RESULTS_URL (resultados de desafios)
 * - DISCORD_WEBHOOK_CHALLENGES_URL (desafios criados)
 * - DISCORD_WEBHOOK_FRIENDLY_URL (amistosos)
 * - DISCORD_WEBHOOK_CHAMPIONSHIP_URL (anúncios de campeonatos)
 */

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookBody {
  content?: string | null;
  embeds?: unknown[];
  type?: 'results' | 'challenges' | 'friendly' | 'championship';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as WebhookBody;
    const type = body.type || 'challenges';
    
    // Selecionar o webhook correto baseado no tipo
    let url: string | undefined;
    if (type === 'results') {
      url = Deno.env.get("DISCORD_WEBHOOK_RESULTS_URL")?.trim();
    } else if (type === 'friendly') {
      url = Deno.env.get("DISCORD_WEBHOOK_FRIENDLY_URL")?.trim();
    } else if (type === 'championship') {
      url = Deno.env.get("DISCORD_WEBHOOK_CHAMPIONSHIP_URL")?.trim();
    } else {
      url = Deno.env.get("DISCORD_WEBHOOK_CHALLENGES_URL")?.trim();
    }
    
    if (!url) {
      console.error(`discord-webhook-proxy: DISCORD_WEBHOOK_${type.toUpperCase()}_URL não definido`);
      return new Response(JSON.stringify({ error: "Server misconfigured", type }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      content: body.content ?? null,
      embeds: Array.isArray(body.embeds) ? body.embeds : [],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`Discord webhook (${type}): ${res.status} ${text}`);
      return new Response(JSON.stringify({ error: "Discord rejected", status: res.status, detail: text, type }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("discord-webhook-proxy:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
