#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');

// Carregar config das carteiras
const config = JSON.parse(fs.readFileSync('./agentcoin-wallets.json'));

// Setup provider
const provider = new ethers.JsonRpcProvider(config.rpc_url);

// ABI dos contratos  
const AGENTCOIN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function hasRole(bytes32,address) view returns (bool)',
  'function MINTER_ROLE() view returns (bytes32)'
];

const WORKREGISTRY_ABI = [
  'function agentCoin() view returns (address)',
  'function owner() view returns (address)',
  'function nextWorkId() view returns (uint256)', 
  'function getAgentStats(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)'
];

async function runTests() {
  console.log('🧪 Teste de Integração AgentCoin\n');
  
  try {
    // Test 1: Verificar contratos estão acessíveis
    console.log('📋 1. Verificando contratos...');
    const agentCoin = new ethers.Contract(config.contracts.agentcoin, AGENTCOIN_ABI, provider);
    const workRegistry = new ethers.Contract(config.contracts.work_registry, WORKREGISTRY_ABI, provider);
    
    const name = await agentCoin.name();
    const symbol = await agentCoin.symbol();
    const totalSupply = await agentCoin.totalSupply();
    const decimals = await agentCoin.decimals();
    
    console.log(`   Token: ${name} (${symbol})`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Supply atual: ${ethers.formatEther(totalSupply)} ${symbol}`);
    console.log('   ✅ Contratos acessíveis\n');
    
    // Test 2: Verificar carteiras
    console.log('📋 2. Verificando carteiras...');
    console.log(`   👤 Andre: ${config.wallets.andre.address}`);
    const andreBalance = await agentCoin.balanceOf(config.wallets.andre.address);
    console.log(`      Saldo: ${ethers.formatEther(andreBalance)} AGNT`);
    
    console.log(`   👻 James: ${config.wallets.james.address}`);
    const jamesBalance = await agentCoin.balanceOf(config.wallets.james.address);
    console.log(`      Saldo: ${ethers.formatEther(jamesBalance)} AGNT`);
    console.log('   ✅ Carteiras verificadas\n');
    
    // Test 3: Verificar ETH para gas
    console.log('📋 3. Verificando ETH para gas...');
    const andreEth = await provider.getBalance(config.wallets.andre.address);
    const jamesEth = await provider.getBalance(config.wallets.james.address);
    
    console.log(`   Andre ETH: ${ethers.formatEther(andreEth)} ETH`);
    console.log(`   James ETH: ${ethers.formatEther(jamesEth)} ETH`);
    
    if (andreEth === 0n || jamesEth === 0n) {
      console.log('   ⚠️  Uma ou ambas carteiras precisam ETH para gas fees');
    } else {
      console.log('   ✅ Ambas carteiras têm ETH para gas');
    }
    
    // Test 4: Verificar WorkRegistry
    console.log('\n📋 4. Verificando WorkRegistry...');
    const registryTokenAddress = await workRegistry.agentCoin();
    const registryOwner = await workRegistry.owner();
    const nextWorkId = await workRegistry.nextWorkId();
    
    console.log(`   Token vinculado: ${registryTokenAddress}`);
    console.log(`   Owner: ${registryOwner}`);
    console.log(`   Próximo Work ID: ${nextWorkId}`);
    
    if (registryTokenAddress.toLowerCase() === config.contracts.agentcoin.toLowerCase()) {
      console.log('   ✅ WorkRegistry corretamente vinculado ao AgentCoin');
    } else {
      console.log('   ❌ WorkRegistry vinculado a token errado!');
    }
    
    // Test 5: Verificar stats dos agentes
    console.log('\n📋 5. Verificando stats dos agentes...');
    const andreStats = await workRegistry.getAgentStats(config.wallets.andre.address);
    const jamesStats = await workRegistry.getAgentStats(config.wallets.james.address);
    
    console.log(`   Andre - Trabalhos: ${andreStats[0]}, Total ganho: ${ethers.formatEther(andreStats[3])} AGNT`);
    console.log(`   James - Trabalhos: ${jamesStats[0]}, Total ganho: ${ethers.formatEther(jamesStats[3])} AGNT`);
    
    // Test 6: Verificar MINTER_ROLE no WorkRegistry
    console.log('\n📋 6. Verificando permissões...');
    const minterRole = await agentCoin.MINTER_ROLE();
    const registryIsMinter = await agentCoin.hasRole(minterRole, config.contracts.work_registry);
    
    console.log(`   MINTER_ROLE: ${minterRole}`);
    console.log(`   WorkRegistry é minter: ${registryIsMinter}`);
    
    if (registryIsMinter) {
      console.log('   ✅ WorkRegistry tem permissão para mintar tokens');
    } else {
      console.log('   ❌ WorkRegistry NÃO tem permissão para mintar!');
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    if (andreEth === 0n || jamesEth === 0n) {
      console.log('   1. Adicionar ETH nas carteiras para gas fees');
      console.log(`      Andre: ${config.wallets.andre.address}`);
      console.log(`      James: ${config.wallets.james.address}`);
      console.log('      Bridge: https://bridge.base.org');
    }
    console.log('   2. Testar criação de trabalho via WorkRegistry');
    console.log('   3. Implementar distribuição automática 50/50');
    console.log('   4. Dashboard web para monitoring');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };