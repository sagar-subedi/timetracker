import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { LiveTimer } from '../components/LiveTimer';
import { Heatmap } from '../components/Heatmap';
import { StatsCard } from '../components/StatsCard';

import { format } from 'date-fns';
import { CheckCircle, Circle, Trophy, Plus, Flag, Trash2, Folder, AlertCircle } from 'lucide-react';
import { useTasks, useDayRating, useCreateTask, useUpdateTaskStatus, useDeleteTask, useProjects } from '../lib/queries';
import { cn } from '../lib/utils';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const { data: todayTasks } = useTasks({ scheduledDate: todayStr });
    const { data: allTasks } = useTasks({});
    const { data: rating } = useDayRating(todayStr);
    const { data: projects } = useProjects();
    const createTask = useCreateTask();
    const updateTaskStatus = useUpdateTaskStatus();
    const deleteTask = useDeleteTask();

    // Combine today's tasks with overdue tasks (past scheduled date and not completed)
    const tasks = React.useMemo(() => {
        if (!allTasks) return todayTasks || [];

        const today = new Date(todayStr);
        const overdueTasks = allTasks.filter(task => {
            if (!task.scheduledDate || task.status === 'DONE') return false;
            const scheduledDate = new Date(task.scheduledDate);
            return scheduledDate < today;
        });

        // Combine and deduplicate
        const combined = [...(todayTasks || []), ...overdueTasks];
        const uniqueTasks = Array.from(new Map(combined.map(task => [task.id, task])).values());

        // Sort: overdue first, then by scheduled date
        return uniqueTasks.sort((a, b) => {
            const aDate = new Date(a.scheduledDate || '');
            const bDate = new Date(b.scheduledDate || '');
            const today = new Date(todayStr);

            const aOverdue = aDate < today && a.status !== 'DONE';
            const bOverdue = bDate < today && b.status !== 'DONE';

            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;
            return aDate.getTime() - bDate.getTime();
        });
    }, [todayTasks, allTasks, todayStr]);

    const isOverdue = (task: any) => {
        if (!task.scheduledDate || task.status === 'DONE') return false;
        const scheduledDate = new Date(task.scheduledDate);
        const today = new Date(todayStr);
        return scheduledDate < today;
    };

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const togglePriority = () => {
        const priorities: ('LOW' | 'MEDIUM' | 'HIGH')[] = ['LOW', 'MEDIUM', 'HIGH'];
        const currentIndex = priorities.indexOf(newTaskPriority);
        setNewTaskPriority(priorities[(currentIndex + 1) % 3]);
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        createTask.mutate({
            title: newTaskTitle,
            priority: newTaskPriority,
            scheduledDate: `${todayStr}T00:00:00.000Z`, // Force UTC midnight to match backend query
            estimatedTime: 30, // Default 30 mins
            projectId: newTaskProjectId || undefined,
        });
        setNewTaskTitle('');
        setNewTaskPriority('MEDIUM'); // Reset priority
    };

    const handleToggleTask = (id: string, currentStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
        const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
        updateTaskStatus.mutate({ id, status: newStatus });
    };

    const handleDeleteTask = () => {
        if (taskToDelete) {
            deleteTask.mutate(taskToDelete);
            setTaskToDelete(null);
        }
    };

    const getRatingColor = (level: string) => {
        switch (level) {
            case 'Platinum': return 'text-cyan-400';
            case 'Gold': return 'text-yellow-400';
            case 'Silver': return 'text-slate-400';
            case 'Bronze': return 'text-orange-400';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
                    <p className="text-muted-foreground">Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={logout}>Sign out</Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Timer & Heatmap */}
                <div className="lg:col-span-2 space-y-8">
                    <LiveTimer />
                    <Heatmap />
                    <StatsCard />
                </div>

                {/* Right Column: Stats & Tasks */}
                <div className="space-y-8">
                    {/* Today's Plan */}
                    <div className="space-y-4">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium">Today's Plan</CardTitle>
                                {rating && (
                                    <div className="flex items-center gap-1 text-sm font-medium">
                                        <Trophy className={cn("w-4 h-4", getRatingColor(rating.level))} />
                                        <span className={getRatingColor(rating.level)}>{rating.level}</span>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                {/* Add Task Input */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Add a new task..."
                                                className="w-full h-10 pl-3 pr-12 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                            />
                                            <button
                                                onClick={togglePriority}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-full transition-colors"
                                                title={`Priority: ${newTaskPriority}`}
                                            >
                                                <Flag className={cn(
                                                    "w-4 h-4 fill-current",
                                                    newTaskPriority === 'HIGH' && "text-red-500",
                                                    newTaskPriority === 'MEDIUM' && "text-yellow-500",
                                                    newTaskPriority === 'LOW' && "text-blue-500"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={newTaskProjectId}
                                            onChange={(e) => setNewTaskProjectId(e.target.value)}
                                        >
                                            <option value="">No Project</option>
                                            {projects?.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim() || createTask.isPending}>
                                            <Plus className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                                    {!tasks || tasks.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            No tasks for today. Add one to get started!
                                        </div>
                                    ) : (
                                        tasks.map(task => (
                                            <div
                                                key={task.id}
                                                draggable={task.status !== 'DONE'}
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('taskId', task.id);
                                                    e.dataTransfer.effectAllowed = 'copy';
                                                }}
                                                className={cn(
                                                    "group flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-all border",
                                                    isOverdue(task) ? "border-red-500/30 bg-red-500/5" : "border-transparent hover:border-border",
                                                    task.status !== 'DONE' && "cursor-grab active:cursor-grabbing active:opacity-50"
                                                )}
                                            >
                                                <button
                                                    onClick={() => handleToggleTask(task.id, task.status)}
                                                    disabled={updateTaskStatus.isPending}
                                                    className="flex-shrink-0"
                                                >
                                                    {task.status === 'DONE' ? (
                                                        <CheckCircle className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    )}
                                                </button>

                                                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className={cn(
                                                            "text-sm font-medium truncate max-w-md",
                                                            task.status === 'DONE' && "text-muted-foreground line-through"
                                                        )}
                                                        title={task.title}
                                                    >
                                                        {task.title}
                                                    </span>

                                                    {isOverdue(task) && (
                                                        <span title="Overdue">
                                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                                        </span>
                                                    )}
                                                    {task.project ? (
                                                        <span
                                                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                                            style={{
                                                                backgroundColor: `${task.project.color}20`,
                                                                color: task.project.color,
                                                                border: `1px solid ${task.project.color}40`
                                                            }}
                                                        >
                                                            {task.project.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                    <span title={`Priority: ${task.priority}`}>
                                                        <Flag
                                                            className={cn(
                                                                "w-4 h-4 fill-current",
                                                                task.priority === 'HIGH' && "text-red-500",
                                                                task.priority === 'MEDIUM' && "text-yellow-500",
                                                                task.priority === 'LOW' && "text-blue-500"
                                                            )}
                                                        />
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => setTaskToDelete(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete this task?</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTask} disabled={deleteTask.isPending}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
