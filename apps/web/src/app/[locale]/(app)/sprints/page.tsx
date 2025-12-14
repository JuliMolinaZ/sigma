'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Calendar, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Loader from '@/components/ui/loader'
import { Sprint } from '@/types'
import { formatDate } from '@/lib/utils'
import { useSprints, useCreateSprint } from '@/hooks/useSprints'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet"
import { SprintForm } from '@/components/sprints/SprintForm'
import { SprintDetailsPanel } from '@/components/sprints/SprintDetailsPanel'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import AccessDenied from '@/components/ui/access-denied'
import { checkModuleAccess } from '@/lib/constants'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from 'next-intl'

export default function SprintsPage() {
    const { user } = useAuthStore()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const limit = 10
    const t = useTranslations('sprints')

    const userRole = (typeof user?.role === 'string' ? user.role : (user?.role as any)?.name) || ''
    const canCreateSprint = ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMINISTRATOR', 'CEO', 'GERENTE OPERACIONES', 'PROJECT MANAGER', 'PROJECT_MANAGER'].includes(userRole.toUpperCase())

    const { data: response, isLoading: loading } = useSprints({ page, limit })
    const sprints = response?.data || []
    const meta = response?.meta
    const createSprint = useCreateSprint()

    if (!checkModuleAccess('sprints', user)) {
        return <AccessDenied />
    }

    const handleCreate = async (data: any) => {
        try {
            await createSprint.mutateAsync(data)
            toast.success(t('createDialog.success'))
            setIsCreateOpen(false)
        } catch (error) {
            toast.error(t('createDialog.error'))
            console.error(error)
        }
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                {canCreateSprint && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('create')}
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="p-4 flex-none">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <Button variant="secondary">
                        <Filter className="w-4 h-4 mr-2" />
                        {t('filters.title', { defaultValue: 'Filters' })}
                    </Button>
                </div>
            </Card>

            {/* Sprints Table */}
            <Card className="flex-1 overflow-hidden border-0 shadow-sm bg-transparent">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader size="lg" text={t('loading')} />
                    </div>
                ) : sprints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <Target className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('empty.title')}</p>
                        <p className="text-sm text-gray-400">{t('empty.description')}</p>
                    </div>
                ) : (
                    <div className="overflow-auto h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sprint</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tasks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {sprints.map((sprint: Sprint) => (
                                    <tr
                                        key={sprint.id}
                                        onClick={() => setSelectedSprintId(sprint.id)}
                                        className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                                                    {sprint.name}
                                                </span>
                                                {sprint.goal && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                                        {sprint.goal}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                                {sprint.project?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-sm">
                                                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{formatDate(sprint.startDate)}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 ml-5.5">
                                                    to {formatDate(sprint.endDate)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {sprint.members && sprint.members.length > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <div className="flex -space-x-2">
                                                        {sprint.members.slice(0, 3).map((member) => (
                                                            <Avatar key={member.id} className="h-7 w-7 border-2 border-white dark:border-gray-800">
                                                                <AvatarImage src={member.avatarUrl || undefined} alt={`${member.firstName} ${member.lastName}`} />
                                                                <AvatarFallback className="text-xs">
                                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                    </div>
                                                    {sprint.members.length > 3 && (
                                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                            +{sprint.members.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">No members</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="font-medium">
                                                {sprint._count?.tasks || 0} tasks
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {meta && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, meta.total)}</span> of <span className="font-medium">{meta.total}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= (meta.totalPages || Math.ceil(meta.total / limit))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('createDialog.title')}</DialogTitle>
                    </DialogHeader>
                    <SprintForm
                        onSubmit={handleCreate}
                        isLoading={createSprint.isPending}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Details Sheet */}
            <Sheet open={!!selectedSprintId} onOpenChange={(open) => !open && setSelectedSprintId(null)}>
                <SheetContent
                    side="right"
                    className="w-[400px] sm:w-[540px] md:w-[600px] p-0 border-l border-gray-200 dark:border-gray-800"
                >
                    <SheetTitle className="sr-only">Sprint Details</SheetTitle>
                    {selectedSprintId && (
                        <SprintDetailsPanel
                            sprintId={selectedSprintId}
                            onClose={() => setSelectedSprintId(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
