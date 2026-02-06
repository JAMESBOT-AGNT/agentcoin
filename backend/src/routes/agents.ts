import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { BlockchainService } from '../services/blockchain';

const router = Router();
const blockchain = new BlockchainService();

// Validation schemas
const registerAgentSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  name: z.string().min(1).max(100)
});

/**
 * POST /agents/register
 * Register a new agent with wallet address
 */
router.post('/register', async (req, res) => {
  try {
    const { walletAddress, name } = registerAgentSchema.parse(req.body);

    // Check if agent already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (existingAgent) {
      return res.status(409).json({
        error: 'Agent with this wallet address already exists'
      });
    }

    // Create new agent
    const agent = await prisma.agent.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        name
      }
    });

    res.status(201).json({
      id: agent.id,
      walletAddress: agent.walletAddress,
      name: agent.name,
      createdAt: agent.createdAt
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Agent registration error:', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

/**
 * GET /agents/:id
 * Get agent information by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true }
        },
        _count: {
          select: {
            requestedJobs: true,
            providedJobs: true,
            services: true
          }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      id: agent.id,
      walletAddress: agent.walletAddress,
      name: agent.name,
      createdAt: agent.createdAt,
      services: agent.services,
      stats: {
        jobsRequested: agent._count.requestedJobs,
        jobsProvided: agent._count.providedJobs,
        activeServices: agent._count.services
      }
    });

  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to retrieve agent' });
  }
});

/**
 * GET /agents/:id/balance
 * Get AGNT token balance for agent
 */
router.get('/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get balance from blockchain
    const balance = await blockchain.getTokenBalance(agent.walletAddress);

    res.json({
      agentId: agent.id,
      walletAddress: agent.walletAddress,
      balance: balance.toString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to retrieve balance' });
  }
});

/**
 * GET /agents
 * List all agents with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              services: { where: { isActive: true } }
            }
          }
        }
      }),
      prisma.agent.count()
    ]);

    res.json({
      agents: agents.map(agent => ({
        id: agent.id,
        walletAddress: agent.walletAddress,
        name: agent.name,
        createdAt: agent.createdAt,
        activeServices: agent._count.services
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List agents error:', error);
    res.status(500).json({ error: 'Failed to retrieve agents' });
  }
});

export default router;