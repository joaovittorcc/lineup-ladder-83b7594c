# 🏷️ Como Configurar Menções no Discord

## ✅ Sistema de Menções Implementado!

O bot agora pode **mencionar (@) os usuários** nas notificações do Discord! 🎉

---

## 📋 Como Funciona

### Sem ID configurado:
```
**Evojota** desafiou **Sant** pelo top 2...
```

### Com ID configurado:
```
@Evojota desafiou @Sant pelo top 2...
```
*(Os usuários receberão notificação!)*

---

## 🔧 Como Obter o ID do Discord

### Passo 1: Ativar Modo Desenvolvedor

1. Abra o **Discord**
2. Clique em ⚙️ **Configurações do Usuário** (engrenagem ao lado do nome)
3. Vá em **Avançado** (ou **Advanced**)
4. Ative **Modo Desenvolvedor** (Developer Mode)
5. Feche as configurações

### Passo 2: Copiar ID do Usuário

1. Clique com **botão direito** no nome do usuário
2. Clique em **Copiar ID** (ou **Copy ID**)
3. O ID será copiado (exemplo: `123456789012345678`)

### Passo 3: Adicionar no Código

Edite o arquivo `src/data/discordUsers.ts`:

```typescript
export const discordUserMappings: DiscordUserMapping[] = [
  // Exemplo: Evojota
  { username: 'evojota', discordId: '123456789012345678', displayName: 'Evojota' },
  
  // Adicione os IDs dos outros usuários
  { username: 'lunatic', discordId: 'ID_AQUI', displayName: 'Lunatic' },
  { username: 'sant', discordId: 'ID_AQUI', displayName: 'Sant' },
  // ... etc
];
```

### Passo 4: Reiniciar Servidor

```bash
# Ctrl+C para parar
npm run dev
```

---

## 📝 Arquivo de Configuração

**Localização:** `src/data/discordUsers.ts`

### Estrutura:

```typescript
{
  username: 'evojota',           // Username na app (minúsculo)
  discordId: '123456789012345678', // ID do Discord (ou null)
  displayName: 'Evojota'         // Nome para exibir
}
```

### Exemplo Completo:

```typescript
export const discordUserMappings: DiscordUserMapping[] = [
  // Admins
  { username: 'evojota', discordId: '123456789012345678', displayName: 'Evojota' },
  { username: 'lunatic', discordId: '234567890123456789', displayName: 'Lunatic' },
  { username: 'sant', discordId: '345678901234567890', displayName: 'Sant' },
  { username: 'zanin', discordId: '456789012345678901', displayName: 'Zanin' },
  
  // Midnight Drivers
  { username: 'flpn', discordId: null, displayName: 'Flpn' }, // Sem ID = sem menção
  { username: 'rocxs', discordId: null, displayName: 'Rocxs' },
  // ... etc
];
```

---

## 🎯 Onde as Menções Aparecem

### Desafios:
```
@Lunatic desafiou @Sant pelo top 2 da Lista 01.
```

### Desafio Aceito:
```
@Sant aceitou o desafio de @Lunatic na Lista 01.

Confronto: @Lunatic (3º) vs @Sant (2º)
```

### Resultado:
```
@Lunatic venceu @Sant e subiu para posição #2 na Lista 01.
Placar: 2 × 1

Antes (ordem): @Lunatic (3º) vs @Sant (2º)
```

---

## ⚡ Configuração Rápida

### Para configurar TODOS os usuários:

1. **Peça para cada piloto enviar o ID dele**
   - Eles podem copiar seguindo os passos acima
   - Ou você pode copiar clicando com botão direito no nome deles

2. **Edite o arquivo** `src/data/discordUsers.ts`
   - Substitua `null` pelo ID de cada um
   - Exemplo: `discordId: '123456789012345678'`

3. **Reinicie o servidor**
   ```bash
   npm run dev
   ```

4. **Teste!**
   - Crie um desafio
   - Veja se a menção funciona no Discord

---

## 🧪 Testar Menções

### Teste Rápido:

1. Configure o ID de 2 usuários (exemplo: você e outro piloto)
2. Reinicie o servidor
3. Crie um desafio entre esses 2 usuários
4. Verifique o Discord - vocês devem receber notificação!

---

## 📊 Status Atual

**Arquivo criado:** ✅ `src/data/discordUsers.ts`
**Código atualizado:** ✅ Funções de notificação usando menções
**Build:** ✅ Sem erros

**Todos os usuários mapeados:**
- ✅ Admins (4)
- ✅ Midnight Drivers (3)
- ✅ Street Runners (8)
- ✅ Night Drivers (11)
- ✅ Jokers (6)

**Total:** 32 usuários prontos para configurar IDs!

---

## 🎨 Vantagens das Menções

### Com Menções (@):
- ✅ Usuários recebem **notificação push**
- ✅ Mensagem fica **destacada** para eles
- ✅ Podem clicar na menção para ver o perfil
- ✅ Mais **engajamento** e **atenção**

### Sem Menções (**Nome**):
- ✅ Ainda funciona normalmente
- ✅ Nome aparece em negrito
- ✅ Sem notificação push

---

## 🔍 Troubleshooting

### Menção não funciona?

1. **Verificar se o ID está correto**
   - Deve ter 18 dígitos
   - Exemplo: `123456789012345678`

2. **Verificar se está entre aspas**
   ```typescript
   discordId: '123456789012345678'  // ✅ Correto
   discordId: 123456789012345678    // ❌ Errado
   ```

3. **Verificar se o username está correto**
   - Deve ser exatamente igual ao da app
   - Minúsculo: `'evojota'` não `'Evojota'`

4. **Reiniciar o servidor**
   ```bash
   npm run dev
   ```

### ID não aparece no Discord?

- Certifique-se de que o **Modo Desenvolvedor** está ativado
- Tente clicar com botão direito em outro lugar (chat, lista de membros)

---

## 📝 Exemplo de Configuração Completa

```typescript
// src/data/discordUsers.ts

export const discordUserMappings: DiscordUserMapping[] = [
  // Configurado com ID - receberá menção
  { 
    username: 'evojota', 
    discordId: '123456789012345678', 
    displayName: 'Evojota' 
  },
  
  // Sem ID - aparecerá em negrito
  { 
    username: 'lunatic', 
    discordId: null, 
    displayName: 'Lunatic' 
  },
];
```

---

## 🚀 Próximos Passos

1. **Obter IDs** de todos os pilotos
2. **Configurar** no arquivo `discordUsers.ts`
3. **Reiniciar** servidor
4. **Testar** com um desafio real
5. **Aproveitar** as notificações automáticas!

---

**Midnight Club 夜中** - Sistema de menções ativo! 🏷️
