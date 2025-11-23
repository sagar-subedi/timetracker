import { useState, useEffect } from 'react';
import { Play, Square, Clock, Timer, Coffee, Brain } from 'lucide-react';
import { useActiveTimer, useCategories, useStartTimer, useStopTimer } from '@/lib/queries';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils';

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

    const [elapsed, setElapsed] = useState(0);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [notes, setNotes] = useState('');

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
            startTimer.mutate(selectedCategoryId);
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
                                    style={{ height: `${progress}%` }}
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

                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            {!activeTimer ? (
                                <>
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
                                </>
                            ) : (
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
