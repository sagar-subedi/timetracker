import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { useProjects, useCreateProject, useDeleteProject } from '../lib/queries';
import { Plus, Folder, Trash2, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Projects() {
    const { user } = useAuth();
    const { data: projects, isLoading } = useProjects();
    const createProject = useCreateProject();
    const deleteProject = useDeleteProject();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#3b82f6'); // Default blue
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    const handleCreate = () => {
        if (!newProjectName.trim()) return;
        createProject.mutate({
            name: newProjectName,
            description: newProjectDesc,
            color: newProjectColor,
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setNewProjectName('');
                setNewProjectDesc('');
                setNewProjectColor('#3b82f6');
            }
        });
    };

    const handleDelete = () => {
        if (projectToDelete) {
            deleteProject.mutate(projectToDelete);
            setProjectToDelete(null);
        }
    };

    const colors = [
        '#ef4444', // Red
        '#f97316', // Orange
        '#eab308', // Yellow
        '#22c55e', // Green
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">Manage your projects and group related tasks.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse h-32" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects?.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            <Folder className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No projects yet. Create one to get started!</p>
                        </div>
                    ) : (
                        projects?.map((project) => (
                            <Card key={project.id} className="group hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: project.color }}>
                                <CardHeader className="flex flex-row items-start justify-between pb-2">
                                    <CardTitle className="text-lg font-semibold truncate pr-4">
                                        {project.name}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive -mr-2 -mt-2"
                                        onClick={() => setProjectToDelete(project.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <LayoutGrid className="w-3 h-3" />
                                        <span>{project._count?.tasks || 0} tasks</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <input
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Project Name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description (Optional)</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="What is this project about?"
                                value={newProjectDesc}
                                onChange={(e) => setNewProjectDesc(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all",
                                            newProjectColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewProjectColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newProjectName.trim() || createProject.isPending}>
                            {createProject.isPending ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete this project? All associated tasks will be deleted.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteProject.isPending}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
