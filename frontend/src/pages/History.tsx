import { TimeEntryCard } from '@/components/TimeEntryCard';
import { useEntries } from '@/lib/queries';

export default function History() {
    // Get last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data: entries, isLoading } = useEntries({
        startDate: startDate.toISOString()
    });

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gradient mb-6">History</h1>

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
