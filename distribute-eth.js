#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');

// Configuração
const BASE_RPC = 'https://mainnet.base.org';
const DEPLOYER_KEY = '0x731e2b875360d8ca3c0456d8f07f5d73bf1ab37f787057f4fe65b95241849740';
const DEPLOYER_ADDRESS = '0xa1A504b7592E4f3c383871C268fE600899761001';

// Carregar carteiras do sistema duplo
const config = JSON.parse(fs.readFileSync('./agentcoin-wallets.json'));

async function checkAndDistribute() {
  console.log('💸 Distribuição de ETH para Sistema Duplo\n');
  
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const deployerWallet = new ethers.Wallet(DEPLOYER_KEY, provider);
  const jamesWallet = new ethers.Wallet(config.wallets.james.private_key, provider);
  
  try {
    // 1. Verificar saldos atuais
    console.log('💰 Saldos Atuais:');
    
    const deployerBalance = await provider.getBalance(DEPLOYER_ADDRESS);
    const andreBalance = await provider.getBalance(config.wallets.andre.address);
    const jamesBalance = await provider.getBalance(config.wallets.james.address);
    
    console.log(`   🚀 Deployer: ${ethers.formatEther(deployerBalance)} ETH`);
    console.log(`   👤 Andre: ${ethers.formatEther(andreBalance)} ETH`);
    console.log(`   👻 James: ${ethers.formatEther(jamesBalance)} ETH\n`);
    
    // 2. Se deployer tem ETH, distribuir
    if (deployerBalance > ethers.parseEther("0.001")) {
      console.log('🔄 Distribuindo ETH...');
      
      // Calcular quanto dividir (deixar um pouco no deployer para emergências)
      const reserva = ethers.parseEther("0.005"); // 0.005 ETH no deployer
      const disponivel = deployerBalance - reserva;
      const metadePorCarteira = disponivel / 2n;
      
      console.log(`   Disponível: ${ethers.formatEther(disponivel)} ETH`);
      console.log(`   Por carteira: ${ethers.formatEther(metadePorCarteira)} ETH`);
      
      if (metadePorCarteira > ethers.parseEther("0.001")) {
        // Transferir para Andre
        if (andreBalance < ethers.parseEther("0.001")) {
          console.log(`   💸 Enviando ${ethers.formatEther(metadePorCarteira)} ETH para Andre...`);
          const txAndre = await deployerWallet.sendTransaction({
            to: config.wallets.andre.address,
            value: metadePorCarteira
          });
          console.log(`   📝 TX Andre: ${txAndre.hash}`);
          await txAndre.wait();
          console.log(`   ✅ Andre financiado!`);
        }
        
        // Transferir para James
        if (jamesBalance < ethers.parseEther("0.001")) {
          console.log(`   💸 Enviando ${ethers.formatEther(metadePorCarteira)} ETH para James...`);
          const txJames = await deployerWallet.sendTransaction({
            to: config.wallets.james.address,
            value: metadePorCarteira
          });
          console.log(`   📝 TX James: ${txJames.hash}`);
          await txJames.wait();
          console.log(`   ✅ James financiado!`);
        }
        
      } else {
        console.log(`   ⚠️  Saldo muito baixo para distribuir com segurança`);
      }
    } else {
      console.log('❌ Deployer sem ETH suficiente para distribuir');
      
      // Verificar outras carteiras que podem ter ETH
      const alternativeAddresses = [
        '0xE82dd053eB5F19aca03C1516988Af36E44C298d4', // Andre
        '0xE7aED50D34412a12917B3FCFFec4584EB8F74AA2'  // James
      ];
      
      console.log('\n🔍 Verificando carteiras alternativas...');
      for (const addr of alternativeAddresses) {
        const balance = await provider.getBalance(addr);
        if (balance > 0n) {
          console.log(`   ${addr}: ${ethers.formatEther(balance)} ETH ✨`);
        }
      }
    }
    
    // 3. Status final pós-distribuição
    console.log('\n📊 STATUS FINAL:');
    const finalDeployer = await provider.getBalance(DEPLOYER_ADDRESS);
    const finalAndre = await provider.getBalance(config.wallets.andre.address);
    const finalJames = await provider.getBalance(config.wallets.james.address);
    
    console.log(`   🚀 Deployer: ${ethers.formatEther(finalDeployer)} ETH`);
    console.log(`   👤 Andre: ${ethers.formatEther(finalAndre)} ETH`);
    console.log(`   👻 James: ${ethers.formatEther(finalJames)} ETH`);
    
    const total = finalDeployer + finalAndre + finalJames;
    console.log(`   📊 Total: ${ethers.formatEther(total)} ETH`);
    
    if (finalAndre > 0n && finalJames > 0n) {
      console.log(`\n🎉 SISTEMA PRONTO! Ambas carteiras têm ETH para gas fees.`);
      console.log(`\n🔨 PRÓXIMO TESTE: Criar primeiro trabalho no WorkRegistry`);
      console.log(`   node agentcoin-cli.js create-work`);
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('\n💡 Dica: Deployer precisa de mais ETH para gas fees das transferências');
    }
  }
}

if (require.main === module) {
  checkAndDistribute();
}

module.exports = { checkAndDistribute };