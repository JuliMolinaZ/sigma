'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProject, useUpdateProject, useDeleteProject, useProjectFinancials } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Loader from '@/components/ui/loader';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ArrowLeft, Calendar, User, Briefcase, Edit, Trash2,
    CheckCircle2, Clock, DollarSign, TrendingUp,
    BarChart3, Users, FileText, PieChart
} from 'lucide-react';
import Link from 'next/link';
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

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: project, isLoading: isProjectLoading } = useProject(id);
    const { data: financials, isLoading: isFinancialsLoading } = useProjectFinancials(id);
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const isLoading = isProjectLoading || isFinancialsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Loader size="lg" text="Loading project dashboard..." />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project not found</h2>
                <Button variant="outline" onClick={() => router.push('/projects')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Projects
                </Button>
            </div>
        );
    }

    const handleUpdate = async (data: any) => {
        try {
            await updateProject.mutateAsync({ id, data });
            toast.success('Project updated successfully');
            setIsEditOpen(false);
        } catch (error) {
            toast.error('Failed to update project');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProject.mutateAsync(id);
            toast.success('Project deleted successfully');
            router.push('/projects');
        } catch (error) {
            toast.error('Failed to delete project');
            console.error(error);
        }
    };

    // Calculate Progress
    const totalTasks = project._count?.tasks || 0;
    // Assuming we might have completed tasks count in the future, for now using a placeholder or 0
    // If we had task stats, we would use them. Let's use a mock progress if not available.
    const progress = 0; // Placeholder

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
                        <span>/</span>
                        <span>{project.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{project.name}</h1>
                        <Badge variant={project.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-sm px-3 py-1">
                            {project.status}
                        </Badge>
                        {project.phase && (
                            <Badge variant="outline" className="text-sm px-3 py-1 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                {project.phase.name}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-6 pt-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span className="font-medium">{project.client?.nombre || 'No Client'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Ongoing'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>
                                {project.owners && project.owners.length > 0
                                    ? `Owners: ${project.owners.map(o => o.firstName).join(', ')}`
                                    : `Owner: ${project.owner?.firstName} ${project.owner?.lastName}`}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Project
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 border-blue-100 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Invoiced</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {formatCurrency(financials?.totalInvoiced || 0)}
                        </div>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                            {formatCurrency(financials?.outstandingAmount || 0)} outstanding
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 border-green-100 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Profit Margin</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {financials?.margin || 0}%
                        </div>
                        <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                            {formatCurrency(financials?.profit || 0)} net profit
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900 border-purple-100 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Time Logged</CardTitle>
                        <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {financials?.totalHours || 0}h
                        </div>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
                            Total billable hours
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900 border-orange-100 dark:border-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Tasks</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {totalTasks}
                        </div>
                        <div className="mt-2">
                            <Progress value={35} className="h-1.5 bg-orange-200 dark:bg-orange-900/50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Overview</TabsTrigger>
                    <TabsTrigger value="tasks" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Tasks</TabsTrigger>
                    <TabsTrigger value="financials" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Financials</TabsTrigger>
                    <TabsTrigger value="team" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">Team</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {project.description || 'No description provided for this project.'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No recent activity recorded.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Client Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={undefined} />
                                            <AvatarFallback>{project.client?.nombre?.charAt(0) || 'C'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{project.client?.nombre}</p>
                                            <p className="text-sm text-gray-500">{project.client?.contacto || 'No contact'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Email</span>
                                            <span className="text-gray-900 dark:text-gray-100">{project.client?.email || '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Phone</span>
                                            <span className="text-gray-900 dark:text-gray-100">{project.client?.telefono || '-'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tasks">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Project Tasks</CardTitle>
                                <Button size="sm">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Add Task
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-gray-500">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Task management interface coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="financials">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Income vs Expenses</CardTitle>
                                <CardDescription>Financial overview of the project</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Total Invoiced</span>
                                            <span>{formatCurrency(financials?.totalInvoiced || 0)}</span>
                                        </div>
                                        <Progress value={100} className="h-2 bg-gray-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Total Expenses</span>
                                            <span>{formatCurrency(financials?.totalExpenses || 0)}</span>
                                        </div>
                                        <Progress value={(financials?.totalExpenses / (financials?.totalInvoiced || 1)) * 100} className="h-2 bg-red-100 [&>div]:bg-red-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="team">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {project.owners && project.owners.length > 0 ? (
                                    project.owners.map((owner) => (
                                        <div key={owner.id} className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={owner.avatarUrl || undefined} />
                                                <AvatarFallback>{owner.firstName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{owner.firstName} {owner.lastName}</p>
                                                <p className="text-sm text-gray-500">Project Owner</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={project.owner?.avatarUrl || undefined} />
                                            <AvatarFallback>{project.owner?.firstName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{project.owner?.firstName} {project.owner?.lastName}</p>
                                            <p className="text-sm text-gray-500">Project Owner</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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
