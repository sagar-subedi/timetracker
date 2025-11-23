import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTrends } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function TrendChart() {
    const { data: trends, isLoading } = useTrends(30);

    if (isLoading) {
        return (
            <Card className="h-[400px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Daily Trends (Last 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    // Format duration for tooltip (hours)
    const formatDuration = (seconds: number) => {
        const hours = (seconds / 3600).toFixed(1);
        return `${hours}h`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
                    <p className="font-medium">{format(parseISO(label), 'MMM d, yyyy')}</p>
                    <p className="text-primary">
                        {Math.floor(payload[0].value / 3600)}h {Math.floor((payload[0].value % 3600) / 60)}m
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Daily Trends (Last 30 Days)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                            fontSize={12}
                            tickMargin={10}
                        />
                        <YAxis
                            tickFormatter={(seconds) => `${Math.floor(seconds / 3600)}h`}
                            fontSize={12}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                            dataKey="duration"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
