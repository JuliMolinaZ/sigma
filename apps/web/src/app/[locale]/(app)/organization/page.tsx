'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Building2, Users, Calendar } from 'lucide-react'
import { Organization } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Loader from '@/components/ui/loader'

export default function OrganizationPage() {
    const [org, setOrg] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrganization = async () => {
            try {
                const response = await api.get<{ success: boolean, data: Organization }>('/organization')
                setOrg(response.data.data)
            } catch (error: any) {
                // Only log errors that aren't 404 (endpoint not implemented yet)
                if (error?.response?.status !== 404) {
                    console.error('Failed to fetch organization:', error)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchOrganization()
    }, [])

    if (loading) {
        return <Loader size="lg" text="Loading organization..." />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organization</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your organization settings</p>
                </div>
                <Button>Edit Organization</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                    <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organization Name</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {org?.name || 'N/A'}
                    </p>
                </Card>

                <Card className="p-6">
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Team Members</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        12
                    </p>
                </Card>

                <Card className="p-6">
                    <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {org?.createdAt ? formatDate(org.createdAt) : 'N/A'}
                    </p>
                </Card>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Organization Details</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            defaultValue={org?.name}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Slug
                        </label>
                        <input
                            type="text"
                            defaultValue={org?.slug}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary">Cancel</Button>
                        <Button>Save Changes</Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
