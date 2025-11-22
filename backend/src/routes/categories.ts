import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

const categorySchema = z.object({
    name: z.string().min(1),
    color: z.string().regex(/^#[0-9A-F]{6}$/i),
    icon: z.string().min(1),
});

// Get all categories
router.get('/', async (req: AuthRequest, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'asc' },
        });

        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create category
router.post('/', async (req: AuthRequest, res) => {
    try {
        const data = categorySchema.parse(req.body);

        const category = await prisma.category.create({
            data: {
                ...data,
                userId: req.userId!,
            },
        });

        res.status(201).json(category);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update category
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const data = categorySchema.partial().parse(req.body);

        // Check ownership
        const category = await prisma.category.findFirst({
            where: { id, userId: req.userId },
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const updated = await prisma.category.update({
            where: { id },
            data,
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete category
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const category = await prisma.category.findFirst({
            where: { id, userId: req.userId },
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await prisma.category.delete({ where: { id } });

        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
