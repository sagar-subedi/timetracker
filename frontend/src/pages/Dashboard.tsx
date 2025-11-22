import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Welcome back, {user?.name}!</p>
                    </div>
                    <Button onClick={logout} variant="outline">
                        Logout
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg">Today's Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">0h 0m</p>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg">This Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">0h 0m</p>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg">This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">0h 0m</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Quick Start</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Start tracking your time by clicking the timer button above!
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
