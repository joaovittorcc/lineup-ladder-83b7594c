# Sistema Completo de Webhooks Discord

## ✅ Configuração Final - 3 Webhooks

### 📊 Resumo dos Webhooks

| Webhook | URL | Propósito | Notificações |
|---------|-----|-----------|--------------|
| **Webhook 1 (RESULTS)** | `...164` | Resultados de desafios ladder | Quem ganhou/perdeu nas listas |
| **Webhook 2 (CHALLENGES)** | `...756` | Criação de desafios ladder | Quando alguém é desafiado |
| **Webhook 3 (FRIENDLY)** | `...024` | Desafios amistosos completos | Criação, aceitação e resultado |

---

## 🎯 Webhook 1 - RESULTADOS (Ladder)

**URL**: `...1493812023945990164/...`
**Variável**: `VITE_DISCORD_WEBHOOK_RESULTS_URL`

### Quando Envia
- ✅ Resultado de desafio ladder (MD3) finalizado
- ✅ Resultado de desafio de iniciação (MD1) finalizado

### Conteúdo
- Quem ganhou e quem perdeu
- Placar (2×1 para MD3, 1×0 para MD1)
- Pistas utilizadas (apenas MD3)
- Posições antes do desafio (apenas ladder)
- Progresso do Joker (apenas iniciação)
- Menções aos pilotos

### Exemplo
```
🔔 @Evojota @Zanin

Desafio finalizado
Evojota venceu Zanin e subiu para posição #5 na Lista 01.
Placar: 2 × 1

Lista: Lista 01
Antes (ordem): Evojota (6º) vs Zanin (5º)
Pistas (MD3):
Pista 1: DOUBLE BREEZE
Pista 2: DOCKS LINES
Pista 3: DOUBLE TROUBLE
```

---

## 🎯 Webhook 2 - DESAFIOS (Ladder)

**URL**: `...1493812852300189756/...`
**Variável**: `VITE_DISCORD_WEBHOOK_CHALLENGES_URL`

### Quando Envia
- ✅ Novo desafio ladder criado (status: pending)
- ✅ Novo desafio de iniciação criado (aguarda admin)

### Conteúdo
- Quem desafiou quem
- Posição em disputa
- Lista onde ocorre
- Prazo de 24h (ladder) ou aprovação admin (iniciação)
- Menções aos pilotos

### Exemplo
```
🔔 @Evojota @Zanin

Novo desafio na lista
Evojota desafiou Zanin pelo top 5 da Lista 01.
Aguarda aceitação na app (24h) ou W.O.

Lista: Lista 01
Posição em jogo: Top 5
```

---

## 🎯 Webhook 3 - AMISTOSOS

**URL**: `...1493989507945726024/...`
**Variável**: `VITE_DISCORD_WEBHOOK_FRIENDLY_URL`

### Quando Envia
- ✅ Desafio amistoso criado (pending)
- ✅ Desafio amistoso aceito (mostra pista)
- ✅ Desafio amistoso finalizado (resultado com ELO)

### Conteúdo

#### 1. Criação
- Quem desafiou quem
- ELO atual de ambos os pilotos
- Menções aos pilotos

```
🔔 @Evojota @Zanin

🎮 Novo Desafio Amistoso
Evojota desafiou Zanin para um amistoso!

Evojota (Desafiante): ⭐ ELO: 1500
Zanin (Desafiado): ⭐ ELO: 1450
```

#### 2. Aceitação
- Confirmação de aceitação
- ELO atual de ambos
- **Pista sorteada**
- Menções aos pilotos

```
🔔 @Evojota @Zanin

✅ Desafio Amistoso Aceito
Zanin aceitou o desafio de Evojota!

Evojota: ⭐ ELO: 1500
Zanin: ⭐ ELO: 1450
🏁 Pista: DOUBLE BREEZE
```

#### 3. Resultado
- Quem venceu
- Pista utilizada
- **ELO antes e depois** de ambos
- **Diferença de ELO** (+/-)
- Troféu 🏆 para o vencedor
- Menções aos pilotos

```
🔔 @Evojota @Zanin

🏆 Amistoso Finalizado
Evojota venceu Zanin!

🏁 Pista: DOUBLE BREEZE
Evojota 🏆: ⭐ 1500 → 1525 (+25)
Zanin: ⭐ 1450 → 1425 (-25)
```

---

## 🚫 O Que NÃO É Notificado

### Webhook 1 (Results)
- ❌ Desafios amistosos
- ❌ Criação de desafios
- ❌ Aceitação de desafios

### Webhook 2 (Challenges)
- ❌ Desafios amistosos
- ❌ Resultados de desafios
- ❌ Aceitação de desafios (desabilitado)

### Webhook 3 (Friendly)
- ❌ Desafios ladder
- ❌ Desafios de iniciação
- ❌ Campeonatos

---

## 📋 Fluxo Completo

### Desafio Ladder (Listas 01/02)
```
1. Criação → Webhook 2 (CHALLENGES)
2. Aceitação → ❌ Nenhum (desabilitado)
3. Resultado → Webhook 1 (RESULTS)
```

### Desafio Iniciação
```
1. Criação → Webhook 2 (CHALLENGES)
2. Aprovação admin → ❌ Nenhum
3. Resultado → Webhook 1 (RESULTS) + Progresso Joker
```

### Desafio Amistoso
```
1. Criação → Webhook 3 (FRIENDLY) + ELO atual
2. Aceitação → Webhook 3 (FRIENDLY) + Pista
3. Resultado → Webhook 3 (FRIENDLY) + ELO atualizado
```

---

## 🔧 Arquivos Modificados

### 1. `.env`
- ✅ Adicionado `VITE_DISCORD_WEBHOOK_FRIENDLY_URL`

### 2. `src/lib/discord.ts`
- ✅ Adicionado tipo `'friendly'` ao `WebhookType`
- ✅ Atualizado `getDiscordWebhookUrl()` para suportar friendly
- ✅ Criadas 3 novas funções:
  - `notifyFriendlyChallengePending()`
  - `notifyFriendlyChallengeAccepted()`
  - `notifyFriendlyChallengeResult()`

### 3. `src/hooks/useFriendly.ts`
- ✅ Importadas funções de notificação
- ✅ Notificação em `createFriendlyChallenge()` (criação)
- ✅ Notificação em `acceptFriendlyChallenge()` (aceitação + pista)
- ✅ Notificação em `resolveFriendly()` (resultado + ELO)

---

## 🧪 Scripts de Teste

### Teste Resultados Ladder
```bash
node test-result-webhook.cjs
```

### Teste Desafios Ladder
```bash
node test-challenge-created-webhook.cjs
```

### Teste Iniciação
```bash
node test-initiation-result.cjs
```

### Teste Amistosos
```bash
node test-friendly-webhook.cjs
```

---

## ✅ Garantias

- ✅ **Separação total**: Cada tipo de desafio vai para seu webhook
- ✅ **Menções funcionando**: Todos os pilotos são mencionados
- ✅ **ELO visível**: Amistosos mostram ELO antes e depois
- ✅ **Pista informada**: Amistosos mostram pista ao aceitar
- ✅ **Progresso Joker**: Iniciação mostra X/5 membros derrotados
- ✅ **Sem duplicação**: Cada evento notifica apenas uma vez

---

**Última atualização**: Sistema completo de 3 webhooks implementado e testado
