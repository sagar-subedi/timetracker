import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { CheckCircle, Circle, Flag, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

interface Task {
    id: string;
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    isCompleted: boolean;
}

interface KanbanBoardProps {
    tasks: Task[];
    onTaskStatusChange: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
}

const COLUMNS = [
    { id: 'TODO' as const, title: 'To Do', color: 'border-blue-500' },
    { id: 'IN_PROGRESS' as const, title: 'In Progress', color: 'border-yellow-500' },
    { id: 'DONE' as const, title: 'Done', color: 'border-green-500' },
];

export function KanbanBoard({ tasks, onTaskStatusChange }: KanbanBoardProps) {
    const [draggedTask, setDraggedTask] = useState<string | null>(null);

    const handleDragStart = (taskId: string) => {
        setDraggedTask(taskId);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
        e.preventDefault();
        if (draggedTask) {
            onTaskStatusChange(draggedTask, status);
        }
        setDraggedTask(null);
    };

    const getTasksByStatus = (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
        return tasks.filter(task => task.status === status);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(column => {
                const columnTasks = getTasksByStatus(column.id);

                return (
                    <div
                        key={column.id}
                        className="flex flex-col"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        <Card className={cn("flex-1 border-t-4", column.color)}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>{column.title}</span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {columnTasks.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 min-h-[200px]">
                                {columnTasks.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No tasks
                                    </div>
                                ) : (
                                    columnTasks.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={() => handleDragStart(task.id)}
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                                "group flex items-start gap-2 p-3 rounded-md bg-card border border-border hover:shadow-md transition-all cursor-move",
                                                draggedTask === task.id && "opacity-50"
                                            )}
                                        >
                                            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />

                                            {task.status === 'DONE' ? (
                                                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            )}

                                            <span className={cn(
                                                "text-sm flex-1",
                                                task.status === 'DONE' && "text-muted-foreground line-through"
                                            )}>
                                                {task.title}
                                            </span>

                                            <Flag className={cn(
                                                "w-3 h-3 fill-current mt-0.5 flex-shrink-0",
                                                task.priority === 'HIGH' && "text-red-500",
                                                task.priority === 'MEDIUM' && "text-yellow-500",
                                                task.priority === 'LOW' && "text-blue-500"
                                            )} />
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}
