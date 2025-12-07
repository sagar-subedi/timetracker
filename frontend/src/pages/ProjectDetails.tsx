import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useTasks, useUpdateTaskStatus, useCreateTask } from '../lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KanbanBoard } from '../components/KanbanBoard';
import { ArrowLeft, Clock, Target, TrendingUp, Calendar, Plus, Flag } from 'lucide-react';
import { formatDuration, cn } from '../lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: project, isLoading } = useProject(id!);
    const { data: tasks } = useTasks({ projectId: id });
    const updateTaskStatus = useUpdateTaskStatus();
    const createTask = useCreateTask();

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

    const togglePriority = () => {
        const priorities: ('LOW' | 'MEDIUM' | 'HIGH')[] = ['LOW', 'MEDIUM', 'HIGH'];
        const currentIndex = priorities.indexOf(newTaskPriority);
        setNewTaskPriority(priorities[(currentIndex + 1) % 3]);
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        const today = new Date().toISOString();
        createTask.mutate({
            title: newTaskTitle,
            priority: newTaskPriority,
            projectId: id,
            estimatedTime: 30,
            scheduledDate: today,
        }, {
            onSuccess: () => {
                setNewTaskTitle('');
                setNewTaskPriority('MEDIUM');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-muted/20 rounded"></div>
                    <div className="h-32 bg-muted/20 rounded"></div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <p>Project not found</p>
            </div>
        );
    }

    const progressPercent = project.progress || 0;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: project.color }}>
                        {project.name}
                    </h1>
                    {project.description && (
                        <p className="text-muted-foreground mt-1">{project.description}</p>
                    )}
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    project.status === 'ACTIVE' && "bg-green-500/10 text-green-500",
                    project.status === 'COMPLETED' && "bg-blue-500/10 text-blue-500",
                    project.status === 'ARCHIVED' && "bg-gray-500/10 text-gray-500"
                )}>
                    {project.status}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Time Spent
                        </CardTitle>
                        <Clock className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(project.totalDuration || 0)}
                        </div>
                        {project.budget && (
                            <p className="text-xs text-muted-foreground mt-1">
                                of {formatDuration(project.budget * 60)} budgeted
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Progress
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progressPercent}%</div>
                        <div className="w-full bg-muted/20 rounded-full h-2 mt-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${progressPercent}% ` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tasks
                        </CardTitle>
                        <Target className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.completedTasks || 0}/{project.totalTasks || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">completed</p>
                    </CardContent>
                </Card>

                {project.deadline && (
                    <Card className="glass">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Deadline
                            </CardTitle>
                            <Calendar className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">
                                {format(new Date(project.deadline), 'MMM dd, yyyy')}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Task Creation */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Task</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Task title..."
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
                        <Button onClick={handleAddTask} disabled={!newTaskTitle.trim() || createTask.isPending}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Kanban Board */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                <KanbanBoard
                    tasks={tasks || []}
                    onTaskStatusChange={(taskId, newStatus) => {
                        updateTaskStatus.mutate({ id: taskId, status: newStatus });
                    }}
                />
            </div>
        </div>
    );
}
