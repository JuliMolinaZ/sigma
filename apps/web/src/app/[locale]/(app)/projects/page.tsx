'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Briefcase, Calendar, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Loader from '@/components/ui/loader'
import { Project } from '@/types'
import { formatDate } from '@/lib/utils'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
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
import { ProjectForm } from '@/components/projects/ProjectForm'
import { ProjectDetailsPanel } from '@/components/projects/ProjectDetailsPanel'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth.store'

export default function ProjectsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const limit = 10
    const t = useTranslations('projects')
    const { user } = useAuthStore()
    const userRole = (typeof user?.role === 'string' ? user.role : (user?.role as any)?.name) || ''
    const showFinancials = ['SUPERADMIN', 'CEO', 'CFO', 'CONTADOR SENIOR', 'GERENTE OPERACIONES'].includes(userRole.toUpperCase())

    const { data: response, isLoading: loading } = useProjects({ page, limit, search: searchTerm })
    const projects = response?.data || []
    const meta = response?.meta
    const createProject = useCreateProject()

    const handleCreate = async (data: any) => {
        try {
            await createProject.mutateAsync(data)
            toast.success(t('createDialog.success'))
            setIsCreateOpen(false)
        } catch (error) {
            toast.error(t('createDialog.error'))
            console.error(error)
        }
    }

    // Client-side filtering is no longer needed if backend handles search
    const filteredProjects = projects

    return (
        <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 flex-none">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                {showFinancials && (
                    <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('newProject')}
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="p-3 sm:p-4 flex-none">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <Button variant="secondary" className="w-full sm:w-auto">
                        <Filter className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{t('filters.title')}</span>
                        <span className="sm:hidden">{t('filters.title')}</span>
                    </Button>
                </div>
            </Card>

            {/* Projects Table */}
            <Card className="flex-1 overflow-hidden border-0 shadow-sm bg-transparent">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader size="lg" text={t('loading')} />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    // ... (Empty state remains same)
                    <div className="flex flex-col items-center justify-center h-64 text-center bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('empty.title')}</p>
                        <p className="text-sm text-gray-400">{t('empty.description')}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-auto h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('table.project')}</th>
                                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('table.client')}</th>
                                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('table.phase')}</th>
                                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('table.status')}</th>
                                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('table.dates')}</th>
                                        {showFinancials && (
                                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('table.amount')}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredProjects.map((project: Project) => (
                                        <tr
                                            key={project.id}
                                            onClick={() => setSelectedProjectId(project.id)}
                                            className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors duration-200"
                                        >
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm lg:text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                                                        {project.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                                        {project.description || t('noDescription')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                {project.client ? (
                                                    <div className="flex items-center gap-2 lg:gap-3">
                                                        <Avatar className="h-7 w-7 lg:h-8 lg:w-8 border border-gray-100 dark:border-gray-700">
                                                            <AvatarImage src={project.client.avatarUrl} />
                                                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                                                {project.client.nombre.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                {project.client.nombre}
                                                            </span>
                                                            <span className="text-xs text-gray-500 truncate">
                                                                {project.client.contacto || t('noContact')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs lg:text-sm text-gray-400 italic">{t('noClient')}</span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                {project.phase ? (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 text-xs">
                                                        {project.phase.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400 text-xs lg:text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <Badge variant={project.status === 'ACTIVE' ? 'success' : 'secondary'} className="shadow-sm text-xs">
                                                    {project.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <div className="flex flex-col text-xs lg:text-sm">
                                                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                                        <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400" />
                                                        <span>{formatDate(project.startDate)}</span>
                                                    </div>
                                                    {project.endDate && (
                                                        <span className="text-xs text-gray-500 ml-4 lg:ml-5.5">
                                                            to {formatDate(project.endDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {showFinancials && (
                                                <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                                                    <span className="font-medium text-xs lg:text-sm text-gray-900 dark:text-gray-100">
                                                        {project.amountWithTax
                                                            ? `$${Number(project.amountWithTax).toLocaleString()}`
                                                            : '-'}
                                                    </span>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {filteredProjects.map((project: Project) => (
                                <Card
                                    key={project.id}
                                    onClick={() => setSelectedProjectId(project.id)}
                                    className="p-4 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                                                    {project.name}
                                                </h3>
                                                {project.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                                        {project.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={project.status === 'ACTIVE' ? 'success' : 'secondary'} className="shrink-0 text-xs">
                                                {project.status}
                                            </Badge>
                                        </div>

                                        {project.client && (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8 border border-gray-100 dark:border-gray-700">
                                                    <AvatarImage src={project.client.avatarUrl} />
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                                        {project.client.nombre.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {project.client.nombre}
                                                    </p>
                                                    {project.client.contacto && (
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {project.client.contacto}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                            {project.phase && (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                                                    {project.phase.name}
                                                </Badge>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(project.startDate)}</span>
                                            </div>
                                            {showFinancials && project.amountWithTax && (
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    ${Number(project.amountWithTax).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            {/* Pagination */}
            {meta && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                        Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, meta.total)}</span> of <span className="font-medium">{meta.total}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="text-xs sm:text-sm"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= (meta.totalPages || Math.ceil(meta.total / limit))}
                            className="text-xs sm:text-sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">{t('createDialog.title')}</DialogTitle>
                    </DialogHeader>
                    <ProjectForm
                        onSubmit={handleCreate}
                        isLoading={createProject.isPending}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Details Sheet */}
            <Sheet open={!!selectedProjectId} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
                <SheetContent
                    side="right"
                    className="w-[95vw] sm:w-[540px] md:w-[700px] p-0 border-l border-gray-200 dark:border-gray-800 overflow-y-auto"
                >
                    <SheetTitle className="sr-only">Project Details</SheetTitle>
                    {selectedProjectId && (
                        <ProjectDetailsPanel
                            projectId={selectedProjectId}
                            onClose={() => setSelectedProjectId(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
