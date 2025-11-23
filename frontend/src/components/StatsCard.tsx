import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useStats } from '@/lib/queries';
import { Clock, Calendar, TrendingUp } from 'lucide-react';

export function StatsCard() {
    const { data: stats, isLoading } = useStats();

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="glass animate-pulse">
                        <CardHeader>
                            <div className="h-6 w-24 bg-muted/20 rounded"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-muted/20 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Today's Total
                    </CardTitle>
                    <Clock className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">
                        {formatDuration(stats?.todayTotal || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Tracked today
                    </p>
                </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        This Week
                    </CardTitle>
                    <Calendar className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">
                        {formatDuration(stats?.weekTotal || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Since Monday
                    </p>
                </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        This Month
                    </CardTitle>
                    <TrendingUp className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">
                        {formatDuration(stats?.monthTotal || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total for {new Date().toLocaleString('default', { month: 'long' })}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
