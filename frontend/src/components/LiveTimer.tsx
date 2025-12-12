import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Play, Square, Clock, Timer, Coffee, Brain, Trash2, CheckCircle, Circle, ListTodo } from 'lucide-react';
import { useActiveTimer, useStartTimer, useStopTimer, useAbandonTimer, useUpdateTaskStatus, useTasks, useCategories } from '@/lib/queries';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils';
import { playCompletionSound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';

const POMODORO_MODES = {
    work: { label: 'Focus', duration: 25 * 60, icon: Brain },
    shortBreak: { label: 'Short Break', duration: 5 * 60, icon: Coffee },
    longBreak: { label: 'Long Break', duration: 15 * 60, icon: Coffee },
};

export function LiveTimer() {
    const { data: activeTimer, isLoading: isLoadingTimer } = useActiveTimer();
    const { data: categories } = useCategories();
    const startTimer = useStartTimer();
    const stopTimer = useStopTimer();
    const abandonTimer = useAbandonTimer();
    const updateTaskStatus = useUpdateTaskStatus();

    // Fetch tasks - same logic as Dashboard (today + overdue)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const { data: todayTasks, refetch: refetchTodayTasks } = useTasks({ scheduledDate: todayStr });
    const { data: allTasks, refetch: refetchAllTasks } = useTasks({});

    // Combine today's tasks with overdue tasks (same as Dashboard)
    const tasks = React.useMemo(() => {
        if (!allTasks) return todayTasks || [];

        const today = new Date(todayStr);
        const overdueTasks = allTasks.filter(task => {
            if (!task.scheduledDate || task.status === 'DONE') return false;
            const scheduledDate = new Date(task.scheduledDate);
            return scheduledDate < today;
        });

        // Include tasks completed today (even if scheduled for past/future)
        const completedTodayTasks = allTasks.filter(task => {
            if (task.status !== 'DONE') return false;
            const updatedAt = new Date(task.updatedAt);
            return format(updatedAt, 'yyyy-MM-dd') === todayStr;
        });

        // Combine and deduplicate
        const combined = [...(todayTasks || []), ...overdueTasks, ...completedTodayTasks];
        const uniqueTasks = Array.from(new Map(combined.map(task => [task.id, task])).values());

        // Sort: overdue first, then by scheduled date, completed last
        return uniqueTasks.sort((a, b) => {
            // 1. Completed tasks at the bottom
            const aCompleted = a.status === 'DONE';
            const bCompleted = b.status === 'DONE';
            if (aCompleted && !bCompleted) return 1;
            if (!aCompleted && bCompleted) return -1;

            const aDate = new Date(a.scheduledDate || '');
            const bDate = new Date(b.scheduledDate || '');
            const today = new Date(todayStr);

            // 2. Overdue tasks at the top
            const aOverdue = aDate < today;
            const bOverdue = bDate < today;

            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;

            // 3. Sort by time
            return aDate.getTime() - bDate.getTime();
        });
    }, [todayTasks, allTasks, todayStr]);

    const [elapsed, setElapsed] = useState(0);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [droppedTaskIds, setDroppedTaskIds] = useState<string[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [notes, setNotes] = useState('');
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
    const [taskUpdateCounter, setTaskUpdateCounter] = useState(0);

    // Force refetch when tasks are updated
    useEffect(() => {
        if (taskUpdateCounter > 0) {
            refetchTodayTasks();
            refetchAllTasks();
        }
    }, [taskUpdateCounter, refetchTodayTasks, refetchAllTasks]);

    // Pomodoro state
    const [isPomodoro, setIsPomodoro] = useState(false);
    const [pomodoroMode, setPomodoroMode] = useState<keyof typeof POMODORO_MODES>('work');

    // Update elapsed time every second
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (activeTimer) {
            const startTime = new Date(activeTimer.startTime).getTime();

            const updateElapsed = () => {
                const now = new Date().getTime();
                setElapsed(Math.floor((now - startTime) / 1000));
            };

            updateElapsed(); // Initial update
            interval = setInterval(updateElapsed, 1000);
        } else {
            setElapsed(0);
        }

        return () => clearInterval(interval);
    }, [activeTimer]);

    // Set default category if none selected
    useEffect(() => {
        if (categories && categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories, selectedCategoryId]);

    const handleStart = () => {
        if (selectedCategoryId) {
            startTimer.mutate({
                categoryId: selectedCategoryId,
                taskIds: droppedTaskIds.length > 0 ? droppedTaskIds : undefined
            });
            setDroppedTaskIds([]); // Reset dropped tasks
        }
    };

    const handleStop = () => {
        stopTimer.mutate(notes);
        setNotes('');
    };

    if (isLoadingTimer) {
        return (
            <Card className="w-full animate-pulse">
                <CardContent className="p-6 h-32" />
            </Card>
        );
    }

    const activeCategory = activeTimer?.category;

    // Calculate display time
    let displayTime = elapsed;
    let isOvertime = false;
    let progress = 0;

    if (isPomodoro) {
        const targetDuration = POMODORO_MODES[pomodoroMode].duration;
        if (activeTimer) {
            const remaining = targetDuration - elapsed;
            if (remaining < 0) {
                displayTime = Math.abs(remaining);
                isOvertime = true;
                progress = 100;
            } else {
                displayTime = remaining;
                progress = (elapsed / targetDuration) * 100;
            }
        } else {
            displayTime = targetDuration;
        }
    }

    return (
        <Card className={cn(
            "w-full transition-all duration-300 border-2",
            activeTimer
                ? isOvertime
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-primary/50 bg-primary/5"
                : "border-border"
        )}>
            <CardContent className="p-6">
                {/* Mode Toggle */}
                <div className="flex justify-end mb-4">
                    <div className="bg-muted p-1 rounded-lg flex gap-1">
                        <button
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                !isPomodoro ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setIsPomodoro(false)}
                        >
                            Standard
                        </button>
                        <button
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                isPomodoro ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setIsPomodoro(true)}
                        >
                            Pomodoro
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Timer Display */}
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors relative overflow-hidden",
                            activeTimer ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            isOvertime && "bg-destructive text-destructive-foreground animate-pulse"
                        )}>
                            {/* Circular Progress Background (Simplified) */}
                            {activeTimer && isPomodoro && !isOvertime && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-black/20 transition-all duration-1000"
                                    style={{ height: `${progress}% ` }}
                                />
                            )}

                            {isPomodoro ? (
                                <Timer className="w-6 h-6 relative z-10" />
                            ) : (
                                <Clock className="w-6 h-6 relative z-10" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <h2 className={cn(
                                    "text-4xl font-mono font-bold tracking-wider",
                                    isOvertime && "text-destructive"
                                )}>
                                    {isOvertime ? '+' : ''}{formatDuration(displayTime)}
                                </h2>
                                {isPomodoro && activeTimer && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        {isOvertime ? 'Overtime' : POMODORO_MODES[pomodoroMode].label}
                                    </span>
                                )}
                            </div>
                            {activeTimer && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Running: <span className="font-medium text-foreground" style={{ color: activeCategory?.color }}>{activeCategory?.name}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        {isPomodoro && !activeTimer && (
                            <div className="flex gap-2 justify-center md:justify-end">
                                {(Object.entries(POMODORO_MODES) as [keyof typeof POMODORO_MODES, typeof POMODORO_MODES['work']][]).map(([key, mode]) => {
                                    const Icon = mode.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setPomodoroMode(key)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
                                                pomodoroMode === key
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-background border-input hover:bg-accent"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {mode.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row items-start gap-4 w-full md:w-auto">
                            {!activeTimer ? (
                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <div className="flex gap-2">
                                        <select
                                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full md:w-48"
                                            value={selectedCategoryId}
                                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                                            disabled={!categories?.length}
                                        >
                                            {categories?.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            size="lg"
                                            className="w-full md:w-auto gap-2"
                                            onClick={handleStart}
                                            disabled={!selectedCategoryId || startTimer.isPending}
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                            Start {isPomodoro ? 'Focus' : 'Timer'}
                                        </Button>
                                    </div>

                                    {/* Drop Zone for Tasks */}
                                    <div
                                        className={cn(
                                            "w-full md:w-64 border-2 border-dashed rounded-lg p-4 transition-all",
                                            isDragOver
                                                ? "border-primary bg-primary/10"
                                                : "border-muted-foreground/30 bg-background/50"
                                        )}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'copy';
                                        }}
                                        onDragEnter={() => setIsDragOver(true)}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragOver(false);
                                            const taskId = e.dataTransfer.getData('taskId');
                                            if (taskId && !droppedTaskIds.includes(taskId)) {
                                                setDroppedTaskIds([...droppedTaskIds, taskId]);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-medium">
                                            <ListTodo className="w-4 h-4" />
                                            Session Tasks
                                        </div>

                                        {droppedTaskIds.length > 0 ? (
                                            <div className="space-y-2">
                                                {droppedTaskIds.map(taskId => {
                                                    // Always get fresh task data from the tasks array
                                                    const task = tasks?.find(t => t.id === taskId);
                                                    if (!task) return null;
                                                    const isCompleted = task.status === 'DONE';

                                                    return (
                                                        <div
                                                            key={`${task.id}-${task.status}-${task.updatedAt || Date.now()}`}
                                                            className={cn(
                                                                "flex items-center gap-2 p-2 rounded text-sm group transition-all duration-200",
                                                                isCompleted ? "bg-muted/50" : "bg-accent/50"
                                                            )}
                                                        >
                                                            <button
                                                                onClick={async () => {
                                                                    const newStatus = isCompleted ? 'TODO' : 'DONE';
                                                                    await updateTaskStatus.mutateAsync({ id: task.id, status: newStatus });
                                                                    setTaskUpdateCounter(prev => prev + 1);
                                                                }}
                                                                className="flex-shrink-0"
                                                                disabled={updateTaskStatus.isPending}
                                                            >
                                                                {isCompleted ? (
                                                                    <CheckCircle className="w-4 h-4 text-primary" />
                                                                ) : (
                                                                    <Circle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                                                                )}
                                                            </button>
                                                            <span
                                                                className={cn(
                                                                    "truncate flex-1 transition-all duration-200",
                                                                    isCompleted && "text-muted-foreground line-through"
                                                                )}
                                                                title={task.title}
                                                            >
                                                                {task.title}
                                                            </span>
                                                            {!activeTimer && (
                                                                <button
                                                                    onClick={() => {
                                                                        setDroppedTaskIds(droppedTaskIds.filter(id => id !== taskId));
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground text-center py-6 italic">
                                                Drag tasks from Today's Plan here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <input
                                            type="text"
                                            placeholder="What are you working on?"
                                            className="flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                        <Button
                                            size="lg"
                                            variant="destructive"
                                            className="gap-2"
                                            onClick={handleStop}
                                            disabled={stopTimer.isPending}
                                        >
                                            <Square className="w-4 h-4 fill-current" />
                                            Stop
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => setShowAbandonConfirm(true)}
                                            disabled={abandonTimer.isPending}
                                            title="Abandon Timer"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    {/* Linked Tasks Display */}
                                    {activeTimer.tasks && activeTimer.tasks.length > 0 && (
                                        <div className="w-full md:w-full border rounded-md p-2 bg-background/50">
                                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground font-medium px-1">
                                                <ListTodo className="w-3 h-3" />
                                                Tasks in this session:
                                            </div>
                                            <div className="space-y-1">
                                                {activeTimer.tasks.map(timerTask => {
                                                    // Find the most up-to-date task object from our fresh queries
                                                    const task = tasks?.find(t => t.id === timerTask.id) ||
                                                        allTasks?.find(t => t.id === timerTask.id) ||
                                                        timerTask;

                                                    const isCompleted = task.status === 'DONE';

                                                    return (
                                                        <div
                                                            key={`${task.id}-${task.status}-${task.updatedAt || Date.now()}`}
                                                            className={cn(
                                                                "flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 transition-all duration-200 cursor-pointer",
                                                                isCompleted && "bg-muted/50"
                                                            )}
                                                            onClick={async () => {
                                                                const newStatus = isCompleted ? 'TODO' : 'DONE';
                                                                await updateTaskStatus.mutateAsync({ id: task.id, status: newStatus });
                                                                setTaskUpdateCounter(prev => prev + 1);

                                                                if (newStatus === 'DONE') {
                                                                    const priority = (task as any).priority || 'MEDIUM';

                                                                    // Play sound
                                                                    playCompletionSound(priority);

                                                                    const config = {
                                                                        HIGH: { particleCount: 200, spread: 100, startVelocity: 45, origin: { y: 0.6 } },
                                                                        MEDIUM: { particleCount: 100, spread: 70, startVelocity: 30, origin: { y: 0.6 } },
                                                                        LOW: { particleCount: 50, spread: 40, startVelocity: 20, origin: { y: 0.6 } }
                                                                    };
                                                                    // @ts-ignore
                                                                    confetti(config[priority] || config.MEDIUM);
                                                                }
                                                            }}
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircle className="w-4 h-4 text-primary" />
                                                            ) : (
                                                                <Circle className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                            <span className={cn(
                                                                "text-sm truncate flex-1 transition-all duration-200",
                                                                isCompleted && "text-muted-foreground line-through"
                                                            )}>
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            <Dialog open={showAbandonConfirm} onOpenChange={setShowAbandonConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Abandon Timer?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to abandon this timer? No time will be recorded.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowAbandonConfirm(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                abandonTimer.mutate();
                                setShowAbandonConfirm(false);
                            }}
                            disabled={abandonTimer.isPending}
                        >
                            Abandon
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
