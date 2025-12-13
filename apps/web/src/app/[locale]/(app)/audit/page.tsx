'use client'

import { useEffect, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Loader from '@/components/ui/loader'
import { AuditLog } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get<{ success: boolean, data: AuditLog[] }>('/audit')
                setLogs(response.data.data || [])
            } catch (error) {
                // Only log errors that aren't 404 (endpoint not implemented yet)
                const status = (error as { response?: { status?: number } })?.response?.status
                if (status !== 404) {
                    console.error('Failed to fetch audit logs:', error)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Track all system activities</p>
                </div>
                <Button variant="secondary">Export Logs</Button>
            </div>

            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <Button variant="secondary">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>
            </Card>

            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-12">
                        <Loader size="lg" text="Loading audit logs..." />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resource</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                            {log.user?.firstName} {log.user?.lastName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                log.action === 'CREATE' ? 'success' :
                                                    log.action === 'DELETE' ? 'destructive' :
                                                        log.action === 'UPDATE' ? 'secondary' :
                                                            'secondary'
                                            } size="sm">{log.action}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.resource}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(log.createdAt, 'long')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}
