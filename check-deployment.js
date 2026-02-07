#!/usr/bin/env node

const { ethers } = require('ethers');

// Configuração da Base
const BASE_RPC = 'https://mainnet.base.org';
const AGENTCOIN_ADDRESS = '0xb1C81Fb3d04100DB347370d2CfeB9882020a3BF0';
const WORKREGISTRY_ADDRESS = '0xcB1d3e0966a543804922E0fA51D08B791AC0F4C1';

// Carteiras do sistema duplo
const ANDRE_ADDRESS = '0xE82dd053eB5F19aca03C1516988Af36E44C298d4';
const JAMES_ADDRESS = '0xE7aED50D34412a12917B3FCFFec4584EB8F74AA2';

async function checkDeployment() {
  console.log('🔍 Verificação de Deployment AgentCoin\n');
  
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  
  try {
    // 1. Verificar rede
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log(`📡 Rede: Base (Chain ID: ${network.chainId})`);
    console.log(`📦 Bloco atual: ${blockNumber}\n`);
    
    // 2. Verificar se contratos existem
    const agentCoinCode = await provider.getCode(AGENTCOIN_ADDRESS);
    const workRegistryCode = await provider.getCode(WORKREGISTRY_ADDRESS);
    
    console.log('🔧 Status dos Contratos:');
    console.log(`   AgentCoin: ${agentCoinCode.length > 2 ? '✅ Deployed' : '❌ Não encontrado'}`);
    console.log(`   WorkRegistry: ${workRegistryCode.length > 2 ? '✅ Deployed' : '❌ Não encontrado'}`);
    
    if (agentCoinCode.length <= 2) {
      console.log(`\n❌ AgentCoin não encontrado em ${AGENTCOIN_ADDRESS}`);
      return;
    }
    
    if (workRegistryCode.length <= 2) {
      console.log(`\n❌ WorkRegistry não encontrado em ${WORKREGISTRY_ADDRESS}`);
      return;
    }
    
    // 3. Verificar info básica do token
    const agentCoin = new ethers.Contract(AGENTCOIN_ADDRESS, [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function MAX_SUPPLY() view returns (uint256)',
      'function totalMinted() view returns (uint256)'
    ], provider);
    
    const name = await agentCoin.name();
    const symbol = await agentCoin.symbol();
    const decimals = await agentCoin.decimals();
    const totalSupply = await agentCoin.totalSupply();
    const maxSupply = await agentCoin.MAX_SUPPLY();
    const totalMinted = await agentCoin.totalMinted();
    
    console.log(`\n🪙 Token Info:`);
    console.log(`   Nome: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Supply atual: ${ethers.formatEther(totalSupply)} ${symbol}`);
    console.log(`   Total mintado: ${ethers.formatEther(totalMinted)} ${symbol}`);
    console.log(`   Max supply: ${ethers.formatEther(maxSupply)} ${symbol}`);
    
    // 4. Verificar saldos das carteiras
    console.log(`\n💰 Saldos das Carteiras:`);
    
    const andreBalanceAGNT = await agentCoin.balanceOf(ANDRE_ADDRESS);
    const andreBalanceETH = await provider.getBalance(ANDRE_ADDRESS);
    console.log(`   👤 Andre: ${ethers.formatEther(andreBalanceAGNT)} AGNT | ${ethers.formatEther(andreBalanceETH)} ETH`);
    
    const jamesBalanceAGNT = await agentCoin.balanceOf(JAMES_ADDRESS);
    const jamesBalanceETH = await provider.getBalance(JAMES_ADDRESS);
    console.log(`   👻 James: ${ethers.formatEther(jamesBalanceAGNT)} AGNT | ${ethers.formatEther(jamesBalanceETH)} ETH`);
    
    // 5. Verificar WorkRegistry
    const workRegistry = new ethers.Contract(WORKREGISTRY_ADDRESS, [
      'function owner() view returns (address)',
      'function agentCoin() view returns (address)',
      'function nextWorkId() view returns (uint256)'
    ], provider);
    
    const registryOwner = await workRegistry.owner();
    const linkedToken = await workRegistry.agentCoin();
    const nextWorkId = await workRegistry.nextWorkId();
    
    console.log(`\n🏭 WorkRegistry Info:`);
    console.log(`   Owner: ${registryOwner}`);
    console.log(`   Token vinculado: ${linkedToken}`);
    console.log(`   Próximo Work ID: ${nextWorkId}`);
    console.log(`   Vinculação correta: ${linkedToken.toLowerCase() === AGENTCOIN_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
    
    // 6. Status final
    console.log(`\n📊 RESUMO:`);
    console.log(`   ✅ Contratos deployed na Base mainnet`);
    console.log(`   ✅ Token configurado: ${name} (${symbol})`);
    console.log(`   ✅ Sistema de carteiras duplas: Andre + James`);
    console.log(`   🔗 AgentCoin: https://basescan.org/token/${AGENTCOIN_ADDRESS}`);
    console.log(`   🔗 WorkRegistry: https://basescan.org/address/${WORKREGISTRY_ADDRESS}`);
    
    if (andreBalanceETH === 0n || jamesBalanceETH === 0n) {
      console.log(`\n⚠️  AÇÃO NECESSÁRIA: Adicionar ETH para gas fees`);
      console.log(`   Bridge ETH: https://bridge.base.org`);
    } else {
      console.log(`\n🚀 Sistema pronto para uso!`);
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.log('\nDicas de troubleshooting:');
    console.log('- Verificar conectividade com https://mainnet.base.org');
    console.log('- Confirmar endereços dos contratos');
    console.log('- Tentar novamente em alguns minutos');
  }
}

if (require.main === module) {
  checkDeployment();
}

module.exports = { checkDeployment };