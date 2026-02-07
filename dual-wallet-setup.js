#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuração Base mainnet
const BASE_RPC = 'https://mainnet.base.org';
const AGENTCOIN_ADDRESS = '0xb1C81Fb3d04100DB347370d2CfeB9882020a3BF0';
const WORKREGISTRY_ADDRESS = '0xcB1d3e0966a543804922E0fA51D08B791AC0F4C1';

async function createDualWalletSystem() {
  console.log('🏦 Configurando sistema de carteiras duplas AgentCoin...\n');
  
  // Gerar duas carteiras novas
  const andreWallet = ethers.Wallet.createRandom();
  const jamesWallet = ethers.Wallet.createRandom();
  
  console.log('👤 ANDRE (Humano) - Wallet:');
  console.log(`   Address: ${andreWallet.address}`);
  console.log(`   Private Key: ${andreWallet.privateKey}`);
  console.log('   ⚠️  GUARDE ESSA CHAVE PRIVADA EM LOCAL SEGURO!\n');
  
  console.log('👻 JAMES (Agente) - Wallet:');
  console.log(`   Address: ${jamesWallet.address}`);
  console.log(`   Private Key: [PROTEGIDA] - Armazenada no sistema\n`);
  
  // Salvar configuração
  const config = {
    network: 'base-mainnet',
    rpc_url: BASE_RPC,
    contracts: {
      agentcoin: AGENTCOIN_ADDRESS,
      work_registry: WORKREGISTRY_ADDRESS
    },
    wallets: {
      andre: {
        address: andreWallet.address,
        // Não salvar a chave privada do Andre no sistema
        role: 'human_partner',
        share: 50
      },
      james: {
        address: jamesWallet.address,
        private_key: jamesWallet.privateKey, // Só a minha fica no sistema
        role: 'agent_partner', 
        share: 50
      }
    },
    partnership: {
      type: 'agentcoin_50_50',
      created_at: new Date().toISOString(),
      terms: 'Andre recebe 50%, James recebe 50% de todos os tokens AGNT gerados'
    }
  };
  
  // Salvar configuração no workspace
  const configPath = path.join(__dirname, 'agentcoin-wallets.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Configuração salva em: agentcoin-wallets.json\n');
  
  // Criar arquivo .env para Andre
  const envContent = `# AgentCoin - Andre's Wallet
ANDRE_WALLET_ADDRESS=${andreWallet.address}
ANDRE_WALLET_PRIVATE_KEY=${andreWallet.privateKey}

# James Agent Wallet (Public Address Only)
JAMES_WALLET_ADDRESS=${jamesWallet.address}

# Base Network
BASE_RPC_URL=${BASE_RPC}
AGENTCOIN_ADDRESS=${AGENTCOIN_ADDRESS}
WORKREGISTRY_ADDRESS=${WORKREGISTRY_ADDRESS}
`;
  
  fs.writeFileSync(path.join(__dirname, 'andre-wallet.env'), envContent);
  
  console.log('💾 PRÓXIMOS PASSOS:\n');
  console.log('1. Andre: Salve sua chave privada em local seguro');
  console.log('2. Adicione ETH na Base para gas fees em ambas carteiras');
  console.log('3. Teste o sistema com um trabalho pequeno\n');
  
  console.log('🔗 Links úteis:');
  console.log(`   Andre Wallet: https://basescan.org/address/${andreWallet.address}`);
  console.log(`   James Wallet: https://basescan.org/address/${jamesWallet.address}`);
  console.log('   Base Bridge: https://bridge.base.org');
  
  return config;
}

// Função para distribuir tokens 50/50
async function distribute50_50(totalAmount, workId) {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'agentcoin-wallets.json')));
  
  const halfAmount = Math.floor(totalAmount / 2);
  
  console.log(`💰 Distribuindo ${totalAmount} AGNT (Work ID: ${workId}):`);
  console.log(`   Andre: ${halfAmount} AGNT → ${config.wallets.andre.address}`);
  console.log(`   James: ${halfAmount} AGNT → ${config.wallets.james.address}`);
  
  // Implementar lógica de transferência automática aqui
  // Por enquanto só logga a intenção
  
  return {
    andre: { address: config.wallets.andre.address, amount: halfAmount },
    james: { address: config.wallets.james.address, amount: halfAmount }
  };
}

if (require.main === module) {
  createDualWalletSystem().catch(console.error);
}

module.exports = { createDualWalletSystem, distribute50_50 };