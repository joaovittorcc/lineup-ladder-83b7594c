# 🚨 AÇÃO CRÍTICA NECESSÁRIA - 14 ABR 2026

## ⚠️ VOCÊ DEVE EXECUTAR SQL NO SUPABASE!

**Antes de testar qualquer funcionalidade, execute:**

1. Abra Supabase → SQL Editor
2. Execute o SQL de `SOLUCAO_DEFINITIVA.sql`
3. Verifique se funcionou (query de verificação no arquivo)

**Sem executar o SQL, os desafios continuarão sumindo!**

---

## ✅ CORREÇÕES APLICADAS (14 ABR 2026)

### 1. RaceConfigModal - Loop Infinito CORRIGIDO ✅
- **Problema:** Loop infinito de renderização (23.415+ renders)
- **Causa:** `useMemo` e `useCallback` com dependências circulares
- **Solução:** Reescrito completamente sem memoização
- **Status:** ✅ **CORRIGIDO NO CÓDIGO**
- **Resultado:** Select funciona perfeitamente agora

### 2. Desafios de Iniciação Sumindo ⚠️
- **Problema:** Desafios somem após 2 segundos
- **Causa:** Banco rejeita `challenger_id = NULL`
- **Solução:** SQL torna colunas nullable
- **Status:** ⚠️ **VOCÊ PRECISA EXECUTAR O SQL**
- **Arquivo:** `SOLUCAO_DEFINITIVA.sql`

---

## 📚 DOCUMENTAÇÃO CRIADA

### 🌟 `LEIA_ME_PRIMEIRO.md`
Resumo executivo e checklist rápido

### 🌟 `INSTRUCOES_CRITICAS.md`
Passo a passo completo para executar SQL e testar

### 📖 `RESUMO_ALTERACOES.md`
Explicação técnica detalhada das mudanças

### 💾 `SOLUCAO_DEFINITIVA.sql`
SQL que você DEVE executar no Supabase

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Ler `LEIA_ME_PRIMEIRO.md`
2. ⚠️ Executar SQL (obrigatório)
3. ✅ Seguir `INSTRUCOES_CRITICAS.md`
4. ✅ Testar fluxo completo
5. ✅ Remover logs de debug (opcional)

---

# Plano: Migrar o Site para 100% Online (Supabase)

## Situação Atual
O site usa **localStorage** para os dados principais — listas de jogadores, desafios, ELO e amistosos. Isso significa que cada navegador tem seus próprios dados, não compartilhados. Apenas a aba "Campeonato" já usa o banco de dados online.

## O Que Vai Mudar
Todos os dados passarão a ser salvos e lidos do banco de dados online, com atualização em tempo real para todos os visitantes.

---

## Etapas

### 1. Criar tabelas para Amistosos e ELO
- Criar tabela `friendly_matches` (challenger, challenged, winner, loser, elo before/after, elo_change, created_at)
- Criar tabela `elo_ratings` (player_name, rating) ou usar uma coluna na tabela `players`
- Habilitar Realtime nessas tabelas
- RLS: leitura pública, escrita para authenticated

### 2. Popular as tabelas existentes com dados iniciais
- Inserir os jogadores das 3 listas (Iniciação, Lista 01, Lista 02) na tabela `players` e `player_lists` que já existem no banco
- Garantir que as posições e status estejam corretos

### 3. Reescrever `useChampionship.ts` para usar Supabase
- Substituir localStorage por queries ao Supabase
- Carregar `players` e `player_lists` do banco
- Carregar `challenges` do banco
- Carregar `joker_progress` do banco
- Todas as mutações (desafiar, resolver, cooldown, reordenar, mover jogador) passam a fazer UPDATE/INSERT no banco
- Adicionar subscription Realtime para sincronizar entre todos os clientes

### 4. Reescrever `useFriendly.ts` para usar Supabase
- Substituir localStorage por queries às novas tabelas `friendly_matches` e `elo_ratings`
- Mutações (criar amistoso, resolver, atualizar ELO) vão direto ao banco
- Subscription Realtime para atualizar ranking ELO em tempo real

### 5. Remover toda dependência de localStorage para dados de jogo
- Manter localStorage apenas para sessão de login (nick/pin) — que já é local por design
- Remover `STORAGE_KEY`, `FRIENDLY_STORAGE_KEY` e toda lógica de `loadState`/`saveState` com localStorage

### 6. Ajustar RLS das tabelas existentes
- As tabelas `players`, `challenges`, `player_lists`, `joker_progress` já existem com RLS
- Adicionar políticas para permitir leitura pública (anon) para que visitantes não-logados vejam o ranking
- Manter escrita restrita a authenticated

---

## Detalhes Técnicos

### Novas tabelas (migração SQL):
```text
friendly_matches: id, challenger_name, challenged_name, winner_name, loser_name,
                  challenger_elo_before, challenged_elo_before, challenger_elo_after,
                  challenged_elo_after, elo_change, created_at

elo_ratings: id, player_name (unique), rating (default 1000)
```

### Arquitetura dos hooks:
```text
useChampionship()
  ├── fetch inicial: players + player_lists + challenges + joker_progress
  ├── subscribe Realtime em todas as 4 tabelas
  ├── mutações → supabase.from(...).update/insert/delete
  └── estado local = mirror do banco (atualizado via Realtime)

useFriendly()
  ├── fetch inicial: friendly_matches + elo_ratings
  ├── subscribe Realtime
  └── mutações → supabase.from(...).insert/update
```

### Impacto nos componentes:
- Nenhum componente precisa mudar — apenas os hooks internos serão reescritos
- A interface permanece idêntica
