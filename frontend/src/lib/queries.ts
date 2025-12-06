import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Category, TimeEntry, Task, DayRating } from '@shared/types';

// Categories
export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get<Category[]>('/categories');
            return data;
        },
    });
}

// Timer
export function useActiveTimer() {
    return useQuery({
        queryKey: ['activeTimer'],
        queryFn: async () => {
            const { data } = await api.get<TimeEntry | null>('/entries/active');
            return data;
        },
    });
}

export function useStartTimer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { categoryId: string; taskIds?: string[] }) => {
            const { data: response } = await api.post<TimeEntry>('/entries/start', data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] }); // Invalidate entries list too
        },
    });
}

export function useStopTimer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (notes?: string) => {
            const { data } = await api.post<TimeEntry>('/entries/stop', { notes });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
            queryClient.invalidateQueries({ queryKey: ['heatmap'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
}

export function useAbandonTimer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await api.delete('/entries/active');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
        },
    });
}

export function useCreateEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { categoryId: string; startTime: string; endTime: string; notes?: string }) => {
            const { data: response } = await api.post<TimeEntry>('/entries', { ...data, isManual: true });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entries'] });
            queryClient.invalidateQueries({ queryKey: ['heatmap'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
}

// Analytics
export function useHeatmap(categoryId?: string) {
    return useQuery({
        queryKey: ['heatmap', categoryId],
        queryFn: async () => {
            const { data } = await api.get<{ date: string; duration: number; level: number }[]>('/analytics/heatmap', {
                params: { categoryId }
            });
            return data;
        },
    });
}

export function useEntries(params?: { startDate?: string; endDate?: string; categoryId?: string }) {
    return useQuery({
        queryKey: ['entries', params],
        queryFn: async () => {
            const { data } = await api.get<TimeEntry[]>('/entries', { params });
            return data;
        },
    });
}

export function useStats() {
    return useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const { data } = await api.get<{
                todayTotal: number;
                weekTotal: number;
                monthTotal: number;
                mostProductiveDay: { date: string; duration: number };
                streak: number;
            }>('/analytics/stats');
            return data;
        },
    });
}

export function useDistribution(days: number = 30) {
    return useQuery({
        queryKey: ['distribution', days],
        queryFn: async () => {
            const { data } = await api.get<{
                categoryId: string;
                categoryName: string;
                color: string;
                duration: number;
                percentage: number;
            }[]>('/analytics/distribution', { params: { days } });
            return data;
        },
    });
}

export function useTrends(days: number = 30) {
    return useQuery({
        queryKey: ['trends', days],
        queryFn: async () => {
            const { data } = await api.get<{ date: string; duration: number }[]>('/analytics/trends', { params: { days } });
            return data;
        },
    });
}

// Tasks
export function useTasks(params?: { scheduledDate?: string; isCompleted?: boolean }) {
    return useQuery({
        queryKey: ['tasks', params],
        queryFn: async () => {
            const { data } = await api.get<Task[]>('/tasks', { params });
            return data;
        },
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (task: Partial<Task>) => {
            const { data } = await api.post<Task>('/tasks', task);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dayRating'] });
        },
    });
}

export function useToggleTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
            const { data } = await api.put<Task>(`/tasks/${id}`, { isCompleted });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dayRating'] });
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] }); // Update active timer tasks
        },
    });
}

export function useDayRating(date?: string) {
    return useQuery({
        queryKey: ['dayRating', date],
        queryFn: async () => {
            const { data } = await api.get<DayRating>('/analytics/rating', { params: { date } });
            return data;
        },
    });
}

export function useDeleteEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/entries/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entries'] });
            queryClient.invalidateQueries({ queryKey: ['heatmap'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dayRating'] });
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
        },
    });
}
