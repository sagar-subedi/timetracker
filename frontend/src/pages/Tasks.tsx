import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle, Circle, Trash2, Flag, Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Task } from '@shared/types';
import { useUpdateTaskStatus } from '../lib/queries';


export default function Tasks() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        priority: 'MEDIUM' as const,
        estimatedTime: 0,
        scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    });

    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const { data } = await api.get<Task[]>('/tasks');
            return data;
        },
    });

    const createTask = useMutation({
        mutationFn: async (taskData: any) => {
            const { data } = await api.post('/tasks', {
                ...taskData,
                scheduledDate: taskData.scheduledDate ? new Date(taskData.scheduledDate).toISOString() : null,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsCreating(false);
            setNewTask({
                title: '',
                priority: 'MEDIUM',
                estimatedTime: 0,
                scheduledDate: format(new Date(), 'yyyy-MM-dd'),
            });
        },
    });

    const updateTaskStatus = useUpdateTaskStatus();

    const deleteTask = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createTask.mutate(newTask);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'LOW': return 'text-green-500 bg-green-500/10 border-green-500/20';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gradient">Tasks & Planning</h1>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                </Button>
            </div>

            {isCreating && (
                <Card className="glass animate-in fade-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle>Create New Task</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="What needs to be done?"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Scheduled Date</label>
                                    <Input
                                        type="date"
                                        value={newTask.scheduledDate}
                                        onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Priority</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Est. Time (minutes)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={newTask.estimatedTime}
                                        onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createTask.isPending}>
                                    {createTask.isPending ? 'Creating...' : 'Create Task'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
                ) : tasks?.length === 0 ? (
                    <div className="text-center py-12 glass rounded-lg">
                        <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No tasks yet</h3>
                        <p className="text-muted-foreground">Create a task to get started!</p>
                    </div>
                ) : (
                    tasks?.map((task) => (
                        <div
                            key={task.id}
                            className={cn(
                                "group flex items-center gap-3 p-3 rounded-md transition-all border",
                                task.status === 'DONE' ? "bg-muted/50 border-transparent" : "glass border-border/50"
                            )}
                        >
                            <button
                                onClick={() => {
                                    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
                                    updateTaskStatus.mutate({ id: task.id, status: newStatus });
                                }}
                                className={cn(
                                    "transition-colors",
                                    task.status === 'DONE' ? "text-primary" : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                {task.status === 'DONE' ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <Circle className="w-6 h-6" />
                                )}
                            </button>

                            <div className="flex-1 min-w-0">
                                <span className={cn(
                                    "text-sm flex-1",
                                    task.status === 'DONE' && "text-muted-foreground line-through"
                                )}>
                                    {task.title}
                                </span>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    {task.scheduledDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(task.scheduledDate), 'MMM dd, yyyy')}
                                        </span>
                                    )}
                                    {task.estimatedTime > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {task.estimatedTime}m
                                        </span>
                                    )}
                                    {task.project ? (
                                        <span
                                            className="px-2 py-0.5 rounded-full text-xs"
                                            style={{
                                                backgroundColor: `${task.project.color}20`,
                                                color: task.project.color,
                                                border: `1px solid ${task.project.color}40`
                                            }}
                                        >
                                            {task.project.name}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                                            Unassigned
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTask.mutate(task.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
