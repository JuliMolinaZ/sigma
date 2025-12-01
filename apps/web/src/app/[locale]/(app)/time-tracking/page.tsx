'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Play, Square, Plus } from 'lucide-react'
import { TimeEntry } from '@/types'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'

import { useAuthStore } from '@/store/auth.store'
import AccessDenied from '@/components/ui/access-denied'
import { checkModuleAccess } from '@/lib/constants'

export default function TimeTrackingPage() {
    const { user } = useAuthStore()
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [isTracking, setIsTracking] = useState(false)

    if (!checkModuleAccess('time-tracking', user)) {
        return <AccessDenied />
    }

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const response = await api.get<any>('/time-entries?limit=10')
                const entriesData = response.data.data || response.data || []
                setEntries(Array.isArray(entriesData) ? entriesData : [])
            } catch (error: any) {
                // Only log errors that aren't 404 (endpoint not implemented yet)
                if (error?.response?.status !== 404) {
                    console.error('Failed to fetch time entries:', error)
                }
                setEntries([])
            } finally {
                setLoading(false)
            }
        }

        fetchEntries()
    }, [])

    const todayEntries = entries.filter(e =>
        new Date(e.date).toDateString() === new Date().toDateString()
    )

    const todayHours = todayEntries.reduce((sum, e) => sum + e.hours, 0)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Time Tracking</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Track your time entries</p>
            </div>

            {/* Timer Card */}
            <Card className="p-6">
                <div className="text-center">
                    <h2 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                        00:00:00
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        {!isTracking ? (
                            <Button
                                size="lg"
                                className="w-full sm:w-auto"
                                onClick={() => setIsTracking(true)}
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Start Timer
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                variant="destructive"
                                onClick={() => setIsTracking(false)}
                            >
                                <Square className="w-5 h-5 mr-2" />
                                Stop Timer
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Today's Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today's Hours</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                        {todayHours.toFixed(1)}h
                    </p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Entries Today</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                        {todayEntries.length}
                    </p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                        {(todayHours * 5).toFixed(1)}h
                    </p>
                </Card>
            </div>

            {/* Recent Entries */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Recent Entries
                    </h3>
                    <Button variant="secondary" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                    </Button>
                </div>

                <div className="space-y-3">
                    {entries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {entry.description}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {entry.project?.name || 'No project'} • {formatDate(entry.date)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {entry.hours}h
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
