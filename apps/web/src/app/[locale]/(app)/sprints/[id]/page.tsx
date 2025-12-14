'use client';

import { use } from 'react';
import { useSprint, useSprintStats, useSprintBurndown } from '@/hooks/useSprints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Loader from '@/components/ui/loader';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, ArrowLeft, TrendingDown, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SprintDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function SprintDetailPage({ params }: SprintDetailPageProps) {
    const { id } = use(params);
    const { user } = useAuthStore();
    const { data: sprint, isLoading: isSprintLoading } = useSprint(id);
    const { data: stats, isLoading: isStatsLoading } = useSprintStats(id);
    const { data: burndown } = useSprintBurndown(id);

    const isLoading = isSprintLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Loading sprint..." />
            </div>
        );
    }

    if (!sprint) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sprint not found</h2>
                <Link href="/sprints">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sprints
                    </Button>
                </Link>
            </div>
        );
    }

    const progress = stats?.progress || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/sprints">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{sprint.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <Link
                            href={`/projects/${sprint.projectId}`}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {sprint.project?.name}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

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
                        <div className="flex flex-wrap gap-3">
                            {sprint.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-2 p-2 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.avatarUrl || undefined} alt={`${member.firstName} ${member.lastName}`} />
                                        <AvatarFallback className="text-xs">
                                            {member.firstName?.[0]}{member.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                {stats?.completedTasks || 0}/{stats?.totalTasks || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Tasks Completed</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {stats?.totalEstimatedHours || 0}h
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Estimated Hours</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {stats?.totalActualHours || 0}h
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Actual Hours</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
                <TabsList>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="burndown">Burndown</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sprint Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sprint.tasks && sprint.tasks.length > 0 ? (
                                <div className="space-y-2">
                                    {sprint.tasks.map((task: any) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                                                {task.assignee && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {task.assignee.firstName} {task.assignee.lastName}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={task.status === 'DONE' ? 'success' : 'secondary'}>
                                                {task.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No tasks assigned to this sprint yet
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="burndown" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="w-5 h-5" />
                                Burndown Chart
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {burndown ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Days</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {burndown.totalDays}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Days Passed</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {burndown.daysPassed}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {burndown.remainingHours}h
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Burndown chart visualization would be displayed here
                                    </p>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    Loading burndown data...
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Task Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats?.tasksByStatus ? (
                                <div className="space-y-3">
                                    {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <Badge variant="outline">{status}</Badge>
                                            <span className="text-sm font-medium">{count as number}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No statistics available
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
