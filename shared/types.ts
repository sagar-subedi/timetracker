export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    userId: string;
    createdAt: Date;
}

export interface TimeEntry {
    id: string;
    userId: string;
    categoryId: string;
    category?: Category;
    tasks?: Task[];
    startTime: Date;
    endTime: Date | null;
    duration: number; // in seconds
    notes?: string;
    isManual: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// API Request/Response Types
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface CreateCategoryRequest {
    name: string;
    color: string;
    icon: string;
}

export interface CreateTimeEntryRequest {
    categoryId: string;
    startTime: Date;
    endTime?: Date;
    notes?: string;
    isManual: boolean;
}

export interface UpdateTimeEntryRequest {
    categoryId?: string;
    startTime?: Date;
    endTime?: Date;
    notes?: string;
}

export interface StartTimerRequest {
    categoryId: string;
    taskIds?: string[];
}

export interface StopTimerRequest {
    notes?: string;
}

// Analytics Types
export interface HeatmapDay {
    date: string; // YYYY-MM-DD
    duration: number; // in seconds
    level: number; // 0-4 for color intensity
}

export interface Stats {
    todayTotal: number;
    weekTotal: number;
    monthTotal: number;
    mostProductiveDay: {
        date: string;
        duration: number;
    };
}

export interface CategoryDistribution {
    categoryId: string;
    categoryName: string;
    color: string;
    duration: number;
    percentage: number;
}

export interface TrendData {
    date: string;
    duration: number;
}

export interface AnalyticsResponse {
    heatmap?: HeatmapDay[];
    stats?: Stats;
    distribution?: CategoryDistribution[];
    trends?: TrendData[];
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    color: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        tasks: number;
    };
}

export interface Task {
    id: string;
    userId: string;
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedTime: number; // in minutes
    isCompleted: boolean;
    scheduledDate?: string; // ISO Date string
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    projectId?: string;
    project?: Project;
}

export interface DayRating {
    score: number;
    level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'None';
    totalTasks: number;
    completedTasks: number;
    message?: string;
}
