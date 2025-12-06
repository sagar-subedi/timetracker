import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Tag, Calendar, Trash2, CheckCircle, ListTodo } from 'lucide-react';
import { TimeEntry } from '@shared/types';
import { useDeleteEntry } from '@/lib/queries';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { cn } from '@/lib/utils';

interface TimeEntryCardProps {
    entry: TimeEntry;
}

export function TimeEntryCard({ entry }: TimeEntryCardProps) {
    const startTime = new Date(entry.startTime);
    const endTime = entry.endTime ? new Date(entry.endTime) : null;
    const deleteEntry = useDeleteEntry();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Format duration
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const handleDelete = () => {
        deleteEntry.mutate(entry.id);
        setShowDeleteConfirm(false);
    };

    return (
        <>
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
                                {entry.tasks && entry.tasks.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {entry.tasks.map(task => (
                                            <div key={task.id} className="flex items-center gap-1 text-xs bg-accent/50 px-2 py-1 rounded-full">
                                                <CheckCircle className={cn("w-3 h-3", task.isCompleted ? "text-primary" : "text-muted-foreground")} />
                                                <span className={task.isCompleted ? "text-muted-foreground line-through" : ""}>{task.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                                <div className="flex flex-col items-end gap-1 mr-4">
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={deleteEntry.isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Entry?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete this time entry? This action cannot be undone.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteEntry.isPending}>
                            {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
