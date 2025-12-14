'use client';

import { useSprint, useUpdateSprint, useDeleteSprint, useSprintStats } from '@/hooks/useSprints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Loader from '@/components/ui/loader';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, Edit, Trash2, X, CheckCircle2, Clock, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
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
import { SprintForm } from '@/components/sprints/SprintForm';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SprintDetailsPanelProps {
    sprintId: string;
    onClose: () => void;
}

export function SprintDetailsPanel({ sprintId, onClose }: SprintDetailsPanelProps) {
    const { user } = useAuthStore();
    const { data: sprint, isLoading: isSprintLoading } = useSprint(sprintId);
    const { data: stats, isLoading: isStatsLoading } = useSprintStats(sprintId);
    const updateSprint = useUpdateSprint();
    const deleteSprint = useDeleteSprint();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const isLoading = isSprintLoading;

    const userRole = (typeof user?.role === 'string' ? user.role : (user?.role as any)?.name) || '';
    const canEdit = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMINISTRATOR', 'CEO', 'GERENTE OPERACIONES', 'PROJECT MANAGER', 'PROJECT_MANAGER'].includes(userRole.toUpperCase());

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Loading sprint details..." />
            </div>
        );
    }

    if (!sprint) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sprint not found</h2>
                <Button variant="outline" onClick={onClose}>
                    Close Panel
                </Button>
            </div>
        );
    }

    const handleUpdate = async (data: any) => {
        try {
            await updateSprint.mutateAsync({ id: sprintId, data });
            toast.success('Sprint updated successfully');
            setIsEditOpen(false);
        } catch (error) {
            toast.error('Failed to update sprint');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteSprint.mutateAsync(sprintId);
            toast.success('Sprint deleted successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to delete sprint');
            console.error(error);
        }
    };

    const totalTasks = sprint._count?.tasks || 0;
    const progress = stats?.progress || 0;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sprint.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Link
                                href={`/projects/${sprint.projectId}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                {sprint.project?.name}
                            </Link>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{totalTasks} tasks</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Sprint Goal */}
                {sprint.goal && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Sprint Goal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{sprint.goal}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Sprint Members */}
                {sprint.members && sprint.members.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Sprint Members ({sprint.members.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {sprint.members.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatarUrl || undefined} alt={`${member.firstName} ${member.lastName}`} />
                                            <AvatarFallback className="text-xs">
                                                {member.firstName?.[0]}{member.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {member.firstName} {member.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {typeof member.role === 'string' ? member.role : (member.role as any)?.name || 'No role'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                {!isStatsLoading && stats && (
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {stats.completedTasks}/{stats.totalTasks}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Tasks Completed</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {stats.totalEstimatedHours || 0}h
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Estimated Hours</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {stats.totalActualHours || 0}h
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Actual Hours</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tasks by Status */}
                {stats?.tasksByStatus && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Tasks by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <Badge variant="outline">{status}</Badge>
                                        <span className="text-sm font-medium">{count as number}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Footer Actions */}
            {canEdit && (
                <div className="flex-none p-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditOpen(true)}
                            className="flex-1"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDeleteOpen(true)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Sprint</DialogTitle>
                    </DialogHeader>
                    <SprintForm
                        initialData={sprint}
                        onSubmit={handleUpdate}
                        isLoading={updateSprint.isPending}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this sprint? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
