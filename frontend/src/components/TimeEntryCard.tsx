import { format } from 'date-fns';
import { Clock, Tag, Calendar } from 'lucide-react';
import { TimeEntry } from '@shared/types';
import { Card, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';

interface TimeEntryCardProps {
    entry: TimeEntry;
}

export function TimeEntryCard({ entry }: TimeEntryCardProps) {
    const startTime = new Date(entry.startTime);
    const endTime = entry.endTime ? new Date(entry.endTime) : null;

    // Format duration
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: entry.category?.color || '#ccc' }}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: entry.category?.color || '#ccc' }}
                        >
                            {/* We could dynamically render icons here if we had a mapping */}
                            <Tag className="w-5 h-5" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg">{entry.category?.name || 'Uncategorized'}</h3>
                            {entry.notes && (
                                <p className="text-sm text-muted-foreground">{entry.notes}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDuration(entry.duration)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(startTime, 'MMM d, h:mm a')}</span>
                            {endTime && (
                                <>
                                    <span>-</span>
                                    <span>{format(endTime, 'h:mm a')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
