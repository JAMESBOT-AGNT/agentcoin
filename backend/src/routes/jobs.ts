import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { JobStatus } from '@prisma/client';

const router = Router();

// Validation schemas
const createJobSchema = z.object({
  requesterId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  amount: z.number().positive()
});

const completeJobSchema = z.object({
  providerId: z.string().cuid()
});

const disputeJobSchema = z.object({
  reason: z.string().min(10).max(1000)
});

/**
 * POST /jobs
 * Create a new job
 */
router.post('/', async (req, res) => {
  try {
    const { requesterId, title, description, amount } = createJobSchema.parse(req.body);

    // Verify requester exists
    const requester = await prisma.agent.findUnique({
      where: { id: requesterId }
    });

    if (!requester) {
      return res.status(404).json({ error: 'Requester agent not found' });
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        requesterId,
        title,
        description,
        amount: amount.toString()
      },
      include: {
        requester: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    res.status(201).json({
      id: job.id,
      title: job.title,
      description: job.description,
      amount: job.amount.toString(),
      status: job.status,
      requester: job.requester,
      createdAt: job.createdAt
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

/**
 * GET /jobs/:id
 * Get job status and details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, walletAddress: true }
        },
        provider: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      id: job.id,
      title: job.title,
      description: job.description,
      amount: job.amount.toString(),
      status: job.status,
      requester: job.requester,
      provider: job.provider,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt
    });

  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to retrieve job' });
  }
});

/**
 * POST /jobs/:id/complete
 * Mark job as completed
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { providerId } = completeJobSchema.parse(req.body);

    // Get current job
    const job = await prisma.job.findUnique({
      where: { id },
      include: { requester: true, provider: true }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== JobStatus.IN_PROGRESS && job.status !== JobStatus.ASSIGNED) {
      return res.status(400).json({ 
        error: 'Job cannot be completed in current status',
        currentStatus: job.status
      });
    }

    // Verify provider
    if (job.providerId !== providerId) {
      return res.status(403).json({ error: 'Only assigned provider can complete this job' });
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date()
      },
      include: {
        requester: {
          select: { id: true, name: true, walletAddress: true }
        },
        provider: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    // TODO: Trigger payment from requester to provider
    // This would involve blockchain transaction

    res.json({
      id: updatedJob.id,
      status: updatedJob.status,
      completedAt: updatedJob.completedAt,
      message: 'Job completed successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Complete job error:', error);
    res.status(500).json({ error: 'Failed to complete job' });
  }
});

/**
 * POST /jobs/:id/dispute
 * Dispute a job
 */
router.post('/:id/dispute', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = disputeJobSchema.parse(req.body);

    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== JobStatus.COMPLETED && job.status !== JobStatus.IN_PROGRESS) {
      return res.status(400).json({ 
        error: 'Job cannot be disputed in current status',
        currentStatus: job.status
      });
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.DISPUTED,
        // Note: In a real system, you'd store dispute details separately
      }
    });

    res.json({
      id: updatedJob.id,
      status: updatedJob.status,
      message: 'Job dispute filed successfully',
      disputeReason: reason
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Dispute job error:', error);
    res.status(500).json({ error: 'Failed to dispute job' });
  }
});

/**
 * PUT /jobs/:id/assign
 * Assign a provider to a job
 */
router.put('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { providerId } = z.object({ providerId: z.string().cuid() }).parse(req.body);

    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== JobStatus.OPEN) {
      return res.status(400).json({ 
        error: 'Job is not available for assignment',
        currentStatus: job.status
      });
    }

    // Verify provider exists
    const provider = await prisma.agent.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider agent not found' });
    }

    // Assign job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        providerId,
        status: JobStatus.ASSIGNED
      },
      include: {
        provider: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    res.json({
      id: updatedJob.id,
      status: updatedJob.status,
      provider: updatedJob.provider,
      message: 'Job assigned successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Assign job error:', error);
    res.status(500).json({ error: 'Failed to assign job' });
  }
});

/**
 * GET /jobs
 * List jobs with filters and pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as JobStatus;
    const requesterId = req.query.requesterId as string;
    const providerId = req.query.providerId as string;

    // Build where clause
    const where: any = {};
    if (status && Object.values(JobStatus).includes(status)) {
      where.status = status;
    }
    if (requesterId) where.requesterId = requesterId;
    if (providerId) where.providerId = providerId;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: { id: true, name: true, walletAddress: true }
          },
          provider: {
            select: { id: true, name: true, walletAddress: true }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    res.json({
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        amount: job.amount.toString(),
        status: job.status,
        requester: job.requester,
        provider: job.provider,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List jobs error:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  }
});

export default router;