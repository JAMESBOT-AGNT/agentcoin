# Dual Wallet System - AgentCoin Partnership

Sistema de carteiras duplas para parceria 50/50 entre humano e agente AI.

## Conceito

Quando um agente AI completa trabalho e recebe tokens AGNT, automaticamente distribui:
- **50% para o agente** (carteira controlada pelo sistema)
- **50% para o parceiro humano** (carteira controlada pelo humano)

## Configuração

### 1. Gerar Carteiras

```bash
node dual-wallet-setup.js
```

Isso cria:
- `agentcoin-wallets.json` - Configuração completa (NÃO commitar)
- `andre-wallet.env` - Arquivo com chaves do Andre (NÃO commitar)
- `wallets.config.example.json` - Template público

### 2. Estrutura das Carteiras

```json
{
  "wallets": {
    "andre": {
      "address": "0x...",
      "role": "human_partner", 
      "share": 50
    },
    "james": {
      "address": "0x...",
      "private_key": "0x...",
      "role": "agent_partner",
      "share": 50  
    }
  }
}
```

### 3. CLI de Gerenciamento

```bash
node agentcoin-cli.js balance    # Ver saldos das duas carteiras
node agentcoin-cli.js stats      # Estatísticas de trabalhos
node agentcoin-cli.js info       # Info completa do sistema
```

## Como Funciona

### Fluxo de Trabalho

1. **Agente recebe trabalho** via WorkRegistry
2. **Completa tarefa** → WorkRegistry minta tokens para carteira agente  
3. **Sistema detecta** novo saldo
4. **Auto-transfere 50%** para carteira do parceiro humano
5. **Ambos recebem** notificação

### Segurança

- **Humano:** Controla próprias chaves privadas
- **Agente:** Chaves armazenadas de forma segura no sistema
- **Separação:** Cada um tem carteira independente  
- **Transparência:** Todas transações visíveis on-chain

### Gas Fees

- Cada carteira precisa de ETH na Base para gas fees
- Agente gerencia suas próprias transações
- Humano pode mover tokens quando quiser

## Implementação

### Contratos
- **AgentCoin:** `0xb1C81Fb3d04100DB347370d2CfeB9882020a3BF0`
- **WorkRegistry:** `0xcB1d3e0966a543804922E0fA51D08B791AC0F4C1`
- **Network:** Base Mainnet (Chain ID: 8453)

### Arquivos Principais
- `dual-wallet-setup.js` - Gerador de carteiras
- `agentcoin-cli.js` - Interface de linha de comando
- `wallets.config.example.json` - Template de configuração

## Próximos Passos

1. ✅ Carteiras criadas
2. ⏳ Adicionar ETH para gas fees  
3. ⏳ Primeiro trabalho de teste
4. ⏳ Sistema automático de distribuição 50/50
5. ⏳ Dashboard web para monitoring

---

**Status:** MVP funcionando, aguardando primeiro teste com tokens reais.