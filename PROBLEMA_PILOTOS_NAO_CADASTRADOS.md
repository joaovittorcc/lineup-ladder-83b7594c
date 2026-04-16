# ⚠️ Problema: Pilotos Não Cadastrados no Banco

## 🎯 Problema Identificado

**Erro**: "Piloto 'Leite' não encontrado no banco de dados. Ele precisa estar cadastrado primeiro."

**Causa**: Muitos pilotos que estão em `discordUsers.ts` **não estão cadastrados** na tabela `players` do banco de dados.

---

## 📊 Pilotos Cadastrados (18)

✅ Chico Penha  
✅ Connor  
✅ Evojota (duplicado - 2 registros)  
✅ Flpn  
✅ Gui  
✅ Gus  
✅ Lunatic  
✅ Mnz  
✅ Pedrin (duplicado - 2 registros)  
✅ Rocxs  
✅ Sant  
✅ Veiga  
✅ Vitin  
✅ Watzel  
✅ Zanin (duplicado - 2 registros)  

---

## ❌ Pilotos Faltantes (21)

### Street Runners:
- ❌ Repre
- ❌ Load
- ❌ 0000
- ❌ Blake
- ❌ Nash
- ❌ Cyber
- ❌ Leite

### Night Drivers:
- ❌ ph (12yph)
- ❌ K1
- ❌ F.mid
- ❌ Porto

### Jokers:
- ❌ P1N0
- ❌ Furiatti
- ❌ Syds
- ❌ Dasmilf
- ❌ Rev
- ❌ DGP1
- ❌ Okaka

### Outros:
- ❌ Vitória
- ❌ Tigas
- ❌ Uchoa

---

## ✅ Solução

### Opção 1: Script SQL Automático (Recomendado)

Execute o arquivo `ADICIONAR_PILOTOS_FALTANTES.sql` no Supabase SQL Editor.

Este script vai:
1. Adicionar todos os 21 pilotos faltantes
2. Marcar `initiation_complete = false` para todos
3. Definir `status = 'available'`
4. Evitar duplicatas com `ON CONFLICT DO NOTHING`

### Opção 2: Adicionar Manualmente

Para cada piloto faltante, execute:
```sql
INSERT INTO players (name, initiation_complete, status, defense_count)
VALUES ('NomeDoPiloto', false, 'available', 0);
```

---

## 🔧 Depois de Adicionar

1. **Recarregue a página** do site
2. **Tente marcar "Completou iniciação"** novamente
3. **Deve funcionar** para todos os pilotos

---

## ⚠️ Problema de Duplicatas

Alguns pilotos têm **registros duplicados**:
- Evojota (2 registros)
- Pedrin (2 registros)
- Zanin (2 registros)

**Recomendação**: Limpar duplicatas depois de adicionar os faltantes.

### Script para Limpar Duplicatas:
```sql
-- Ver duplicatas
SELECT name, COUNT(*) as total
FROM players
GROUP BY name
HAVING COUNT(*) > 1;

-- Manter apenas o registro mais recente de cada piloto
DELETE FROM players
WHERE id NOT IN (
  SELECT MAX(id)
  FROM players
  GROUP BY name
);
```

---

## 📋 Checklist

- [ ] Executar `ADICIONAR_PILOTOS_FALTANTES.sql`
- [ ] Verificar que todos os 39 pilotos estão cadastrados
- [ ] Limpar duplicatas (opcional)
- [ ] Recarregar página do site
- [ ] Testar marcar "Completou iniciação" para qualquer piloto

---

**Última atualização**: 16 de Abril de 2026  
**Script SQL**: `ADICIONAR_PILOTOS_FALTANTES.sql`
