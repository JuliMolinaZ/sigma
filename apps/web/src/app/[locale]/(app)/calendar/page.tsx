'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function CalendarPage() {
    const [currentDate] = useState(new Date())
    const t = useTranslations('calendar')

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

    const events = [
        { id: '1', title: 'Team Meeting', time: '10:00 AM', date: '2025-11-24', color: 'blue' },
        { id: '2', title: 'Project Deadline', time: '5:00 PM', date: '2025-11-25', color: 'red' },
        { id: '3', title: 'Client Call', time: '2:00 PM', date: '2025-11-26', color: 'green' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('newEvent', { defaultValue: 'New Event' })}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-2 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{monthName}</h2>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }, (_, i) => {
                            const day = i - 2 // Adjust for month start
                            const isCurrentMonth = day > 0 && day <= 30
                            const isToday = day === currentDate.getDate()

                            return (
                                <button
                                    key={i}
                                    className={`aspect-square p-2 rounded-lg text-sm transition-colors ${!isCurrentMonth
                                        ? 'text-gray-400 dark:text-gray-600'
                                        : isToday
                                            ? 'bg-blue-600 text-white font-semibold'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                                        }`}
                                >
                                    {isCurrentMonth ? day : ''}
                                </button>
                            )
                        })}
                    </div>
                </Card>

                {/* Upcoming Events */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Events</h2>
                    <div className="space-y-3">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className={`p-3 rounded-lg border-l-4 bg-${event.color}-50 dark:bg-${event.color}-900/20 border-${event.color}-500`}
                            >
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{event.title}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{event.time}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{event.date}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="text-center py-12 p-6">
                <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Calendar Integration
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Connect your calendar to sync events, meetings, and deadlines across your organization.
                </p>
            </Card>
        </div>
    )
}
