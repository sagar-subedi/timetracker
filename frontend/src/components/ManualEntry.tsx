import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useCategories, useCreateEntry } from '@/lib/queries';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';

export function ManualEntry() {
    const { data: categories } = useCategories();
    const createEntry = useCreateEntry();

    const [categoryId, setCategoryId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!categoryId || !startTime || !endTime) {
            setError('Please fill in all required fields');
            return;
        }

        if (new Date(startTime) >= new Date(endTime)) {
            setError('End time must be after start time');
            return;
        }

        try {
            await createEntry.mutateAsync({
                categoryId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                notes,
            });

            // Reset form
            setStartTime('');
            setEndTime('');
            setNotes('');
            // Keep category selected
        } catch (err) {
            console.error('Failed to create entry:', err);
            setError('Failed to create entry');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Manual Entry
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <Input
                                placeholder="What did you do?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Time</label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Time</label>
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={createEntry.isPending}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {createEntry.isPending ? 'Adding...' : 'Add Entry'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
