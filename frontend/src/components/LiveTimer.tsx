import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { useActiveTimer, useCategories, useStartTimer, useStopTimer } from '@/lib/queries';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils';

export function LiveTimer() {
    const { data: activeTimer, isLoading: isLoadingTimer } = useActiveTimer();
    const { data: categories } = useCategories();
    const startTimer = useStartTimer();
    const stopTimer = useStopTimer();

    const [elapsed, setElapsed] = useState(0);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [notes, setNotes] = useState('');

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
        console.log('Starting timer with category:', selectedCategoryId);
        if (selectedCategoryId) {
            startTimer.mutate(selectedCategoryId, {
                onSuccess: (data) => console.log('Timer started successfully:', data),
                onError: (error) => console.error('Failed to start timer:', error),
            });
        }
    };

    const handleStop = () => {
        console.log('Stopping timer');
        stopTimer.mutate(notes, {
            onSuccess: (data) => console.log('Timer stopped successfully:', data),
            onError: (error) => console.error('Failed to stop timer:', error),
        });
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

    return (
        <Card className={cn(
            "w-full transition-all duration-300 border-2",
            activeTimer ? "border-primary/50 bg-primary/5" : "border-border"
        )}>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Timer Display */}
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                            activeTimer ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"
                        )}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-mono font-bold tracking-wider">
                                {formatDuration(elapsed)}
                            </h2>
                            {activeTimer && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Running: <span className="font-medium text-foreground" style={{ color: activeCategory?.color }}>{activeCategory?.name}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
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
                                    Start Timer
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
            </CardContent>
        </Card>
    );
}
