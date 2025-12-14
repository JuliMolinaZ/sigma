'use client';

import { useProject, useUpdateProject, useDeleteProject, useProjectFinancials } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Loader from '@/components/ui/loader';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Calendar, User, Briefcase, Edit, Trash2,
    CheckCircle2, Clock, DollarSign, TrendingUp,
    X
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectForm } from '@/components/projects/ProjectForm';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

interface ProjectDetailsPanelProps {
    projectId: string;
    onClose: () => void;
}

export function ProjectDetailsPanel({ projectId, onClose }: ProjectDetailsPanelProps) {
    const { user } = useAuthStore();
    const { data: project, isLoading: isProjectLoading } = useProject(projectId);
    const { data: financials, isLoading: isFinancialsLoading } = useProjectFinancials(projectId);
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const isLoading = isProjectLoading;

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMINISTRATOR', 'CEO', 'GERENTE OPERACIONES'].includes(user?.role?.toUpperCase() || '');
    // const isOwner = project?.ownerId === user?.id; // Removed to restrict PMs
    const canEdit = isAdmin;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Loading project details..." />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Project not found</h2>
                <Button variant="outline" onClick={onClose}>
                    Close Panel
                </Button>
            </div>
        );
    }

    const handleUpdate = async (data: any) => {
        try {
            await updateProject.mutateAsync({ id: projectId, data });
            toast.success('Project updated successfully');
            setIsEditOpen(false);
        } catch (error) {
            toast.error('Failed to update project');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProject.mutateAsync(projectId);
            toast.success('Project deleted successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to delete project');
            console.error(error);
        }
    };

    const totalTasks = project._count?.tasks || 0;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{project.name}</h2>
                        <div className="flex items-center gap-2">
                            <Badge variant={project.status === 'ACTIVE' ? 'success' : 'secondary'} className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                                {project.status}
                            </Badge>
                            {project.phase && (
                                <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                    {project.phase.name}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Actions moved to footer */}
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{project.client?.nombre || 'No Client'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                            {project.owners && project.owners.length > 0
                                ? project.owners.map(o => `${o.firstName} ${o.lastName}`).join(', ')
                                : (project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unassigned')}
                        </span>
                    </div>
                </div>
            </div>



            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Hours</span>
                                <Clock className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                {financials?.totalHours || 0}h
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Tasks</span>
                                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                {totalTasks}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {project.description || 'No description provided.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Project Info Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-blue-500" />
                                    Project Details
                                </h3>
                            </div>
                            <div className="p-5 space-y-6">
                                {/* Client */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client</p>
                                        <div className="flex items-center gap-2">
                                            {project.client ? (
                                                <>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.client.nombre}</span>
                                                    <span className="text-xs text-gray-500">({project.client.contacto || 'No contact'})</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">No Client</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</p>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {formatDate(project.startDate)}
                                            {project.endDate && ` - ${formatDate(project.endDate)}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Owner */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Project Owner</p>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {project.owners && project.owners.length > 0
                                                ? project.owners.map(o => `${o.firstName} ${o.lastName}`).join(', ')
                                                : (project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unassigned')}
                                        </div>
                                    </div>
                                </div>

                                {/* Financials (if available) - RBAC Protected */}
                                {isAdmin && project.amountWithTax && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</p>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                ${Number(project.amountWithTax).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer - RBAC Protected */}
                            {canEdit && (
                                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditOpen(true)}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 text-xs h-8"
                                    >
                                        <Edit className="w-3.5 h-3.5 mr-2" />
                                        Edit Project
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsDeleteOpen(true)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-8"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                        Delete Project
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="tasks">
                        <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Tasks module integration coming soon.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="team">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold mb-2">Project Manager</h4>
                                        <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <Avatar>
                                                <AvatarFallback>{project.owner?.firstName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{project.owner?.firstName} {project.owner?.lastName}</p>
                                                <p className="text-xs text-gray-500">Project Manager</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Team Members</h4>
                                        {project.members && project.members.length > 0 ? (
                                            <div className="space-y-2">
                                                {project.members.map((member: any) => (
                                                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={member.avatarUrl || undefined} />
                                                            <AvatarFallback>{member.firstName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                                                            <p className="text-xs text-gray-500">{member.role?.name || 'Member'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No team members assigned.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                    </DialogHeader>
                    <ProjectForm
                        initialData={project}
                        onSubmit={handleUpdate}
                        isLoading={updateProject.isPending}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {deleteProject.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
