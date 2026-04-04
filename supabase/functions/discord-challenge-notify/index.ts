const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL")!;

interface ChallengePayload {
  id: string;
  list_id: string;
  challenger_name: string;
  challenged_name: string;
  challenger_pos: number;
  challenged_pos: number;
  status: string;
  type: string;
  tracks: string[] | null;
  score: number[] | null;
}

function getListLabel(listId: string): string {
  if (listId.toLowerCase().includes("01") || listId === "list-1") return "Lista 01";
  if (listId.toLowerCase().includes("02") || listId === "list-2") return "Lista 02";
  return listId;
}

function buildAcceptedEmbed(c: ChallengePayload) {
  const listLabel = getListLabel(c.list_id);
  const tracksText = c.tracks?.length
    ? c.tracks.map((t, i) => `🏁 Pista ${i + 1}: **${t}**`).join("\n")
    : "Pistas não definidas";

  return {
    embeds: [
      {
        title: "⚔️ DESAFIO DE LISTA CONFIRMADO!",
        color: 0x00d4ff,
        fields: [
          { name: "🏎️ Desafiante", value: `**${c.challenger_name}** (#${c.challenger_pos})`, inline: true },
          { name: "🛡️ Defensor", value: `**${c.challenged_name}** (#${c.challenged_pos})`, inline: true },
          { name: "📋 Lista", value: listLabel, inline: true },
          { name: "🗺️ Pistas da MD3", value: tracksText, inline: false },
          { name: "🎯 Posição em Jogo", value: `Posição **#${c.challenged_pos}** da ${listLabel}`, inline: false },
        ],
        footer: { text: "Gran Turismo Racing League • Desafio de Lista" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function buildCompletedEmbed(c: ChallengePayload) {
  const listLabel = getListLabel(c.list_id);
  const score = c.score ?? [0, 0];
  const challengerWon = score[0] > score[1];
  const winner = challengerWon ? c.challenger_name : c.challenged_name;
  const loser = challengerWon ? c.challenged_name : c.challenger_name;
  const finalScore = challengerWon ? `${score[0]}x${score[1]}` : `${score[1]}x${score[0]}`;

  const newConfig = challengerWon
    ? `**${winner}** sobe para a posição **#${c.challenged_pos}** e **${loser}** desce para **#${c.challenger_pos}**`
    : `**${winner}** mantém a posição **#${c.challenged_pos}** na ${listLabel}`;

  return {
    embeds: [
      {
        title: "🏁 RESULTADO: DISPUTA DE POSIÇÃO",
        color: 0x9d00ff,
        fields: [
          { name: "🏆 Vencedor", value: `**${winner}**`, inline: true },
          { name: "❌ Perdedor", value: `**${loser}**`, inline: true },
          { name: "📊 Placar Final", value: `**${finalScore}**`, inline: true },
          { name: "🔄 Nova Configuração", value: newConfig, inline: false },
        ],
        footer: { text: `Gran Turismo Racing League • ${listLabel}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const challenge: ChallengePayload = await req.json();

    let payload;
    if (challenge.status === "racing") {
      payload = buildAcceptedEmbed(challenge);
    } else if (challenge.status === "completed") {
      payload = buildCompletedEmbed(challenge);
    } else {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log(`Discord response: ${res.status} - ${text}`);

    return new Response(JSON.stringify({ success: true, discord_status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error sending Discord notification:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
