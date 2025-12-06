import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Timer, BarChart2, History, LogOut, Menu, X, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export function Sidebar() {
    const { pathname } = useLocation();
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/timer', label: 'Timer', icon: Timer },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
        { href: '/tasks', label: 'Tasks', icon: ListTodo },
        { href: '/history', label: 'History', icon: History },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={toggleSidebar}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-2 mb-8 px-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Timer className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            TimeTracker
                        </span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="pt-6 border-t border-border">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={logout}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}
