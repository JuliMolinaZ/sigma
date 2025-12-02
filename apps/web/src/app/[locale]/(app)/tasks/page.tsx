'use client'

import { useEffect, useState } from 'react'
import { Plus, Filter, RefreshCw, Search, X, LayoutGrid, LayoutList, Radio } from 'lucide-react'
import Button from '@/components/ui/button'
import Loader from '@/components/ui/loader'
import { Task, Project, User, TaskDashboardStats } from '@/types'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import TaskDashboard from './components/TaskDashboard'
import TaskKanban from './components/TaskKanban'
import { TaskTable } from './components/TaskTable'
import TaskSheet from './components/TaskSheet'
import { TaskForm } from './components/TaskForm'
import { CommentDialog } from './components/CommentDialog'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import AccessDenied from '@/components/ui/access-denied'
import { checkModuleAccess } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import Badge from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

export default function TasksPage() {
    const { user } = useAuthStore()
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<TaskDashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [commentDialogOpen, setCommentDialogOpen] = useState(false)
    const [pendingStatusChange, setPendingStatusChange] = useState<{ taskId: string, newStatus: string } | null>(null)
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

    // Filters
    const [filterProject, setFilterProject] = useState<string>('all')
    const [filterAssignee, setFilterAssignee] = useState<string>('all')
    const [filterPriority, setFilterPriority] = useState<string>('all')
    const [filterSource, setFilterSource] = useState<string>('all') // 'all', 'dispatch', 'regular'
    const [searchQuery, setSearchQuery] = useState('')

    const role = user?.role
    const userRole = (typeof role === 'string' ? role : (role as any)?.name) || ''
    const isAdmin = ['SUPERADMIN', 'CEO', 'GERENTE OPERACIONES', 'PROJECT MANAGER', 'SUPERVISOR'].includes(userRole.toUpperCase())

    if (!checkModuleAccess('tasks', user)) {
        return <AccessDenied />
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const [tasksRes, projectsRes, usersRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/projects'),
                api.get('/users'),
            ])

            // Helper to extract data array handling global interceptor nesting
            const extractList = (res: any) => {
                const body = res.data
                if (Array.isArray(body)) return body
                if (Array.isArray(body.data)) return body.data
                if (body.data && Array.isArray(body.data.data)) return body.data.data
                return []
            }

            const tasksList = extractList(tasksRes)
            setTasks(tasksList)

            const projectsList = extractList(projectsRes)
            setProjects(projectsList)

            const usersList = extractList(usersRes)
            setUsers(usersList)

            if (isAdmin) {
                const statsRes = await api.get('/tasks/stats/dashboard')
                setStats(statsRes.data)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.error('Failed to load tasks data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [isAdmin])

    const handleCreateTask = () => {
        setEditingTask(null)
        setIsDialogOpen(true)
    }

    const handleEditTask = (task: Task) => {
        setEditingTask(task)
        setIsDialogOpen(true)
    }

    const handleViewTask = (task: Task) => {
        setSelectedTask(task)
        setIsSheetOpen(true)
    }

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        // Workflow: If moving to REVIEW, require comment
        if (newStatus === 'REVIEW') {
            setPendingStatusChange({ taskId, newStatus })
            setCommentDialogOpen(true)
            return
        }

        await updateTaskStatus(taskId, newStatus)
    }

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
            )

            await api.patch(`/tasks/${taskId}`, { status: newStatus })
            toast.success('Task status updated')

            if (isAdmin) {
                const statsRes = await api.get('/tasks/stats/dashboard')
                setStats(statsRes.data)
            }
        } catch (error: any) {
            console.error('Failed to update status:', error)

            // Handle 403 errors gracefully
            if (error.response?.status === 403) {
                toast.error(error.response?.data?.message || 'You do not have permission to perform this action')
            } else {
                toast.error(error.response?.data?.message || 'Failed to update task status')
            }

            // Revert UI state
            fetchData()
        }
    }

    const handleCommentSubmit = async (comment: string) => {
        if (!pendingStatusChange) return

        try {
            setIsSubmitting(true)
            // 1. Add comment
            await api.post(`/tasks/${pendingStatusChange.taskId}/comments`, { content: comment })

            // 2. Update status
            await updateTaskStatus(pendingStatusChange.taskId, pendingStatusChange.newStatus)

            setCommentDialogOpen(false)
            setPendingStatusChange(null)
        } catch (error: any) {
            console.error('Failed to submit comment:', error)
            toast.error('Failed to submit comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            if (editingTask) {
                await api.patch(`/tasks/${editingTask.id}`, data)
                toast.success('Task updated successfully')
            } else {
                await api.post('/tasks', data)
                toast.success('Task created successfully')
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (error: any) {
            console.error('Failed to save task:', error)
            toast.error(error.response?.data?.message || 'Failed to save task')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Filter tasks
    const filteredTasks = Array.isArray(tasks)
        ? tasks.filter((task) => {
            if (filterProject !== 'all' && task.projectId !== filterProject) return false
            if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false
            if (filterPriority !== 'all' && task.priority !== filterPriority) return false
            if (filterSource === 'dispatch' && !(task as any).sourceDispatchId) return false
            if (filterSource === 'regular' && (task as any).sourceDispatchId) return false
            if (
                searchQuery &&
                !task.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
                return false
            return true
        })
        : []

    const activeFiltersCount = [
        filterProject !== 'all',
        filterAssignee !== 'all',
        filterPriority !== 'all',
        filterSource !== 'all',
        searchQuery !== '',
    ].filter(Boolean).length

    const clearFilters = () => {
        setFilterProject('all')
        setFilterAssignee('all')
        setFilterPriority('all')
        setFilterSource('all')
        setSearchQuery('')
    }

    if (loading && tasks.length === 0) {
        return <Loader size="lg" text="Loading tasks..." />
    }

    const handleDeleteTask = async (taskId: string) => {
        try {
            await api.delete(`/tasks/${taskId}`)
            toast.success('Task deleted successfully')
            setIsSheetOpen(false)
            fetchData()
        } catch (error: any) {
            console.error('Failed to delete task:', error)
            toast.error(error.response?.data?.message || 'Failed to delete task')
        }
    }

    return (
        <div className="h-[calc(100dvh-4rem)] flex flex-col p-6 bg-white dark:bg-gray-950">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                        Tasks
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your team's tasks and sprints efficiently.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800">
                        <Button
                            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('board')}
                            className={cn(
                                "h-8 w-8 p-0",
                                viewMode === 'board' && "bg-white dark:bg-gray-800 shadow-sm"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "h-8 w-8 p-0",
                                viewMode === 'list' && "bg-white dark:bg-gray-800 shadow-sm"
                            )}
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchData}
                        className="h-10 w-10 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                        <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </Button>
                    <Button
                        onClick={handleCreateTask}
                        className="h-10 px-4 bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200 shadow-sm transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Stats Dashboard */}
            {isAdmin && stats && <TaskDashboard stats={stats} />}

            {/* Minimalist Search and Filters */}
            <div className="flex gap-3 mb-6 flex-shrink-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-gray-900 dark:focus:ring-gray-100"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setSearchQuery('')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-[180px] h-10 text-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                        <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {(Array.isArray(projects) ? projects : []).map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim()}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                    <SelectTrigger className="w-[140px] h-9 text-sm">
                        <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                                {u.firstName} {u.lastName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[120px] h-9 text-sm">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger className="w-[160px] h-9 text-sm">
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="dispatch">
                            <div className="flex items-center gap-2">
                                <Radio className="w-3 h-3 text-purple-600" />
                                <span>From Dispatch</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="regular">Regular Tasks</SelectItem>
                    </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-9 px-2"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-950 rounded-xl border-2 shadow-xl overflow-hidden">
                <div className="h-full p-4 overflow-hidden">
                    {viewMode === 'board' ? (
                        <TaskKanban
                            tasks={filteredTasks}
                            onTaskClick={handleViewTask}
                            onStatusChange={handleStatusChange}
                        />
                    ) : (
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            <TaskTable
                                tasks={filteredTasks}
                                onTaskClick={handleViewTask}
                                onDelete={handleDeleteTask}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Task Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
                    </DialogHeader>
                    <TaskForm
                        initialData={editingTask}
                        projects={projects}
                        users={users}
                        onSubmit={handleSubmit}
                        onCancel={() => setIsDialogOpen(false)}
                        isSubmitting={isSubmitting}
                        userRole={userRole}
                    />
                </DialogContent>
            </Dialog>

            {/* Task Details Sheet */}
            <TaskSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                task={selectedTask}
                projects={projects}
                users={users}
                onEdit={(task) => {
                    setIsSheetOpen(false)
                    handleEditTask(task)
                }}
                onSubmit={handleSubmit}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                isSubmitting={isSubmitting}
                userRole={userRole}
            />

            <CommentDialog
                open={commentDialogOpen}
                onOpenChange={setCommentDialogOpen}
                onSubmit={handleCommentSubmit}
                title="Submit for Review"
                description="Please add a comment explaining your work before moving this task to review."
                isSubmitting={isSubmitting}
            />
        </div>
    )
}
