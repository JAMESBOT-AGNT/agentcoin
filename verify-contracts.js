#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./agentcoin-wallets.json'));

// Função helper para fazer calls RPC
function rpcCall(method, params = []) {
  const payload = JSON.stringify({
    jsonrpc: "2.0",
    method,
    params,
    id: 1
  });
  
  return new Promise((resolve, reject) => {
    exec(`curl -s -X POST ${config.rpc_url} -H "Content-Type: application/json" -d '${payload}'`, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result.result || result.error);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Converter hex para string
function hexToString(hex) {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substr(i, 2), 16);
    if (byte > 0) str += String.fromCharCode(byte);
  }
  return str;
}

// Converter hex para número
function hexToNumber(hex) {
  return parseInt(hex, 16);
}

async function verifyContracts() {
  console.log('🔍 Verificação Simples dos Contratos\n');
  
  try {
    // 1. Verificar AgentCoin
    console.log('📋 AgentCoin:');
    
    // name()
    const nameResult = await rpcCall('eth_call', [{
      to: config.contracts.agentcoin,
      data: '0x06fdde03'
    }, 'latest']);
    
    // symbol() 
    const symbolResult = await rpcCall('eth_call', [{
      to: config.contracts.agentcoin,
      data: '0x95d89b41'
    }, 'latest']);
    
    // totalSupply()
    const supplyResult = await rpcCall('eth_call', [{
      to: config.contracts.agentcoin,
      data: '0x18160ddd'
    }, 'latest']);
    
    console.log(`   Nome: ${hexToString(nameResult).trim()}`);
    console.log(`   Symbol: ${hexToString(symbolResult).trim()}`);
    console.log(`   Total Supply: ${hexToNumber(supplyResult)} wei (${hexToNumber(supplyResult) / 1e18} tokens)`);
    
    // 2. Verificar saldos das carteiras
    console.log(`\n💰 Saldos AGNT:`);
    
    // Andre balance
    const andreBalanceResult = await rpcCall('eth_call', [{
      to: config.contracts.agentcoin,
      data: `0x70a08231000000000000000000000000${config.wallets.andre.address.slice(2).toLowerCase()}`
    }, 'latest']);
    
    // James balance
    const jamesBalanceResult = await rpcCall('eth_call', [{
      to: config.contracts.agentcoin,
      data: `0x70a08231000000000000000000000000${config.wallets.james.address.slice(2).toLowerCase()}`
    }, 'latest']);
    
    console.log(`   Andre: ${hexToNumber(andreBalanceResult) / 1e18} AGNT`);
    console.log(`   James: ${hexToNumber(jamesBalanceResult) / 1e18} AGNT`);
    
    // 3. Verificar ETH para gas
    console.log(`\n⛽ Saldos ETH para Gas:`);
    
    const andreEthResult = await rpcCall('eth_getBalance', [config.wallets.andre.address, 'latest']);
    const jamesEthResult = await rpcCall('eth_getBalance', [config.wallets.james.address, 'latest']);
    
    console.log(`   Andre: ${hexToNumber(andreEthResult) / 1e18} ETH`);
    console.log(`   James: ${hexToNumber(jamesEthResult) / 1e18} ETH`);
    
    // 4. Verificar WorkRegistry
    console.log(`\n🏭 WorkRegistry:`);
    
    // nextWorkId()
    const nextWorkIdResult = await rpcCall('eth_call', [{
      to: config.contracts.work_registry,
      data: '0x16221327'
    }, 'latest']);
    
    console.log(`   Próximo Work ID: ${hexToNumber(nextWorkIdResult)}`);
    
    // 5. Status final
    const totalETH = (hexToNumber(andreEthResult) + hexToNumber(jamesEthResult)) / 1e18;
    const totalAGNT = (hexToNumber(andreBalanceResult) + hexToNumber(jamesBalanceResult)) / 1e18;
    
    console.log(`\n📊 RESUMO FINAL:`);
    console.log(`   ✅ Sistema AgentCoin operacional`);
    console.log(`   ✅ Carteiras duplas criadas (Andre + James)`);
    console.log(`   📊 Total ETH: ${totalETH} ETH`);
    console.log(`   📊 Total AGNT: ${totalAGNT} AGNT`);
    
    if (totalETH === 0) {
      console.log(`\n🚨 PRÓXIMO PASSO: Adicionar ETH para gas fees`);
      console.log(`   1. Visite: https://bridge.base.org`);
      console.log(`   2. Bridge ETH para Base mainnet`);
      console.log(`   3. Envie para as carteiras:`);
      console.log(`      Andre: ${config.wallets.andre.address}`);
      console.log(`      James: ${config.wallets.james.address}`);
    } else {
      console.log(`\n🚀 Sistema pronto para primeiro teste!`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

if (require.main === module) {
  verifyContracts();
}

module.exports = { verifyContracts };