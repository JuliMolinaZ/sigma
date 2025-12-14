'use client'

import React from 'react'
import { Task } from '@/types'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Badge from '@/components/ui/badge'
import PriorityIndicator from '@/components/shared/PriorityIndicator'
import { formatDate } from '@/lib/utils'
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import Button from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TaskTableProps {
    tasks: Task[]
    onTaskClick: (task: Task) => void
    onDelete: (taskId: string) => void
}

export function TaskTable({ tasks, onTaskClick, onDelete }: TaskTableProps) {
    return (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                No tasks found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        tasks.map((task) => (
                            <TableRow key={task.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <TableCell className="font-medium">
                                    <div
                                        className="cursor-pointer hover:text-primary hover:underline truncate max-w-[300px]"
                                        onClick={() => onTaskClick(task)}
                                    >
                                        {task.title}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="uppercase text-[10px] font-bold tracking-wider">
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <PriorityIndicator priority={task.priority} size="sm" />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {task.assignee ? (
                                            <>
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                                    {task.assignee.firstName} {task.assignee.lastName}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                        {task.project?.name || '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {task.dueDate ? formatDate(task.dueDate) : '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onTaskClick(task)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(task.id)}
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
