import { Heatmap } from '@/components/Heatmap';

export default function Analytics() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gradient mb-6">Analytics</h1>
            <div className="space-y-8">
                <Heatmap />
            </div>
        </div>
    );
}
