import { PrismaClient, JobStatus, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');

  // Create sample agents
  console.log('📝 Creating sample agents...');
  
  const agent1 = await prisma.agent.create({
    data: {
      walletAddress: '0x742d35cc6634c0532925a3b8d4ed2f1c3c47a3e8',
      name: 'OpenClaw Agent Alpha'
    }
  });

  const agent2 = await prisma.agent.create({
    data: {
      walletAddress: '0x8ba1f109551bd432803012645hac136c4c6f2562c',
      name: 'DataProcessor Bot'
    }
  });

  const agent3 = await prisma.agent.create({
    data: {
      walletAddress: '0x12345678901234567890123456789012345ab67890',
      name: 'PDF Assistant'
    }
  });

  console.log(`✅ Created ${3} agents`);

  // Create sample services
  console.log('🔧 Creating sample services...');
  
  const services = await Promise.all([
    prisma.service.create({
      data: {
        agentId: agent2.id,
        name: 'PDF Text Extraction',
        description: 'Extract text from PDF documents with high accuracy',
        capability: 'pdf-processing',
        price: '2.5'
      }
    }),
    prisma.service.create({
      data: {
        agentId: agent2.id,
        name: 'Data Analysis',
        description: 'Analyze CSV/JSON data and generate reports',
        capability: 'data-analysis',
        price: '5.0'
      }
    }),
    prisma.service.create({
      data: {
        agentId: agent3.id,
        name: 'Document Conversion',
        description: 'Convert documents between various formats',
        capability: 'document-conversion',
        price: '1.8'
      }
    }),
    prisma.service.create({
      data: {
        agentId: agent3.id,
        name: 'Image OCR',
        description: 'Extract text from images using OCR technology',
        capability: 'ocr',
        price: '3.2'
      }
    }),
    prisma.service.create({
      data: {
        agentId: agent1.id,
        name: 'Web Scraping',
        description: 'Extract data from websites with rate limiting',
        capability: 'web-scraping',
        price: '4.5'
      }
    })
  ]);

  console.log(`✅ Created ${services.length} services`);

  // Create sample jobs
  console.log('💼 Creating sample jobs...');
  
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        requesterId: agent1.id,
        providerId: agent2.id,
        title: 'Extract text from research papers',
        description: 'Need to extract and format text from 10 academic PDF papers',
        amount: '25.0',
        status: JobStatus.COMPLETED,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    }),
    prisma.job.create({
      data: {
        requesterId: agent3.id,
        providerId: agent1.id,
        title: 'Scrape product data from e-commerce site',
        description: 'Extract product listings, prices, and reviews from target website',
        amount: '18.5',
        status: JobStatus.IN_PROGRESS
      }
    }),
    prisma.job.create({
      data: {
        requesterId: agent2.id,
        title: 'Convert 50 Word documents to PDF',
        description: 'Batch convert Word documents to PDF format with consistent styling',
        amount: '12.0',
        status: JobStatus.OPEN
      }
    }),
    prisma.job.create({
      data: {
        requesterId: agent1.id,
        providerId: agent3.id,
        title: 'OCR processing for scanned documents',
        description: 'Process 30 scanned documents and extract readable text',
        amount: '45.0',
        status: JobStatus.ASSIGNED
      }
    })
  ]);

  console.log(`✅ Created ${jobs.length} jobs`);

  // Create sample transactions
  console.log('💰 Creating sample transactions...');
  
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        fromAgent: agent1.id,
        toAgent: agent2.id,
        amount: '25.0',
        type: TransactionType.PAYMENT,
        status: TransactionStatus.CONFIRMED,
        txHash: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'
      }
    }),
    prisma.transaction.create({
      data: {
        fromAgent: agent2.id,
        toAgent: agent3.id,
        amount: '8.5',
        type: TransactionType.PAYMENT,
        status: TransactionStatus.CONFIRMED,
        txHash: '0x1234abcd567890efghij1234567890klmnop1234567890qrstuv1234567890wxyz'
      }
    }),
    prisma.transaction.create({
      data: {
        fromAgent: agent3.id,
        toAgent: agent1.id,
        amount: '15.0',
        type: TransactionType.REWARD,
        status: TransactionStatus.PENDING
      }
    })
  ]);

  console.log(`✅ Created ${transactions.length} transactions`);

  // Summary
  console.log('\n📊 Seed Summary:');
  console.log(`   Agents: ${3}`);
  console.log(`   Services: ${services.length}`);
  console.log(`   Jobs: ${jobs.length}`);
  console.log(`   Transactions: ${transactions.length}`);
  
  console.log('\n🎉 Seed completed successfully!');
  console.log('🔗 You can now start the server with: npm run dev');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });