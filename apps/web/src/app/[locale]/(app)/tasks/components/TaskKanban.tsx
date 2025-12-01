'use client'

import React, { useState, useMemo } from 'react'
import { Task } from '@/types'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import { ChevronDown, ChevronRight, Briefcase } from 'lucide-react'
import Button from '@/components/ui/button'

interface TaskKanbanProps {
    tasks: Task[]
    onTaskClick: (task: Task) => void
    onStatusChange: (taskId: string, newStatus: string) => void
}

const COLUMNS = [
    { id: 'BACKLOG', title: 'Backlog', color: 'border-gray-200 dark:border-gray-800' },
    { id: 'TODO', title: 'To Do', color: 'border-blue-200 dark:border-blue-900' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-yellow-200 dark:border-yellow-900' },
    { id: 'REVIEW', title: 'Review', color: 'border-purple-200 dark:border-purple-900' },
    { id: 'DONE', title: 'Done', color: 'border-green-200 dark:border-green-900' },
]

export default function TaskKanban({ tasks, onTaskClick, onStatusChange }: TaskKanbanProps) {
    const [draggedTask, setDraggedTask] = useState<string | null>(null)
    const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({})

    // Group tasks by Project
    const projectGroups = useMemo(() => {
        const groups: Record<string, { name: string, tasks: Task[] }> = {}

        tasks.forEach(task => {
            const projectId = task.projectId
            const projectName = task.project?.name || 'Unknown Project'

            if (!groups[projectId]) {
                groups[projectId] = { name: projectName, tasks: [] }
            }
            groups[projectId].tasks.push(task)
        })

        return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name))
    }, [tasks])

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId)
        setDraggedTask(taskId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault()
        const taskId = e.dataTransfer.getData('taskId')
        if (taskId) {
            onStatusChange(taskId, status)
        }
        setDraggedTask(null)
    }

    const toggleProject = (projectId: string) => {
        setCollapsedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }))
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-950">
            {/* Header Columns - Grid Layout */}
            <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr] border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                <div className="p-3 font-medium text-sm text-gray-500 border-r border-gray-200 dark:border-gray-800">
                    Projects
                </div>
                {COLUMNS.map(col => (
                    <div key={col.id} className="p-3 font-medium text-sm text-gray-700 dark:text-gray-300 text-center border-r border-gray-200 dark:border-gray-800 last:border-r-0">
                        {col.title}
                    </div>
                ))}
            </div>

            {/* Swimlanes */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {projectGroups.map(([projectId, { name, tasks }]) => {
                    const isCollapsed = collapsedProjects[projectId]

                    return (
                        <div key={projectId} className="border-b border-gray-200 dark:border-gray-800">
                            {/* Project Row - Grid Layout */}
                            <div className="grid grid-cols-[250px_1fr_1fr_1fr_1fr_1fr]">
                                {/* Project Name Column */}
                                <div className="p-3 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky left-0 z-10">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => toggleProject(projectId)}
                                        >
                                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                        <div className="font-semibold text-sm truncate" title={name}>
                                            {name}
                                        </div>
                                    </div>
                                    <div className="pl-8 mt-1 text-xs text-gray-500">
                                        {tasks.length} tasks
                                    </div>
                                </div>

                                {/* Status Columns */}
                                {!isCollapsed ? COLUMNS.map(col => {
                                    const colTasks = tasks.filter(t => t.status === col.id)

                                    return (
                                        <div
                                            key={col.id}
                                            className={cn(
                                                "p-2 border-r border-gray-200 dark:border-gray-800 last:border-r-0 bg-gray-50/30 dark:bg-gray-900/10 min-h-[150px]",
                                                col.color
                                            )}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                        >
                                            <div className="space-y-2">
                                                {colTasks.map(task => (
                                                    <TaskCard
                                                        key={task.id}
                                                        task={task}
                                                        onClick={onTaskClick}
                                                        onDragStart={task.status === 'DONE' ? undefined : handleDragStart}
                                                        onDragEnd={() => setDraggedTask(null)}
                                                        isDragging={draggedTask === task.id}
                                                        className={task.status === 'DONE' ? 'opacity-60 cursor-default' : ''}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="col-span-5 p-4 text-sm text-gray-400 italic flex items-center">
                                        Collapsed - {tasks.length} tasks hidden
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {projectGroups.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No projects or tasks found.
                    </div>
                )}
            </div>
        </div>
    )
}
