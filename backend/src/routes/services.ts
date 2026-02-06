import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';

const router = Router();

// Validation schemas
const registerServiceSchema = z.object({
  agentId: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  capability: z.string().min(1).max(50), // For search/matching
  price: z.number().positive()
});

const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  capability: z.string().min(1).max(50).optional(),
  price: z.number().positive().optional(),
  isActive: z.boolean().optional()
});

/**
 * GET /services
 * List all available services
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const capability = req.query.capability as string;
    const agentId = req.query.agentId as string;
    const isActive = req.query.active === 'true';

    // Build where clause
    const where: any = {};
    if (capability) {
      where.capability = {
        contains: capability,
        mode: 'insensitive'
      };
    }
    if (agentId) where.agentId = agentId;
    if (isActive !== undefined) where.isActive = isActive;
    
    // By default, only show active services
    if (isActive === undefined) {
      where.isActive = true;
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isActive: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          agent: {
            select: { id: true, name: true, walletAddress: true }
          }
        }
      }),
      prisma.service.count({ where })
    ]);

    res.json({
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        capability: service.capability,
        price: service.price.toString(),
        isActive: service.isActive,
        agent: service.agent,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List services error:', error);
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

/**
 * POST /services
 * Register a new service
 */
router.post('/', async (req, res) => {
  try {
    const { agentId, name, description, capability, price } = registerServiceSchema.parse(req.body);

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check if agent already has a service with this name
    const existingService = await prisma.service.findFirst({
      where: {
        agentId,
        name,
        isActive: true
      }
    });

    if (existingService) {
      return res.status(409).json({ 
        error: 'Agent already has an active service with this name' 
      });
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        agentId,
        name,
        description,
        capability: capability.toLowerCase(),
        price: price.toString()
      },
      include: {
        agent: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    res.status(201).json({
      id: service.id,
      name: service.name,
      description: service.description,
      capability: service.capability,
      price: service.price.toString(),
      isActive: service.isActive,
      agent: service.agent,
      createdAt: service.createdAt
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Register service error:', error);
    res.status(500).json({ error: 'Failed to register service' });
  }
});

/**
 * GET /services/search
 * Search services by capability and other criteria
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const capability = req.query.capability as string;
    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice = parseFloat(req.query.maxPrice as string) || Number.MAX_SAFE_INTEGER;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    if (!query && !capability) {
      return res.status(400).json({ 
        error: 'Search query (q) or capability parameter is required' 
      });
    }

    // Build search conditions
    const searchConditions: any[] = [];

    if (query) {
      searchConditions.push(
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { capability: { contains: query, mode: 'insensitive' } }
      );
    }

    if (capability && !query) {
      searchConditions.push(
        { capability: { contains: capability, mode: 'insensitive' } }
      );
    }

    const where = {
      AND: [
        { isActive: true },
        { price: { gte: minPrice.toString(), lte: maxPrice.toString() } },
        searchConditions.length > 0 ? { OR: searchConditions } : {}
      ]
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { price: 'asc' }, // Cheaper services first
          { createdAt: 'desc' }
        ],
        include: {
          agent: {
            select: { id: true, name: true, walletAddress: true }
          }
        }
      }),
      prisma.service.count({ where })
    ]);

    res.json({
      query: query || capability,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        capability: service.capability,
        price: service.price.toString(),
        agent: service.agent,
        createdAt: service.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({ error: 'Failed to search services' });
  }
});

/**
 * GET /services/:id
 * Get specific service details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, name: true, walletAddress: true, createdAt: true },
          include: {
            _count: {
              select: {
                services: { where: { isActive: true } },
                providedJobs: true
              }
            }
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      id: service.id,
      name: service.name,
      description: service.description,
      capability: service.capability,
      price: service.price.toString(),
      isActive: service.isActive,
      agent: {
        ...service.agent,
        stats: {
          activeServices: service.agent._count.services,
          completedJobs: service.agent._count.providedJobs
        }
      },
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to retrieve service' });
  }
});

/**
 * PUT /services/:id
 * Update service details
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = updateServiceSchema.parse(req.body);

    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.capability && { capability: updates.capability.toLowerCase() }),
        ...(updates.price && { price: updates.price.toString() })
      },
      include: {
        agent: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    });

    res.json({
      id: updatedService.id,
      name: updatedService.name,
      description: updatedService.description,
      capability: updatedService.capability,
      price: updatedService.price.toString(),
      isActive: updatedService.isActive,
      agent: updatedService.agent,
      updatedAt: updatedService.updatedAt
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

/**
 * DELETE /services/:id
 * Deactivate a service (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.query.agentId as string;

    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify agent ownership if agentId provided
    if (agentId && service.agentId !== agentId) {
      return res.status(403).json({ error: 'Not authorized to delete this service' });
    }

    // Soft delete - deactivate instead of hard delete
    const updatedService = await prisma.service.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      message: 'Service deactivated successfully',
      serviceId: id,
      isActive: updatedService.isActive
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to deactivate service' });
  }
});

/**
 * GET /services/capabilities/list
 * Get unique capabilities for filtering/autocomplete
 */
router.get('/capabilities/list', async (req, res) => {
  try {
    const capabilities = await prisma.service.findMany({
      where: { isActive: true },
      select: { capability: true },
      distinct: ['capability'],
      orderBy: { capability: 'asc' }
    });

    res.json({
      capabilities: capabilities.map(c => c.capability)
    });

  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({ error: 'Failed to retrieve capabilities' });
  }
});

export default router;