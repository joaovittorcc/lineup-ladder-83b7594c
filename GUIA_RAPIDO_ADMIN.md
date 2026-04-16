# Guia Rápido para Administradores

**Versão**: 1.0.0  
**Data**: 2026-04-15

---

## 🚀 Início Rápido

### Verificar Estado do Sistema

Execute no SQL Editor do Supabase:
```sql
-- Copie e cole o conteúdo de:
VERIFICAR_ESTADO_COMPLETO.sql
```

Isso mostrará:
- ✅ Estrutura das tabelas
- ✅ Progresso dos Jokers
- ✅ Pilotos na iniciação
- ✅ Desafios ativos
- ✅ Elegibilidade para desafio de vaga
- ✅ Integridade dos dados

---

## 🔧 Operações Comuns

### 1. Resetar Perfil de Piloto

**Via UI** (Recomendado):
1. Admin Panel → Gerenciar Piloto
2. Selecionar piloto
3. Clicar em "Resetar perfil"
4. Confirmar

**O que é resetado**:
- ✅ ELO amistoso → 1000
- ✅ Override de cargo → removido
- ✅ Meta local (SR/Joker) → limpo
- ✅ Progresso como Joker → apagado
- ✅ Registros de derrota → apagados
- ✅ Campos do piloto → resetados

**Via SQL** (Alternativa):
```sql
-- Substituir 'NomeDoPiloto' pelo nome real
DO $$
DECLARE
  v_player_id UUID;
BEGIN
  -- Encontrar ID do piloto
  SELECT id INTO v_player_id 
  FROM players 
  WHERE name = 'NomeDoPiloto';
  
  -- Limpar progresso como Joker
  DELETE FROM joker_progress 
  WHERE joker_name_key = LOWER('NomeDoPiloto');
  
  -- Limpar registros de derrota
  DELETE FROM joker_progress 
  WHERE defeated_player_id = v_player_id;
  
  -- Resetar campos do piloto
  UPDATE players 
  SET 
    status = 'available',
    defense_count = 0,
    cooldown_until = NULL,
    challenge_cooldown_until = NULL,
    defenses_while_seventh_streak = 0,
    list02_external_block_until = NULL,
    list02_external_eligible_after = NULL,
    initiation_complete = false,
    elegivel_desafio_vaga = false
  WHERE id = v_player_id;
END $$;
```

---

### 2. Limpar Progresso de um Joker Específico

**Via UI**:
1. Admin Panel → Gerenciar Piloto
2. Selecionar Joker
3. Clicar em "Zerar progresso Joker"
4. Confirmar

**Via SQL**:
```sql
-- Substituir 'pino' pelo nome do Joker
DELETE FROM joker_progress 
WHERE joker_name_key = 'pino';

-- Resetar pilotos que ele derrotou
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL
WHERE id IN (
  SELECT defeated_player_id 
  FROM joker_progress 
  WHERE joker_name_key = 'pino'
);
```

---

### 3. Resetar TUDO (Limpeza Completa)

**⚠️ ATENÇÃO**: Isso apaga TODOS os dados de desafios e progresso!

```sql
-- 1. Cancelar desafios ativos
UPDATE challenges 
SET status = 'cancelled'
WHERE type = 'initiation' 
  AND status IN ('pending', 'racing', 'accepted');

-- 2. Deletar TODOS os registros de joker_progress
DELETE FROM joker_progress;

-- 3. Resetar TODOS os pilotos da iniciação
UPDATE players 
SET 
  status = 'available',
  initiation_complete = false,
  cooldown_until = NULL,
  challenge_cooldown_until = NULL,
  defense_count = 0,
  elegivel_desafio_vaga = false
WHERE list_id = 'initiation';

-- 4. Verificar
SELECT COUNT(*) AS "Registros (deve ser 0)" FROM joker_progress;
SELECT name, status, initiation_complete FROM players WHERE list_id = 'initiation';
```

---

### 4. Marcar Piloto como Elegível para Desafio de Vaga

**Via UI** (Recomendado):
1. Admin Panel → Gerenciar Piloto
2. Selecionar piloto
3. Marcar "Completou a lista de iniciação"
4. Clicar em "Aplicar campos na BD"
5. ✅ Flag `elegivel_desafio_vaga` é automaticamente setada

**Via SQL**:
```sql
-- Substituir 'NomeDoPiloto' pelo nome real
UPDATE players 
SET 
  initiation_complete = true,
  elegivel_desafio_vaga = true
WHERE name = 'NomeDoPiloto';
```

---

### 5. Limpar Cooldowns

**Via UI**:
1. Admin Panel → "Limpar Todos os Cooldowns"
2. Confirmar

**Via SQL**:
```sql
UPDATE players 
SET 
  status = CASE 
    WHEN status = 'cooldown' THEN 'available' 
    ELSE status 
  END,
  cooldown_until = NULL,
  challenge_cooldown_until = NULL,
  defense_count = CASE 
    WHEN status = 'cooldown' THEN 0 
    ELSE defense_count 
  END,
  list02_external_block_until = NULL,
  list02_external_eligible_after = NULL,
  defenses_while_seventh_streak = 0;
```

---

### 6. Cancelar Desafio Ativo

**Via UI**:
1. Admin Panel → Ver desafios ativos
2. Clicar em "Cancelar" no desafio desejado

**Via SQL**:
```sql
-- Cancelar desafio específico (substituir ID)
UPDATE challenges 
SET status = 'cancelled'
WHERE id = 'ID_DO_DESAFIO';

-- Cancelar TODOS os desafios de iniciação
UPDATE challenges 
SET status = 'cancelled'
WHERE type = 'initiation' 
  AND status IN ('pending', 'racing', 'accepted');

-- Cancelar TODOS os desafios ativos
UPDATE challenges 
SET status = 'cancelled'
WHERE status IN ('pending', 'racing', 'accepted');
```

---

## 🔍 Consultas Úteis

### Ver Progresso de um Joker
```sql
SELECT 
  jp.joker_name_key,
  p.name AS piloto_derrotado,
  jp.created_at
FROM joker_progress jp
JOIN players p ON jp.defeated_player_id = p.id
WHERE jp.joker_name_key = 'pino'
ORDER BY jp.created_at;
```

### Ver Pilotos Elegíveis para Desafio de Vaga
```sql
SELECT 
  name,
  list_id,
  initiation_complete,
  elegivel_desafio_vaga
FROM players
WHERE elegivel_desafio_vaga = true
ORDER BY name;
```

### Ver 8º da Lista 02 (Alvo do Desafio de Vaga)
```sql
SELECT 
  name,
  position,
  status,
  defense_count,
  list02_external_block_until,
  list02_external_eligible_after
FROM players
WHERE list_id = 'list-02'
ORDER BY position DESC
LIMIT 1;
```

### Ver Desafios Expirados
```sql
SELECT 
  id,
  type,
  status,
  challenger_name,
  challenged_name,
  expires_at,
  NOW() - expires_at AS tempo_expirado
FROM challenges
WHERE status = 'pending'
  AND expires_at IS NOT NULL
  AND expires_at < NOW()
ORDER BY expires_at;
```

---

## 🐛 Troubleshooting

### Problema: Piloto ainda aparece como "vencido" após reset

**Solução**:
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Verificar no SQL Editor:
   ```sql
   SELECT * FROM joker_progress 
   WHERE defeated_player_id IN (
     SELECT id FROM players WHERE name = 'NomeDoPiloto'
   );
   ```
3. Se houver registros, deletar manualmente:
   ```sql
   DELETE FROM joker_progress 
   WHERE defeated_player_id IN (
     SELECT id FROM players WHERE name = 'NomeDoPiloto'
   );
   ```

### Problema: Erro "Cannot read properties of null (reading 'map')"

**Solução**:
- ✅ Já corrigido! Todas as funções de atualização de estado têm proteção.
- Se ainda ocorrer, verificar console do navegador para logs de warning.

### Problema: Desafio não expira automaticamente

**Solução**:
1. Verificar se o desafio tem `expires_at` definido:
   ```sql
   SELECT id, expires_at FROM challenges WHERE id = 'ID_DO_DESAFIO';
   ```
2. Se não tiver, adicionar manualmente:
   ```sql
   UPDATE challenges 
   SET expires_at = NOW() + INTERVAL '24 hours'
   WHERE id = 'ID_DO_DESAFIO';
   ```

### Problema: Piloto elegível para vaga mas não completou iniciação

**Solução**:
```sql
-- Corrigir inconsistência
UPDATE players 
SET elegivel_desafio_vaga = false
WHERE elegivel_desafio_vaga = true 
  AND initiation_complete = false;
```

---

## 📊 Monitoramento

### Dashboard Rápido
```sql
SELECT 
  'Total de Pilotos' AS metrica,
  COUNT(*) AS valor
FROM players
UNION ALL
SELECT 
  'Pilotos na Iniciação',
  COUNT(*)
FROM players
WHERE list_id = 'initiation'
UNION ALL
SELECT 
  'Pilotos Derrotados',
  COUNT(*)
FROM players
WHERE initiation_complete = true
UNION ALL
SELECT 
  'Desafios Ativos',
  COUNT(*)
FROM challenges
WHERE status IN ('pending', 'racing', 'accepted')
UNION ALL
SELECT 
  'Total de Vitórias Joker',
  COUNT(*)
FROM joker_progress;
```

---

## 📁 Arquivos de Referência

- **`ESTADO_ATUAL_PROTECOES.md`** - Documentação técnica completa
- **`RESUMO_FINAL_CORRECOES.md`** - Resumo de todas as correções
- **`VERIFICAR_ESTADO_COMPLETO.sql`** - Script de verificação completa
- **`SOLUCAO_DEFINITIVA.sql`** - Script de limpeza completa

---

## 🆘 Suporte

Se encontrar problemas não listados aqui:

1. Executar `VERIFICAR_ESTADO_COMPLETO.sql`
2. Verificar console do navegador (F12)
3. Verificar logs do Supabase
4. Consultar `ESTADO_ATUAL_PROTECOES.md` para detalhes técnicos

---

**Última Atualização**: 2026-04-15  
**Versão**: 1.0.0
