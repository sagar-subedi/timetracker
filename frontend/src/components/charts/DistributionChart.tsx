import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDistribution } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PieChart as PieChartIcon } from 'lucide-react';

export function DistributionChart() {
    const { data: distribution, isLoading } = useDistribution(30);

    if (isLoading) {
        return (
            <Card className="h-[400px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Time Distribution (Last 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    if (!distribution || distribution.length === 0) {
        return (
            <Card className="h-[400px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Time Distribution (Last 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        );
    }

    // Format duration for tooltip
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                    <p className="font-medium" style={{ color: data.color }}>{data.categoryName}</p>
                    <p>{formatDuration(data.duration)}</p>
                    <p className="text-muted-foreground">{data.percentage.toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Time Distribution (Last 30 Days)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="duration"
                        >
                            {distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => (
                                <span style={{ color: entry.payload.color }}>{entry.payload.categoryName}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
