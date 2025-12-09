import { Heatmap } from '@/components/Heatmap';
import { DistributionChart } from '@/components/charts/DistributionChart';
import { TrendChart } from '@/components/charts/TrendChart';

export default function Analytics() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gradient">Analytics</h1>

            <section>
                <Heatmap />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                    <DistributionChart />
                </section>
                <section>
                    <TrendChart />
                </section>
            </div>
        </div>
    );
}
