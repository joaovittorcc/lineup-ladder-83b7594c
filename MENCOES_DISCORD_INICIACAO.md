# Menções Discord em Notificações de Iniciação

## Problema
Quando um desafio de iniciação era criado, a notificação no Discord não mencionava os participantes fora do embed, então eles não recebiam notificação push do Discord.

## Solução Implementada
Modificada a função `notifyInitiationChallengePending()` em `src/lib/discord.ts` para incluir menções fora do embed, seguindo o mesmo padrão das outras funções de notificação.

### Mudança
```typescript
// ANTES
export function notifyInitiationChallengePending(data: {
  challengerName: string;
  challengedName: string;
  listLabel: string;
}) {
  return sendDiscordWebhook(null, [  // ❌ null = sem menções
    {
      title: 'Novo desafio — Iniciação',
      description: `**${data.challengerName}** desafiou **${data.challengedName}**...`,
      // ...
    },
  ], 'challenges');
}

// DEPOIS
export function notifyInitiationChallengePending(data: {
  challengerName: string;
  challengedName: string;
  listLabel: string;
}) {
  const mentionsContent = buildMentionsContent([data.challengerName, data.challengedName]);  // ✅ Gera menções
  
  return sendDiscordWebhook(mentionsContent, [  // ✅ Passa menções como content
    {
      title: 'Novo desafio — Iniciação',
      description: `**${data.challengerName}** desafiou **${data.challengedName}**...`,
      // ...
    },
  ], 'challenges');
}
```

## Como Funciona
1. `buildMentionsContent([usernames])` busca os Discord IDs dos usuários em `discordUsers.ts`
2. Gera string com menções no formato `🔔 <@123456789> <@987654321>`
3. Essa string é passada como `content` do webhook (fora do embed)
4. Discord envia notificação push para os usuários mencionados

## Padrão Usado
Todas as funções de notificação de desafio agora seguem o mesmo padrão:
- `notifyChallengePending()` ✅
- `notifyChallengeAccepted()` ✅
- `notifyChallengeResult()` ✅
- `notifyInitiationChallengePending()` ✅ (corrigido)
- `notifyInitiationChallengeResult()` ✅
- `notifyFriendlyChallengePending()` ✅
- `notifyFriendlyChallengeAccepted()` ✅
- `notifyFriendlyChallengeResult()` ✅

## Arquivo Modificado
- `src/lib/discord.ts` (linha ~285, função `notifyInitiationChallengePending`)

## Teste
Para testar:
1. Criar um desafio de iniciação (Joker desafia membro)
2. Verificar no Discord que ambos os participantes recebem notificação push
3. Verificar que as menções aparecem FORA do embed (acima da box colorida)
