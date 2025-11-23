import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

const createEntrySchema = z.object({
    categoryId: z.string(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    notes: z.string().optional(),
    isManual: z.boolean().default(false),
});

const updateEntrySchema = z.object({
    categoryId: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    notes: z.string().optional(),
});

const startTimerSchema = z.object({
    categoryId: z.string(),
});

const stopTimerSchema = z.object({
    notes: z.string().optional(),
});

// Get all entries with optional filters
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { startDate, endDate, categoryId } = req.query;

        const where: any = { userId: req.userId };

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = new Date(startDate as string);
            if (endDate) where.startTime.lte = new Date(endDate as string);
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        const entries = await prisma.timeEntry.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: { startTime: 'desc' },
        });

        res.json(entries);
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create entry
router.post('/', async (req: AuthRequest, res) => {
    try {
        const data = createEntrySchema.parse(req.body);

        // Verify category ownership
        const category = await prisma.category.findFirst({
            where: { id: data.categoryId, userId: req.userId },
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const startTime = new Date(data.startTime);
        const endTime = data.endTime ? new Date(data.endTime) : null;
        const duration = endTime
            ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
            : 0;

        const entry = await prisma.timeEntry.create({
            data: {
                userId: req.userId!,
                categoryId: data.categoryId,
                startTime,
                endTime,
                duration,
                notes: data.notes,
                isManual: data.isManual,
            },
            include: {
                category: true,
            },
        });

        res.status(201).json(entry);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Create entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update entry
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const data = updateEntrySchema.parse(req.body);

        // Check ownership
        const entry = await prisma.timeEntry.findFirst({
            where: { id, userId: req.userId },
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // If categoryId is being updated, verify ownership
        if (data.categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: data.categoryId, userId: req.userId },
            });
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
        }

        const updateData: any = {};
        if (data.categoryId) updateData.categoryId = data.categoryId;
        if (data.startTime) updateData.startTime = new Date(data.startTime);
        if (data.endTime) updateData.endTime = new Date(data.endTime);
        if (data.notes !== undefined) updateData.notes = data.notes;

        // Recalculate duration if times changed
        if (data.startTime || data.endTime) {
            const startTime = data.startTime ? new Date(data.startTime) : entry.startTime;
            const endTime = data.endTime ? new Date(data.endTime) : entry.endTime;
            if (endTime) {
                updateData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
            }
        }

        const updated = await prisma.timeEntry.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
            },
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Update entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete entry
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const entry = await prisma.timeEntry.findFirst({
            where: { id, userId: req.userId },
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        await prisma.timeEntry.delete({ where: { id } });

        res.json({ message: 'Entry deleted' });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start timer
router.post('/start', async (req: AuthRequest, res) => {
    try {
        const { categoryId } = startTimerSchema.parse(req.body);

        // Verify category ownership
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId: req.userId },
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if there's already an active timer
        const activeTimer = await prisma.timeEntry.findFirst({
            where: {
                userId: req.userId,
                OR: [
                    { endTime: null },
                    { endTime: { isSet: false } }
                ]
            },
        });

        if (activeTimer) {
            return res.status(400).json({ error: 'Timer already running' });
        }

        const entry = await prisma.timeEntry.create({
            data: {
                userId: req.userId!,
                categoryId,
                startTime: new Date(),
                isManual: false,
            },
            include: {
                category: true,
            },
        });

        res.status(201).json(entry);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Start timer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stop timer
router.post('/stop', async (req: AuthRequest, res) => {
    try {
        const { notes } = stopTimerSchema.parse(req.body);

        // Find active timer
        const activeTimer = await prisma.timeEntry.findFirst({
            where: {
                userId: req.userId,
                OR: [
                    { endTime: null },
                    { endTime: { isSet: false } }
                ]
            },
            include: {
                category: true,
            },
        });

        if (!activeTimer) {
            return res.status(404).json({ error: 'No active timer' });
        }

        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);

        const updated = await prisma.timeEntry.update({
            where: { id: activeTimer.id },
            data: {
                endTime,
                duration,
                notes,
            },
            include: {
                category: true,
            },
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Stop timer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get active timer
router.get('/active', async (req: AuthRequest, res) => {
    try {
        const activeTimer = await prisma.timeEntry.findFirst({
            where: {
                userId: req.userId,
                OR: [
                    { endTime: null },
                    { endTime: { isSet: false } }
                ]
            },
            include: {
                category: true,
            },
            orderBy: { startTime: 'desc' }
        });

        res.json(activeTimer);
    } catch (error) {
        console.error('Get active timer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
