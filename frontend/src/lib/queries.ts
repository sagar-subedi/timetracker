import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Category, TimeEntry } from '@shared/types';

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
        mutationFn: async (categoryId: string) => {
            const { data } = await api.post<TimeEntry>('/entries/start', { categoryId });
            return data;
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
export function useHeatmap() {
    return useQuery({
        queryKey: ['heatmap'],
        queryFn: async () => {
            const { data } = await api.get<{ date: string; duration: number; level: number }[]>('/analytics/heatmap');
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
            }>('/analytics/stats');
            return data;
        },
    });
}
