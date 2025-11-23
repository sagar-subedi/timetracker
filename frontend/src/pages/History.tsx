import { useMemo } from 'react';
import { TimeEntryCard } from '@/components/TimeEntryCard';
import { useEntries } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

export default function History() {
    // Get last 30 days, memoized to prevent infinite refetch loops
    const startDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }, []);

    const { data: entries, isLoading } = useEntries({
        startDate
    });

    const handleExport = () => {
        if (!entries) return;

        const headers = ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Category', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...entries.map(entry => {
                const date = format(new Date(entry.startTime), 'yyyy-MM-dd');
                const start = format(new Date(entry.startTime), 'HH:mm:ss');
                const end = entry.endTime ? format(new Date(entry.endTime), 'HH:mm:ss') : '';
                const duration = Math.round(entry.duration / 60);
                const category = entry.category?.name || '';
                const notes = `"${(entry.notes || '').replace(/"/g, '""')}"`; // Escape quotes

                return [date, start, end, duration, category, notes].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `time_entries_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gradient">History</h1>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={!entries || entries.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading history...</div>
                ) : entries && entries.length > 0 ? (
                    <div className="space-y-4">
                        {entries.map((entry) => (
                            <TimeEntryCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-2">No entries found in the last 30 days.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
