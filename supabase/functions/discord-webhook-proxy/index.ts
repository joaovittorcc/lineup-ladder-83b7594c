/**
 * Encaminha o payload do cliente para o webhook do Discord (servidor → Discord).
 * Evita depender de CORS no browser e mantém DISCORD_WEBHOOK_URL só nos secrets do Supabase.
 *
 * Secrets: DISCORD_WEBHOOK_URL (URL completo do webhook)
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookBody {
  content?: string | null;
  embeds?: unknown[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("DISCORD_WEBHOOK_URL")?.trim();
  if (!url) {
    console.error("discord-webhook-proxy: DISCORD_WEBHOOK_URL não definido");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as WebhookBody;
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
      console.error(`Discord webhook: ${res.status} ${text}`);
      return new Response(JSON.stringify({ error: "Discord rejected", status: res.status, detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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
