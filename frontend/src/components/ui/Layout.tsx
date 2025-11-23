import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:pl-64 min-h-screen transition-all duration-200 ease-in-out">
                <div className="container mx-auto p-4 md:p-8 pt-16 md:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
