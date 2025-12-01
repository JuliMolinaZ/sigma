'use client'

import React, { useState, useEffect } from 'react'
import { Task, Project, User } from '@/types'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { TaskForm } from './TaskForm'
import { TaskDetailsPanel } from './TaskDetailsPanel'

interface TaskSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task?: Task | null
    projects: Project[]
    users: User[]
    onEdit: (task: Task) => void
    onSubmit: (data: any) => Promise<void>
    onDelete: (taskId: string) => Promise<void>
    onStatusChange?: (taskId: string, status: string) => Promise<void>
    isSubmitting?: boolean
    userRole?: string
}

export default function TaskSheet({
    open,
    onOpenChange,
    task,
    projects,
    users,
    onEdit,
    onSubmit,
    onDelete,
    onStatusChange,
    isSubmitting = false,
    userRole,
}: TaskSheetProps) {
    const handleEdit = () => {
        if (task) {
            onEdit(task)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] p-0 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800">
                {task && (
                    <>
                        <SheetHeader className="sr-only">
                            <SheetTitle>Task Details</SheetTitle>
                            <SheetDescription>View task details</SheetDescription>
                        </SheetHeader>
                        <TaskDetailsPanel
                            task={task}
                            onClose={() => onOpenChange(false)}
                            onEdit={handleEdit}
                            onDelete={() => onDelete(task.id)}
                            onStatusChange={onStatusChange ? (status) => onStatusChange(task.id, status) : undefined}
                        />
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

