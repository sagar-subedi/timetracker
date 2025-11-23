import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get heatmap data (last 365 days)
router.get('/heatmap', async (req: AuthRequest, res) => {
    try {
        const { categoryId } = req.query;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365);

        const where: any = {
            userId: req.userId,
            startTime: {
                gte: startDate,
                lte: endDate,
            },
            endTime: { not: null },
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        const entries = await prisma.timeEntry.findMany({
            where,
            select: {
                startTime: true,
                duration: true,
            },
        });

        // Group by date
        const heatmapData: { [key: string]: number } = {};
        entries.forEach((entry) => {
            const date = entry.startTime.toISOString().split('T')[0];
            heatmapData[date] = (heatmapData[date] || 0) + entry.duration;
        });

        // Convert to array with levels (0-4 based on duration)
        const maxDuration = Math.max(...Object.values(heatmapData), 1);
        const heatmap = Object.entries(heatmapData).map(([date, duration]) => ({
            date,
            duration,
            level: Math.min(4, Math.ceil((duration / maxDuration) * 4)),
        }));

        res.json(heatmap);
    } catch (error) {
        console.error('Get heatmap error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get summary stats
router.get('/stats', async (req: AuthRequest, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now);
        monthStart.setDate(monthStart.getDate() - 30);

        // Today's total
        const todayEntries = await prisma.timeEntry.findMany({
            where: {
                userId: req.userId,
                startTime: { gte: todayStart },
                endTime: { not: null },
            },
            select: { duration: true },
        });
        const todayTotal = todayEntries.reduce((sum, e) => sum + e.duration, 0);

        // Week total
        const weekEntries = await prisma.timeEntry.findMany({
            where: {
                userId: req.userId,
                startTime: { gte: weekStart },
                endTime: { not: null },
            },
            select: { duration: true },
        });
        const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);

        // Month total
        const monthEntries = await prisma.timeEntry.findMany({
            where: {
                userId: req.userId,
                startTime: { gte: monthStart },
                endTime: { not: null },
            },
            select: { duration: true, startTime: true },
        });
        const monthTotal = monthEntries.reduce((sum, e) => sum + e.duration, 0);

        // Most productive day in the last 30 days
        const dailyTotals: { [key: string]: number } = {};
        monthEntries.forEach((entry) => {
            const date = entry.startTime.toISOString().split('T')[0];
            dailyTotals[date] = (dailyTotals[date] || 0) + entry.duration;
        });

        const mostProductiveDay = Object.entries(dailyTotals).reduce(
            (max, [date, duration]) => (duration > max.duration ? { date, duration } : max),
            { date: '', duration: 0 }
        );

        res.json({
            todayTotal,
            weekTotal,
            monthTotal,
            mostProductiveDay,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get time distribution by category
router.get('/distribution', async (req: AuthRequest, res) => {
    try {
        const { days = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: req.userId,
                startTime: { gte: startDate },
                endTime: { not: null },
            },
            include: {
                category: true,
            },
        });

        // Group by category
        const categoryTotals: {
            [key: string]: { name: string; color: string; duration: number };
        } = {};

        entries.forEach((entry) => {
            const catId = entry.categoryId;
            if (!categoryTotals[catId]) {
                categoryTotals[catId] = {
                    name: entry.category.name,
                    color: entry.category.color,
                    duration: 0,
                };
            }
            categoryTotals[catId].duration += entry.duration;
        });

        const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.duration, 0);

        const distribution = Object.entries(categoryTotals).map(([categoryId, data]) => ({
            categoryId,
            categoryName: data.name,
            color: data.color,
            duration: data.duration,
            percentage: total > 0 ? (data.duration / total) * 100 : 0,
        }));

        res.json(distribution);
    } catch (error) {
        console.error('Get distribution error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get trends (daily totals for the specified period)
router.get('/trends', async (req: AuthRequest, res) => {
    try {
        const { days = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: req.userId,
                startTime: { gte: startDate },
                endTime: { not: null },
            },
            select: {
                startTime: true,
                duration: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        // Group by date
        const dailyTotals: { [key: string]: number } = {};
        entries.forEach((entry) => {
            const date = entry.startTime.toISOString().split('T')[0];
            dailyTotals[date] = (dailyTotals[date] || 0) + entry.duration;
        });

        // Fill in missing dates with 0
        const trends = [];
        const currentDate = new Date(startDate);
        const endDate = new Date();

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            trends.push({
                date: dateStr,
                duration: dailyTotals[dateStr] || 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json(trends);
    } catch (error) {
        console.error('Get trends error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
