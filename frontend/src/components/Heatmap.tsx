import { useMemo, useState } from 'react';
import { useHeatmap, useCategories, useEntries } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { TimeEntryCard } from './TimeEntryCard';
import { Activity, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function Heatmap() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const { data: heatmapData, isLoading } = useHeatmap(selectedCategoryId || undefined);
    const { data: categories } = useCategories();

    // Fetch entries for the selected date when modal is open
    // We need to construct start/end times for the selected date
    const dateQuery = useMemo(() => {
        if (!selectedDate) return undefined;
        const start = new Date(selectedDate);
        // Ensure we get the full day in local time
        // The date string from heatmap is YYYY-MM-DD
        // We want 00:00:00 to 23:59:59 of that day
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(start);
        endDate.setHours(23, 59, 59, 999);

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            categoryId: selectedCategoryId || undefined
        };
    }, [selectedDate, selectedCategoryId]);

    const { data: dayEntries, isLoading: isLoadingEntries } = useEntries(dateQuery);

    // Process data to fill in missing days for the last 365 days
    const days = useMemo(() => {
        const today = new Date();
        const result = [];
        const dataMap = new Map(heatmapData?.map((d) => [d.date, d]) || []);

        // Generate last 365 days
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const data = dataMap.get(dateStr);

            result.push({
                date: dateStr,
                level: data?.level || 0,
                duration: data?.duration || 0,
                displayDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            });
        }
        return result;
    }, [heatmapData]);

    // Group by weeks for the grid
    const weeks = useMemo(() => {
        type DayData = typeof days[0];
        const result: (DayData | null)[][] = [];
        let currentWeek: (DayData | null)[] = [];

        // Pad the beginning if the first day isn't Sunday
        const firstDay = new Date(days[0]?.date || new Date());
        const dayOfWeek = firstDay.getDay(); // 0 = Sunday

        for (let i = 0; i < dayOfWeek; i++) {
            currentWeek.push(null);
        }

        days.forEach((day) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            result.push(currentWeek);
        }

        return result;
    }, [days]);

    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-primary/20';
            case 2: return 'bg-primary/40';
            case 3: return 'bg-primary/60';
            case 4: return 'bg-primary';
            default: return 'bg-muted/20';
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Activity Heatmap
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Activity Heatmap
                    </CardTitle>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories?.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto pb-2">
                        <div className="flex gap-1 min-w-max">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-1">
                                    {week.map((day, dayIndex) => (
                                        <div
                                            key={day ? day.date : `empty-${weekIndex}-${dayIndex}`}
                                            className={cn(
                                                "w-3 h-3 rounded-[2px] transition-colors cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1",
                                                day ? getLevelColor(day.level) : "bg-transparent pointer-events-none"
                                            )}
                                            title={day ? `${day.displayDate}: ${Math.round(day.duration / 60)} mins` : ''}
                                            onClick={() => day && setSelectedDate(day.date)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-[2px] bg-muted/20" />
                            <div className="w-3 h-3 rounded-[2px] bg-primary/20" />
                            <div className="w-3 h-3 rounded-[2px] bg-primary/40" />
                            <div className="w-3 h-3 rounded-[2px] bg-primary/60" />
                            <div className="w-3 h-3 rounded-[2px] bg-primary" />
                        </div>
                        <span>More</span>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            Activity on {selectedDate && format(new Date(selectedDate), 'MMMM d, yyyy')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        {isLoadingEntries ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : dayEntries && dayEntries.length > 0 ? (
                            <div className="space-y-3">
                                {dayEntries.map(entry => (
                                    <TimeEntryCard key={entry.id} entry={entry} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No activity recorded for this day.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
