import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useStats } from '@/lib/queries';
import { Clock, Calendar, TrendingUp, Flame } from 'lucide-react';

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Today
                    </CardTitle>
                    <Clock className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">
                        {formatDuration(stats?.todayTotal || 0)}
                    </div>
                </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Week
                    </CardTitle>
                    <Calendar className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">
                        {formatDuration(stats?.weekTotal || 0)}
                    </div>
                </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Month
                    </CardTitle>
                    <TrendingUp className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">
                        {formatDuration(stats?.monthTotal || 0)}
                    </div>
                </CardContent>
            </Card>

            <Card className="glass hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Streak
                    </CardTitle>
                    <Flame className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">
                        {stats?.streak || 0} <span className="text-sm font-normal text-muted-foreground">days</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
