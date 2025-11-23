import { LiveTimer } from '@/components/LiveTimer';
import { ManualEntry } from '@/components/ManualEntry';
import { TimeEntryCard } from '@/components/TimeEntryCard';
import { useEntries } from '@/lib/queries';

export default function Timer() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: entries, isLoading } = useEntries({
        startDate: today.toISOString()
    });

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gradient mb-6">Timer</h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4">Live Timer</h2>
                    <LiveTimer />
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Manual Entry</h2>
                    <ManualEntry />
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Today's Entries</h2>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading entries...</div>
                    ) : entries && entries.length > 0 ? (
                        <div className="space-y-4">
                            {entries.map((entry) => (
                                <TimeEntryCard key={entry.id} entry={entry} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No entries for today yet.</p>
                    )}
                </section>
            </div>
        </div>
    );
}
