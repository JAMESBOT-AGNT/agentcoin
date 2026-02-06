import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { BlockchainService } from '../services/blockchain';

const router = Router();
const blockchain = new BlockchainService();

// Validation schemas
const transferSchema = z.object({
  fromAgent: z.string().cuid(),
  toAgent: z.string().cuid(),
  amount: z.number().positive(),
  type: z.nativeEnum(TransactionType).optional().default(TransactionType.PAYMENT)
});

/**
 * POST /transfer
 * Transfer AGNT tokens between agents
 */
router.post('/transfer', async (req, res) => {
  try {
    const { fromAgent, toAgent, amount, type } = transferSchema.parse(req.body);

    // Validate agents exist
    const [sender, receiver] = await Promise.all([
      prisma.agent.findUnique({ where: { id: fromAgent } }),
      prisma.agent.findUnique({ where: { id: toAgent } })
    ]);

    if (!sender) {
      return res.status(404).json({ error: 'Sender agent not found' });
    }

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver agent not found' });
    }

    if (sender.id === receiver.id) {
      return res.status(400).json({ error: 'Cannot transfer to the same agent' });
    }

    // Check sender balance
    const senderBalance = await blockchain.getTokenBalance(sender.walletAddress);
    if (senderBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        available: senderBalance.toString(),
        required: amount.toString()
      });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        fromAgent,
        toAgent,
        amount: amount.toString(),
        type,
        status: TransactionStatus.PENDING
      },
      include: {
        sender: {
          select: { id: true, name: true, walletAddress: true }
        },
        receiver: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    // Execute blockchain transfer
    try {
      const txHash = await blockchain.transferTokens(
        sender.walletAddress,
        receiver.walletAddress,
        amount
      );

      // Update transaction with hash and status
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          txHash,
          status: TransactionStatus.CONFIRMED
        },
        include: {
          sender: {
            select: { id: true, name: true, walletAddress: true }
          },
          receiver: {
            select: { id: true, name: true, walletAddress: true }
          }
        }
      });

      res.status(201).json({
        id: updatedTransaction.id,
        sender: updatedTransaction.sender,
        receiver: updatedTransaction.receiver,
        amount: updatedTransaction.amount.toString(),
        type: updatedTransaction.type,
        status: updatedTransaction.status,
        txHash: updatedTransaction.txHash,
        createdAt: updatedTransaction.createdAt
      });

    } catch (blockchainError) {
      // Mark transaction as failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED }
      });

      console.error('Blockchain transfer error:', blockchainError);
      res.status(500).json({ 
        error: 'Transfer failed',
        transactionId: transaction.id,
        details: blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error'
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to process transfer' });
  }
});

/**
 * GET /transactions/:agentId
 * Get transaction history for an agent
 */
router.get('/transactions/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const type = req.query.type as TransactionType;
    const status = req.query.status as TransactionStatus;

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Build where clause
    const where: any = {
      OR: [
        { fromAgent: agentId },
        { toAgent: agentId }
      ]
    };

    if (type && Object.values(TransactionType).includes(type)) {
      where.type = type;
    }

    if (status && Object.values(TransactionStatus).includes(status)) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, walletAddress: true }
          },
          receiver: {
            select: { id: true, name: true, walletAddress: true }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    // Calculate summary stats
    const stats = await prisma.transaction.aggregate({
      where: {
        OR: [
          { fromAgent: agentId, status: TransactionStatus.CONFIRMED },
          { toAgent: agentId, status: TransactionStatus.CONFIRMED }
        ]
      },
      _sum: {
        amount: true
      }
    });

    const sentTransactions = await prisma.transaction.aggregate({
      where: {
        fromAgent: agentId,
        status: TransactionStatus.CONFIRMED
      },
      _sum: {
        amount: true
      }
    });

    const receivedTransactions = await prisma.transaction.aggregate({
      where: {
        toAgent: agentId,
        status: TransactionStatus.CONFIRMED
      },
      _sum: {
        amount: true
      }
    });

    res.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        sender: tx.sender,
        receiver: tx.receiver,
        amount: tx.amount.toString(),
        type: tx.type,
        status: tx.status,
        txHash: tx.txHash,
        direction: tx.fromAgent === agentId ? 'sent' : 'received',
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalVolume: stats._sum.amount?.toString() || '0',
        totalSent: sentTransactions._sum.amount?.toString() || '0',
        totalReceived: receivedTransactions._sum.amount?.toString() || '0'
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

/**
 * GET /transactions/tx/:txHash
 * Get transaction details by blockchain hash
 */
router.get('/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: { txHash },
      include: {
        sender: {
          select: { id: true, name: true, walletAddress: true }
        },
        receiver: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get blockchain confirmation details
    const blockchainTx = await blockchain.getTransactionDetails(txHash);

    res.json({
      id: transaction.id,
      sender: transaction.sender,
      receiver: transaction.receiver,
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      txHash: transaction.txHash,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      blockchain: blockchainTx
    });

  } catch (error) {
    console.error('Get transaction by hash error:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction details' });
  }
});

/**
 * GET /transactions
 * Get all transactions (admin/system overview)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, walletAddress: true }
          },
          receiver: {
            select: { id: true, name: true, walletAddress: true }
          }
        }
      }),
      prisma.transaction.count()
    ]);

    res.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        sender: tx.sender,
        receiver: tx.receiver,
        amount: tx.amount.toString(),
        type: tx.type,
        status: tx.status,
        txHash: tx.txHash,
        createdAt: tx.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List all transactions error:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

export default router;