'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Loader from '@/components/ui/loader'
import { Role } from '@/types'
import api from '@/lib/api'

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await api.get<{ success: boolean, data: Role[] }>('/roles')
                setRoles(response.data.data || [])
            } catch (error) {
                console.error('Failed to fetch roles:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchRoles()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Roles & Permissions</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage roles and access control</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Role
                </Button>
            </div>

            {loading ? (
                <Loader size="lg" text="Loading roles..." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <Card key={role.id} className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{role.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{role.description}</p>
                                </div>
                                {role.isSystem && <Badge variant="secondary" className="ml-2">System</Badge>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Users</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{role._count?.users || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Permissions</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{role.permissions?.length || 0}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Badge variant="secondary">Edit Role</Badge>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
