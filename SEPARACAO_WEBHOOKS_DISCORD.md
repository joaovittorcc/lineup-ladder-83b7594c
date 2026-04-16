# 📡 Separação de Webhooks do Discord

## 🎯 Configuração Correta

### Webhook 1: CHALLENGES (Desafios de Lista)
**URL**: `https://discord.com/api/webhooks/1493812852300189756/...`  
**Tipo**: `'challenges'`  
**Uso**: APENAS para desafios das listas ladder (Lista 01, Lista 02, Iniciação)

#### Notificações que usam este webhook:
1. ✅ `notifyChallengePending()` - Desafio ladder criado
2. ✅ `notifyChallengeAccepted()` - Desafio ladder aceito
3. ✅ `notifyChallengeResult()` - Resultado de desafio ladder ✅ **CORRIGIDO**
4. ✅ `notifyChallengeCancelled()` - Desafio ladder cancelado
5. ✅ `notifyInitiationChallengePending()` - Desafio de iniciação criado
6. ✅ `notifyInitiationChallengeResult()` - Resultado de iniciação ✅ **CORRIGIDO**
7. ✅ `notifyListStandingsFromPlayers()` - Snapshot da lista

---

### Webhook 2: FRIENDLY (Desafios Amistosos)
**URL**: `https://discord.com/api/webhooks/1493989507945726024/...`  
**Tipo**: `'friendly'`  
**Uso**: APENAS para desafios amistosos (ELO)

#### Notificações que usam este webhook:
1. ✅ `notifyFriendlyChallengePending()` - Amistoso criado
2. ✅ `notifyFriendlyChallengeAccepted()` - Amistoso aceito
3. ✅ `notifyFriendlyChallengeResult()` - Resultado de amistoso

---

### Webhook 3: RESULTS (Campeonatos)
**URL**: `https://discord.com/api/webhooks/1493812023945990164/...`  
**Tipo**: `'results'`  
**Uso**: APENAS para campeonatos e eventos especiais

#### Notificações que usam este webhook:
1. ✅ `notifySeasonCreated()` - Campeonato criado
2. ✅ `notifyPilotRegistered()` - Piloto inscrito
3. ✅ `notifyChampionshipStarted()` - Campeonato iniciado
4. ✅ `notifyRaceResult()` - Resultado de corrida do campeonato
5. ✅ `notifyChampionshipFinalized()` - Campeonato finalizado

---

## 🔧 Correções Aplicadas

### Antes (Incorreto)
```typescript
// ❌ Resultado de desafio ladder estava indo para RESULTS
notifyChallengeResult(..., 'results');

// ❌ Resultado de iniciação estava indo para RESULTS
notifyInitiationChallengeResult(..., 'results');
```

### Depois (Correto)
```typescript
// ✅ Resultado de desafio ladder vai para CHALLENGES
notifyChallengeResult(..., 'challenges');

// ✅ Resultado de iniciação vai para CHALLENGES
notifyInitiationChallengeResult(..., 'challenges');
```

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBHOOK CHALLENGES                        │
│  (1493812852300189756)                                      │
├─────────────────────────────────────────────────────────────┤
│  • Desafio ladder criado                                    │
│  • Desafio ladder aceito                                    │
│  • Resultado de desafio ladder ✅ CORRIGIDO                 │
│  • Desafio ladder cancelado                                 │
│  • Desafio de iniciação criado                              │
│  • Resultado de iniciação ✅ CORRIGIDO                      │
│  • Snapshot da lista                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     WEBHOOK FRIENDLY                         │
│  (1493989507945726024)                                      │
├─────────────────────────────────────────────────────────────┤
│  • Amistoso criado                                          │
│  • Amistoso aceito                                          │
│  • Resultado de amistoso                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     WEBHOOK RESULTS                          │
│  (1493812023945990164)                                      │
├─────────────────────────────────────────────────────────────┤
│  • Campeonato criado                                        │
│  • Piloto inscrito                                          │
│  • Campeonato iniciado                                      │
│  • Resultado de corrida do campeonato                       │
│  • Campeonato finalizado                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Verificação

Para verificar se está funcionando corretamente:

1. **Criar desafio ladder** → Deve aparecer no canal CHALLENGES
2. **Finalizar desafio ladder** → Deve aparecer no canal CHALLENGES ✅
3. **Criar amistoso** → Deve aparecer no canal FRIENDLY
4. **Finalizar amistoso** → Deve aparecer no canal FRIENDLY
5. **Criar campeonato** → Deve aparecer no canal RESULTS
6. **Finalizar corrida campeonato** → Deve aparecer no canal RESULTS

---

## 🎉 Status

✅ **Separação correta implementada!**

Agora cada tipo de notificação vai para o webhook correto:
- Desafios de lista → CHALLENGES
- Amistosos → FRIENDLY
- Campeonatos → RESULTS

---

**Última atualização**: 16 de Abril de 2026  
**Arquivo modificado**: `src/lib/discord.ts`
