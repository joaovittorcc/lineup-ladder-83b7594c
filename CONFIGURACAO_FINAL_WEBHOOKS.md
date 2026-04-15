# Configuração Final dos Webhooks Discord

## ✅ Configuração Completa

### Webhook 1 - RESULTADOS (apenas quem ganhou/perdeu)
- **URL**: `...1493812023945990164/...` 
- **Variável**: `VITE_DISCORD_WEBHOOK_RESULTS_URL`
- **Funções**: 
  - `notifyChallengeResult()` - Resultados de desafios das listas ladder (MD3)
  - `notifyInitiationChallengeResult()` - Resultados da lista de iniciação (MD1)
- **Quando envia**: 
  - Quando um desafio ladder é finalizado (completed ou W.O.)
  - Quando um desafio de iniciação é finalizado
- **Conteúdo**: 
  - Quem ganhou e quem perdeu
  - Placar (ex: 2×1 para MD3, 1×0 para MD1)
  - Pistas utilizadas (apenas MD3)
  - Posições antes do desafio (apenas ladder)
  - Formato: MD3 (ladder) ou MD1 (iniciação)
  - Menções aos pilotos envolvidos

### Webhook 2 - DESAFIOS CRIADOS (apenas quando alguém é desafiado)
- **URL**: `...1493812852300189756/...`
- **Variável**: `VITE_DISCORD_WEBHOOK_CHALLENGES_URL`
- **Função**: `notifyChallengePending()`
- **Quando envia**: Quando um novo desafio é criado (status: pending)
- **Conteúdo**:
  - Quem desafiou quem
  - Posição em disputa
  - Lista onde ocorre o desafio
  - Aviso de prazo de 24h para aceitar
  - Menções aos pilotos envolvidos

## 🚫 Notificações Desabilitadas

A notificação de "DESAFIO ACEITO" (`notifyChallengeAccepted`) foi **desabilitada** conforme solicitado. O sistema agora envia APENAS:
1. Quando um desafio é criado (webhook 2)
2. Quando um desafio é finalizado com resultado (webhook 1)

## 📝 Alterações Realizadas

### 1. `src/lib/discord.ts`
- ✅ Alterado `notifyChallengeResult()` para usar webhook `'results'` (antes era 'challenges')
- ✅ Alterado `notifyInitiationChallengeResult()` para usar webhook `'results'` (antes era 'challenges')
- ✅ Atualizado formato da mensagem de iniciação para: "X atacou e ganhou/perdeu do Y | Iniciação"
- ✅ Adicionadas menções aos pilotos nas notificações de iniciação
- ✅ Atualizado comentário do arquivo para refletir o uso correto dos webhooks

### 2. `src/lib/challengeSync.ts`
- ✅ Comentadas as duas chamadas para `notifyChallengeAccepted()`:
  - Na função `syncChallengeInsert()` (linha ~80)
  - Na função `syncChallengeStatusUpdate()` (linha ~125)

### 3. `.env`
- ✅ Configurado com ambos os webhooks e comentários explicativos

## 🧪 Scripts de Teste

Criados três scripts para testar cada tipo de notificação:

### Teste de Resultado Ladder (Webhook 1)
```bash
node test-result-webhook.cjs
```
- Envia uma notificação de resultado de desafio ladder (MD3)
- Deve aparecer no canal do webhook ...164
- Menciona Evojota e Zanin

### Teste de Resultado Iniciação (Webhook 1)
```bash
node test-initiation-result.cjs
```
- Envia notificações de resultado da lista de iniciação (MD1)
- Deve aparecer no canal do webhook ...164
- Formato: "X atacou e ganhou/perdeu do Y | Iniciação"
- Testa 3 cenários diferentes

### Teste de Desafio Criado (Webhook 2)
```bash
node test-challenge-created-webhook.cjs
```
- Envia uma notificação de novo desafio
- Deve aparecer no canal do webhook ...756
- Menciona Evojota e Zanin

## 📊 Fluxo Completo

### Listas Ladder (01, 02)
```
1. Piloto A desafia Piloto B
   └─> 🔔 Webhook 2 (CHALLENGES): "Novo desafio na lista"

2. Piloto B aceita o desafio
   └─> ❌ Nenhuma notificação (desabilitado)

3. Desafio é finalizado com resultado (MD3)
   └─> 🔔 Webhook 1 (RESULTS): "Desafio finalizado - Placar X×Y"
```

### Lista de Iniciação
```
1. Piloto A desafia Piloto B (aguarda aprovação admin)
   └─> 🔔 Webhook 2 (CHALLENGES): "Novo desafio — Iniciação"

2. Admin aprova e corrida acontece (MD1)
   └─> 🔔 Webhook 1 (RESULTS): "X atacou e ganhou/perdeu do Y | Iniciação"
```

## ✅ Verificação

Para confirmar que está funcionando corretamente:

1. Execute os scripts de teste
2. Verifique que cada mensagem aparece no canal correto
3. Confirme que as menções funcionam (usuários são notificados)
4. No app, crie um desafio real e verifique:
   - Ao criar: mensagem no webhook 2
   - Ao aceitar: nenhuma mensagem
   - Ao finalizar: mensagem no webhook 1

## 🎯 Resumo

| Ação | Webhook | Status |
|------|---------|--------|
| Desafio criado (ladder) | Webhook 2 (...756) | ✅ Ativo |
| Desafio criado (iniciação) | Webhook 2 (...756) | ✅ Ativo |
| Desafio aceito | Nenhum | ❌ Desabilitado |
| Resultado desafio ladder (MD3) | Webhook 1 (...164) | ✅ Ativo |
| Resultado iniciação (MD1) | Webhook 1 (...164) | ✅ Ativo |
| Campeonatos | Webhook 1 (...164) | ✅ Ativo |

---

**Última atualização**: Configuração finalizada conforme requisitos do usuário
