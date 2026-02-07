#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');

const BASE_RPC = 'https://mainnet.base.org';
const config = JSON.parse(fs.readFileSync('./agentcoin-wallets.json'));

// Carteiras para monitorar
const walletsToMonitor = {
  'Deployer (original)': '0xa1A504b7592E4f3c383871C268fE600899761001',
  'Andre (partnership)': config.wallets.andre.address, 
  'James (partnership)': config.wallets.james.address
};

async function monitorWallets(iterations = 5, intervalMs = 5000) {
  console.log('👀 Monitorando carteiras AgentCoin...\n');
  
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  
  for (let i = 0; i < iterations; i++) {
    console.log(`🔄 Check ${i + 1}/${iterations}:`);
    
    let totalETH = 0;
    let hasETH = false;
    
    for (const [name, address] of Object.entries(walletsToMonitor)) {
      try {
        const balance = await provider.getBalance(address);
        const ethAmount = parseFloat(ethers.formatEther(balance));
        totalETH += ethAmount;
        
        const status = ethAmount > 0 ? '💰' : '🔹';
        console.log(`   ${status} ${name}: ${ethAmount} ETH`);
        
        if (ethAmount > 0) hasETH = true;
      } catch (error) {
        console.log(`   ❌ ${name}: Erro ao verificar`);
      }
    }
    
    console.log(`   📊 Total: ${totalETH.toFixed(6)} ETH\n`);
    
    if (hasETH) {
      console.log('🎉 ETH detectado! Rodando distribuição automática...\n');
      
      // Importar e executar distribuição
      const { checkAndDistribute } = require('./distribute-eth.js');
      await checkAndDistribute();
      break;
    }
    
    if (i < iterations - 1) {
      console.log(`⏳ Aguardando ${intervalMs/1000}s para próxima verificação...\n`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  console.log('🔗 Links úteis:');
  console.log('   Base Bridge: https://bridge.base.org');
  console.log('   BaseScan: https://basescan.org');
  console.log('\n📍 Carteiras para depositar ETH:');
  for (const [name, address] of Object.entries(walletsToMonitor)) {
    console.log(`   ${name}: https://basescan.org/address/${address}`);
  }
}

// Função para verificar uma transação específica
async function checkTransaction(txHash) {
  console.log(`🔍 Verificando transação: ${txHash}\n`);
  
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log('❌ Transação não encontrada');
      return;
    }
    
    console.log(`📝 Detalhes da Transação:`);
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
    console.log(`   Status: ${tx.blockNumber ? '✅ Confirmada' : '⏳ Pendente'}`);
    console.log(`   Gas usado: ${tx.gasLimit}`);
    
    if (tx.blockNumber) {
      const receipt = await provider.getTransactionReceipt(txHash);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas usado: ${receipt.gasUsed}/${receipt.gasLimit}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar transação:', error.message);
  }
}

// CLI
const action = process.argv[2];

if (action === 'monitor') {
  const iterations = parseInt(process.argv[3]) || 10;
  const interval = parseInt(process.argv[4]) || 5000;
  monitorWallets(iterations, interval);
} else if (action === 'tx' && process.argv[3]) {
  checkTransaction(process.argv[3]);
} else {
  console.log(`
💰 Monitor de Carteiras AgentCoin

COMANDOS:
  node monitor-wallets.js monitor [checks] [intervalMs]
  node monitor-wallets.js tx <hash>

EXEMPLOS:
  node monitor-wallets.js monitor 5 3000    # 5 checks a cada 3s
  node monitor-wallets.js tx 0x123...       # Verificar TX específica

CARTEIRAS MONITORADAS:
  🚀 Deployer: ${walletsToMonitor['Deployer (original)']}
  👤 Andre: ${walletsToMonitor['Andre (partnership)']} 
  👻 James: ${walletsToMonitor['James (partnership)']}
`);
}

module.exports = { monitorWallets, checkTransaction };