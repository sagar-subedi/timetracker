import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    estimatedTime: z.number().min(0).default(0),
    scheduledDate: z.string().datetime().optional(),
    projectId: z.string().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    estimatedTime: z.number().min(0).optional(),
    isCompleted: z.boolean().optional(),
    scheduledDate: z.string().datetime().nullable().optional(),
    projectId: z.string().nullable().optional(),
});

// Get all tasks
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { scheduledDate, isCompleted } = req.query;

        const where: Prisma.TaskWhereInput = { userId: req.userId };

        if (scheduledDate) {
            const date = new Date(scheduledDate as string);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            where.scheduledDate = {
                gte: date,
                lt: nextDay,
            };
        }

        if (isCompleted !== undefined) {
            where.isCompleted = isCompleted === 'true';
        }

        const tasks = await prisma.task.findMany({
            where,
            include: { project: true },
            orderBy: [
                { isCompleted: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        // Custom sort for Priority since MongoDB stores enums as strings
        // Desired: HIGH > MEDIUM > LOW
        const priorityWeight = {
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1
        };

        const sortedTasks = tasks.sort((a, b) => {
            // 1. Completed status (Uncompleted first)
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            // 2. Priority (High to Low)
            if (a.priority !== b.priority) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            // 3. Created At (Newest first) - already handled by DB query but good to keep stable
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        res.json(sortedTasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create task
router.post('/', async (req: AuthRequest, res) => {
    try {
        const data = createTaskSchema.parse(req.body);

        const task = await prisma.task.create({
            data: {
                userId: req.userId!,
                title: data.title,
                description: data.description,
                priority: data.priority,
                estimatedTime: data.estimatedTime,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
                projectId: data.projectId,
            }
        });

        res.status(201).json(task);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update task
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const data = updateTaskSchema.parse(req.body);

        const task = await prisma.task.findFirst({
            where: { id, userId: req.userId }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const updateData: Prisma.TaskUpdateInput = {};
        if (data.title) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.priority) updateData.priority = data.priority;
        if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime;
        if (data.scheduledDate !== undefined) {
            updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
        }

        if (data.isCompleted !== undefined) {
            updateData.isCompleted = data.isCompleted;
            updateData.completedAt = data.isCompleted ? new Date() : null;
        }

        const updated = await prisma.task.update({
            where: { id },
            data: updateData
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete task
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const task = await prisma.task.findFirst({
            where: { id, userId: req.userId }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await prisma.task.delete({ where: { id } });

        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
