'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Project } from '@/types'
import api from '@/lib/api'
import Loader from '../ui/loader'
import { STATUS_COLORS } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function ProjectsWidget() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get<any>('/projects?limit=5&status=ACTIVE')
                const projectsData = response.data.data || response.data || []
                setProjects(Array.isArray(projectsData) ? projectsData : [])
            } catch (error) {
                console.error('Failed to fetch projects:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProjects()
    }, [])

    if (loading) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Active Projects
                </h3>
                <Loader size="md" />
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Active Projects
                </h3>
                <Link
                    href="/projects"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                    View all
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-3">
                {projects.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        No active projects
                    </p>
                ) : (
                    projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {project.name}
                                </h4>
                                <Badge variant="success" size="sm">
                                    {project.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {project.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={project.owner?.avatarUrl || undefined} alt={project.owner?.firstName} />
                                        <AvatarFallback className="text-[10px]">{getInitials(project.owner?.firstName || '', project.owner?.lastName || '')}</AvatarFallback>
                                    </Avatar>
                                    <span>{project.owner?.firstName} {project.owner?.lastName}</span>
                                </div>
                                <span>{project._count?.tasks || 0} tasks</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </Card>
    )
}
