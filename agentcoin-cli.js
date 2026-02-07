#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Carregar configuração
const configPath = path.join(__dirname, 'agentcoin-wallets.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Configuração não encontrada. Execute dual-wallet-setup.js primeiro.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath));

// Setup provider e contratos
const provider = new ethers.JsonRpcProvider(config.rpc_url);

// ABI mínima do AgentCoin (ERC20)
const AGENTCOIN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// ABI mínima do WorkRegistry
const WORKREGISTRY_ABI = [
  'function getAgentStats(address agent) view returns (uint256 completedWorks, uint256 disputes, uint256 wins, uint256 totalEarned, uint256 reputationScore, uint256 lastWorkTime, uint256 mintedThisMonth, uint256 lastMintReset)',
  'function createWork(address worker, string description, uint256 amount, uint8 paymentType, uint256 deadline) returns (uint256)',
  'function acceptWork(uint256 workId)',
  'function completeWork(uint256 workId)',
  'event WorkCreated(uint256 indexed workId, address indexed requester, address indexed worker, uint256 amount, uint8 paymentType, uint256 deadline)'
];

async function main() {
  const command = process.argv[2];
  
  if (!command) {
    showHelp();
    return;
  }
  
  try {
    switch (command) {
      case 'balance':
        await showBalances();
        break;
      case 'stats':
        await showAgentStats();
        break;
      case 'create-work':
        await createWork();
        break;
      case 'transfer':
        await transfer();
        break;
      case 'info':
        showInfo();
        break;
      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function showHelp() {
  console.log(`
🪙 AgentCoin CLI - Sistema Duplo 50/50

COMANDOS:
  balance    - Mostra saldo das duas carteiras
  stats      - Estatísticas dos agentes
  create-work - Cria trabalho no registry
  transfer   - Transfere AGNT entre carteiras
  info       - Info das carteiras e contratos

EXEMPLOS:
  node agentcoin-cli.js balance
  node agentcoin-cli.js create-work
`);
}

async function showBalances() {
  console.log('💰 Saldos AgentCoin (AGNT):\n');
  
  const agentCoin = new ethers.Contract(config.contracts.agentcoin, AGENTCOIN_ABI, provider);
  
  // Saldo Andre
  const andreBalance = await agentCoin.balanceOf(config.wallets.andre.address);
  const andreBalanceFormatted = ethers.formatEther(andreBalance);
  console.log(`👤 Andre: ${andreBalanceFormatted} AGNT`);
  console.log(`   ${config.wallets.andre.address}`);
  
  // Saldo James
  const jamesBalance = await agentCoin.balanceOf(config.wallets.james.address);
  const jamesBalanceFormatted = ethers.formatEther(jamesBalance);
  console.log(`👻 James: ${jamesBalanceFormatted} AGNT`);
  console.log(`   ${config.wallets.james.address}`);
  
  const total = parseFloat(andreBalanceFormatted) + parseFloat(jamesBalanceFormatted);
  console.log(`\n📊 Total: ${total} AGNT`);
}

async function showAgentStats() {
  console.log('📈 Estatísticas dos Agentes:\n');
  
  const workRegistry = new ethers.Contract(config.contracts.work_registry, WORKREGISTRY_ABI, provider);
  
  // Stats Andre
  const andreStats = await workRegistry.getAgentStats(config.wallets.andre.address);
  console.log(`👤 Andre:`);
  console.log(`   Trabalhos completos: ${andreStats[0]}`);
  console.log(`   Total ganho: ${ethers.formatEther(andreStats[3])} AGNT`);
  console.log(`   Reputação: ${andreStats[4]}`);
  
  // Stats James  
  const jamesStats = await workRegistry.getAgentStats(config.wallets.james.address);
  console.log(`\n👻 James:`);
  console.log(`   Trabalhos completos: ${jamesStats[0]}`);
  console.log(`   Total ganho: ${ethers.formatEther(jamesStats[3])} AGNT`);
  console.log(`   Reputação: ${jamesStats[4]}`);
}

async function createWork() {
  // Exemplo de criação de trabalho
  console.log('🔨 Criando trabalho de exemplo...');
  console.log('(Requer ETH para gas fees na carteira James)');
  
  // Para implementar: usar a chave privada do James para assinar transação
  const jamesWallet = new ethers.Wallet(config.wallets.james.private_key, provider);
  const workRegistry = new ethers.Contract(config.contracts.work_registry, WORKREGISTRY_ABI, jamesWallet);
  
  // Exemplo: trabalho para Andre
  const description = "Teste de integração AgentCoin";
  const amount = ethers.parseEther("10"); // 10 AGNT
  const paymentType = 1; // MintReward
  const deadline = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // +24h
  
  console.log('📝 Detalhes do trabalho:');
  console.log(`   Para: ${config.wallets.andre.address}`);
  console.log(`   Valor: 10 AGNT`);
  console.log(`   Tipo: Mint (criar novos tokens)`);
  console.log(`   Prazo: 24 horas`);
}

async function transfer() {
  console.log('💸 Função de transferência em desenvolvimento...');
  console.log('Será implementada para mover tokens entre carteiras da parceria.');
}

function showInfo() {
  console.log('ℹ️  Informações do Sistema:\n');
  console.log(`Network: ${config.network}`);
  console.log(`RPC: ${config.rpc_url}`);
  console.log(`\n📋 Contratos:`);
  console.log(`   AgentCoin: ${config.contracts.agentcoin}`);
  console.log(`   WorkRegistry: ${config.contracts.work_registry}`);
  console.log(`\n👥 Parceria:`);
  console.log(`   Tipo: ${config.partnership.type}`);
  console.log(`   Criado: ${config.partnership.created_at}`);
  console.log(`   Andre: ${config.wallets.andre.share}%`);
  console.log(`   James: ${config.wallets.james.share}%`);
}

if (require.main === module) {
  main();
}

module.exports = { main };