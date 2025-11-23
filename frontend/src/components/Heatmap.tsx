import { useMemo } from 'react';
import { useHeatmap } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Heatmap() {
    const { data: heatmapData, isLoading } = useHeatmap();

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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Activity Heatmap
                </CardTitle>
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
                                            "w-3 h-3 rounded-[2px] transition-colors",
                                            day ? getLevelColor(day.level) : "bg-transparent"
                                        )}
                                        title={day ? `${day.displayDate}: ${Math.round(day.duration / 60)} mins` : ''}
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
    );
}
