import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { LiveTimer } from '../components/LiveTimer';
import { Heatmap } from '../components/Heatmap';
import { StatsCard } from '../components/StatsCard';

import { format } from 'date-fns';
import { CheckCircle, Circle, Trophy, Plus, Flag, Trash2, Folder } from 'lucide-react';
import { useTasks, useDayRating, useCreateTask, useToggleTask, useDeleteTask, useProjects } from '../lib/queries';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const { data: tasks } = useTasks({ scheduledDate: todayStr });
    const { data: rating } = useDayRating(todayStr);
    const { data: projects } = useProjects();
    const createTask = useCreateTask();
    const toggleTask = useToggleTask();
    const deleteTask = useDeleteTask();

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

    const handleToggleTask = (id: string, isCompleted: boolean) => {
        toggleTask.mutate({ id, isCompleted: !isCompleted });
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
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
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
                                <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px]">
                                    {!tasks || tasks.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            No tasks for today. Add one to get started!
                                        </div>
                                    ) : (
                                        tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="group flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                                            >
                                                <button
                                                    onClick={() => handleToggleTask(task.id, task.isCompleted)}
                                                    disabled={toggleTask.isPending}
                                                >
                                                    {task.isCompleted ? (
                                                        <CheckCircle className="w-4 h-4 text-primary" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    )}
                                                </button>
                                                <span className={cn(
                                                    "text-sm truncate flex-1",
                                                    task.isCompleted && "text-muted-foreground line-through"
                                                )}>
                                                    {task.title}
                                                </span>
                                                {task.project && (
                                                    <span
                                                        className="text-[10px] px-1.5 py-0.5 rounded-full border opacity-70"
                                                        style={{ borderColor: task.project.color, color: task.project.color }}
                                                    >
                                                        {task.project.name}
                                                    </span>
                                                )}
                                                <Flag className={cn(
                                                    "w-3 h-3 fill-current",
                                                    task.priority === 'HIGH' && "text-red-500",
                                                    task.priority === 'MEDIUM' && "text-yellow-500",
                                                    task.priority === 'LOW' && "text-blue-500"
                                                )} />
                                                <button
                                                    onClick={() => setTaskToDelete(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 className="w-3 h-3" />
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
