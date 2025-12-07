import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

const projectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().default('#000000'),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    deadline: z.string().datetime().optional().nullable(),
    budget: z.number().min(0).optional().nullable(),
});

// Get all projects
router.get('/', async (req: AuthRequest, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get project details
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: { id, userId: req.userId },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Aggregate time spent
        const timeAggregation = await prisma.timeEntry.aggregate({
            where: {
                tasks: {
                    some: {
                        projectId: id
                    }
                }
            },
            _sum: {
                duration: true
            }
        });

        // Calculate task progress
        const taskStats = await prisma.task.groupBy({
            by: ['status'],
            where: { projectId: id },
            _count: true
        });

        const completedTasks = taskStats.find(s => s.status === 'DONE')?._count || 0;
        const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0);

        res.json({
            ...project,
            totalDuration: timeAggregation._sum.duration || 0,
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            completedTasks,
            totalTasks
        });
    } catch (error) {
        console.error('Get project details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create project
router.post('/', async (req: AuthRequest, res) => {
    try {
        const data = projectSchema.parse(req.body);

        const project = await prisma.project.create({
            data: {
                ...data,
                userId: req.userId!,
                deadline: data.deadline ? new Date(data.deadline) : null,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update project
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const data = projectSchema.partial().parse(req.body);

        // Check ownership
        const project = await prisma.project.findFirst({
            where: { id, userId: req.userId },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const updated = await prisma.project.update({
            where: { id },
            data,
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete project
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const project = await prisma.project.findFirst({
            where: { id, userId: req.userId },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await prisma.project.delete({ where: { id } });

        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
