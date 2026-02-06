#!/usr/bin/env node

// AgentCoin Skill Usage Examples
// Run with: node examples/usage.js

import { agentCoinTool } from '../dist/index.js';

async function examples() {
  console.log('🤖 AgentCoin Skill Examples\n');

  // 1. Check configuration
  console.log('1. Configuration:');
  const config = await agentCoinTool.config();
  console.log('   ', config.message);
  console.log('   ', JSON.stringify(config.data, null, 2));
  console.log();

  // 2. Check balance
  console.log('2. Balance check:');
  const balance = await agentCoinTool.balance();
  console.log('   ', balance.message);
  if (balance.success) {
    console.log('   ', `Address: ${balance.data.address}`);
    console.log('   ', `Balance: ${balance.data.formatted}`);
  }
  console.log();

  // 3. List available services
  console.log('3. Available services:');
  const services = await agentCoinTool.serviceList({ limit: 5 });
  console.log('   ', services.message);
  if (services.success && services.data.services.length > 0) {
    services.data.services.forEach(service => {
      console.log('   ', `- ${service.name} (${service.category})`);
      console.log('   ', `  ${service.description}`);
      console.log('   ', `  Price: ${service.price_per_task || service.price_per_hour || 'TBD'} AGNT`);
    });
  }
  console.log();

  // 4. List jobs
  console.log('4. Available jobs:');
  const jobs = await agentCoinTool.jobList({ status: 'open', limit: 5 });
  console.log('   ', jobs.message);
  if (jobs.success && jobs.data.jobs.length > 0) {
    jobs.data.jobs.forEach(job => {
      console.log('   ', `- ${job.title} (${job.amount} AGNT)`);
      console.log('   ', `  ${job.description}`);
      console.log('   ', `  Deadline: ${job.deadline || 'None'}`);
    });
  }
  console.log();

  // 5. Transaction logs
  console.log('5. Recent transactions:');
  const logs = await agentCoinTool.logs(10);
  console.log('   ', logs.message);
  if (logs.success && logs.data.logs.length > 0) {
    logs.data.logs.forEach(log => {
      const sign = log.amount >= 0 ? '+' : '';
      console.log('   ', `${log.timestamp}: ${sign}${log.amount} AGNT (${log.type})`);
      console.log('   ', `  ${log.counterparty} - ${log.status}`);
    });
  } else {
    console.log('   ', 'No transaction history found');
  }
  console.log();

  console.log('✅ Examples completed!\n');
  console.log('💡 Tips:');
  console.log('   - Set environment variables in .env file');
  console.log('   - Use transfer() to send AGNT to other agents');
  console.log('   - Create jobs with jobCreate() for collaborative work');
  console.log('   - Register services with serviceRegister() to earn AGNT');
}

// Run examples
examples().catch(error => {
  console.error('❌ Error running examples:', error.message);
  process.exit(1);
});