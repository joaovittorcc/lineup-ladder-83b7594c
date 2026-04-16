# Configurar Discord em Produção

## Problema
- **Localhost**: Funciona (webhooks diretos)
- **Produção**: Não funciona (CORS bloqueia requisições diretas do navegador para Discord)

## Solução: Usar Edge Function do Supabase

A Edge Function `discord-webhook-proxy` já existe no projeto e funciona como proxy servidor-lado, evitando problemas de CORS.

---

## Passo 1: Deploy da Edge Function

Execute no terminal (na raiz do projeto):

```bash
# Login no Supabase (se ainda não fez)
npx supabase login

# Link com seu projeto
npx supabase link --project-ref tfraqopkwqgwvutqnznh

# Deploy da função
npx supabase functions deploy discord-webhook-proxy
```

---

## Passo 2: Configurar Secrets no Supabase

A Edge Function precisa de **3 secrets** (um para cada webhook):

### Opção A: Via Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/settings/functions
2. Clique em **"Edge Functions"** → **"Secrets"**
3. Adicione os seguintes secrets:

```
DISCORD_WEBHOOK_RESULTS_URL=https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X

DISCORD_WEBHOOK_CHALLENGES_URL=https://discord.com/api/webhooks/1493812852300189756/mozb4Dm4mFoz0YUYyQeo_D6jF9brsxMCO33tJ0Ie4TBuCAmHCU8FRAbECh-12FFdmnnO

DISCORD_WEBHOOK_FRIENDLY_URL=https://discord.com/api/webhooks/1493989507945726024/3pE4dAbkrvAZUs7PdVacfrWSNBzrcXYySG4LhNM9RA4ZowOm3h0pZuxbpdXPQ4CS8g29
```

### Opção B: Via CLI

```bash
npx supabase secrets set DISCORD_WEBHOOK_RESULTS_URL=https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X

npx supabase secrets set DISCORD_WEBHOOK_CHALLENGES_URL=https://discord.com/api/webhooks/1493812852300189756/mozb4Dm4mFoz0YUYyQeo_D6jF9brsxMCO33tJ0Ie4TBuCAmHCU8FRAbECh-12FFdmnnO

npx supabase secrets set DISCORD_WEBHOOK_FRIENDLY_URL=https://discord.com/api/webhooks/1493989507945726024/3pE4dAbkrvAZUs7PdVacfrWSNBzrcXYySG4LhNM9RA4ZowOm3h0pZuxbpdXPQ4CS8g29
```

---

## Passo 3: Atualizar Edge Function para Suportar Múltiplos Webhooks

A Edge Function atual só suporta 1 webhook. Precisamos modificá-la para suportar os 3 tipos.

**Arquivo**: `supabase/functions/discord-webhook-proxy/index.ts`

Substitua o conteúdo por:

```typescript
/**
 * Encaminha o payload do cliente para o webhook do Discord (servidor → Discord).
 * Evita depender de CORS no browser e mantém DISCORD_WEBHOOK_URL só nos secrets do Supabase.
 *
 * Secrets: 
 * - DISCORD_WEBHOOK_RESULTS_URL (resultados de desafios)
 * - DISCORD_WEBHOOK_CHALLENGES_URL (desafios criados)
 * - DISCORD_WEBHOOK_FRIENDLY_URL (amistosos)
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookBody {
  content?: string | null;
  embeds?: unknown[];
  type?: 'results' | 'challenges' | 'friendly'; // Tipo de webhook
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

  try {
    const body = (await req.json()) as WebhookBody;
    const type = body.type || 'challenges'; // Default: challenges
    
    // Selecionar o webhook correto baseado no tipo
    let url: string | undefined;
    if (type === 'results') {
      url = Deno.env.get("DISCORD_WEBHOOK_RESULTS_URL")?.trim();
    } else if (type === 'friendly') {
      url = Deno.env.get("DISCORD_WEBHOOK_FRIENDLY_URL")?.trim();
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
```

Depois, faça deploy novamente:

```bash
npx supabase functions deploy discord-webhook-proxy
```

---

## Passo 4: Atualizar src/lib/discord.ts

Modificar a função `sendDiscordWebhook()` para passar o tipo de webhook para a Edge Function:

```typescript
export async function sendDiscordWebhook(
  content: string | null, 
  embeds: DiscordEmbed[], 
  type: WebhookType = 'challenges'
) {
  if (useSupabaseEdgeForDiscord()) {
    if (!isSupabaseConfigured) {
      console.error(
        '[Discord] VITE_DISCORD_USE_SUPABASE_EDGE=true mas VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY em falta.'
      );
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('discord-webhook-proxy', {
        body: { content, embeds, type }, // ✅ Adicionar type aqui
      });
      if (error) {
        console.error('[Discord] Edge Function discord-webhook-proxy:', error.message, data);
        return;
      }
    } catch (err) {
      console.error(
        '[Discord] Invocação da Edge Function falhou (função deployada? secret DISCORD_WEBHOOK_URL?)',
        err
      );
    }
    return;
  }

  // ... resto do código (webhooks diretos para localhost)
}
```

---

## Passo 5: Configurar Variável de Ambiente em Produção

No seu serviço de hospedagem (Vercel, Netlify, etc.), adicione:

```
VITE_DISCORD_USE_SUPABASE_EDGE=true
```

**Importante**: Remova ou comente as variáveis de webhook direto em produção (para evitar confusão):

```
# VITE_DISCORD_WEBHOOK_RESULTS_URL=...
# VITE_DISCORD_WEBHOOK_CHALLENGES_URL=...
# VITE_DISCORD_WEBHOOK_FRIENDLY_URL=...
```

---

## Passo 6: Testar

1. Faça commit e push das alterações
2. Aguarde o deploy em produção
3. Teste criando um desafio no site em produção
4. Verifique se a mensagem aparece no Discord

---

## Verificar Logs (Debug)

Se não funcionar, verifique os logs da Edge Function:

```bash
npx supabase functions logs discord-webhook-proxy
```

Ou no dashboard: https://supabase.com/dashboard/project/tfraqopkwqgwvutqnznh/logs/edge-functions

---

## Resumo

| Ambiente | Método | Configuração |
|----------|--------|--------------|
| **Localhost** | Webhooks diretos | `.env` com `VITE_DISCORD_WEBHOOK_*_URL` |
| **Produção** | Edge Function | `VITE_DISCORD_USE_SUPABASE_EDGE=true` + secrets no Supabase |

---

## Checklist

- [ ] Deploy da Edge Function (`npx supabase functions deploy discord-webhook-proxy`)
- [ ] Configurar 3 secrets no Supabase (RESULTS, CHALLENGES, FRIENDLY)
- [ ] Atualizar Edge Function para suportar múltiplos webhooks
- [ ] Atualizar `src/lib/discord.ts` para passar `type` para Edge Function
- [ ] Adicionar `VITE_DISCORD_USE_SUPABASE_EDGE=true` em produção
- [ ] Commit e push
- [ ] Testar em produção
