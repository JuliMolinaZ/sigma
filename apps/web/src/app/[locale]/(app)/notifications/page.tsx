'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Bell, Check, Trash2, Settings } from 'lucide-react'
import Button from '@/components/ui/button'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    timestamp: string
    user?: { firstName: string; lastName: string; avatarUrl?: string }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'New task assigned',
            message: 'You have been assigned to "Update Dashboard UI"',
            type: 'info',
            read: false,
            timestamp: '2 minutes ago',
            user: { firstName: 'John', lastName: 'Doe' }
        },
        {
            id: '2',
            title: 'Project completed',
            message: 'Project "Website Redesign" has been marked as completed',
            type: 'success',
            read: false,
            timestamp: '1 hour ago',
        },
        {
            id: '3',
            title: 'Deadline approaching',
            message: 'Task "API Integration" is due in 2 days',
            type: 'warning',
            read: true,
            timestamp: '3 hours ago',
        },
    ])

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id))
    }

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                        <Check className="w-4 h-4 mr-2" />
                        Mark all read
                    </Button>
                    <Button variant="secondary" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {notification.user ? (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={notification.user?.avatarUrl || undefined} alt={notification.user?.firstName} />
                                        <AvatarFallback>{notification.user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {notification.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                {notification.timestamp}
                                            </p>
                                            <Badge variant={
                                                notification.type === 'success' ? 'success' :
                                                    notification.type === 'error' ? 'destructive' :
                                                        notification.type === 'warning' ? 'secondary' :
                                                            'secondary'
                                            }>
                                                {notification.type}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2 md:mt-0">
                                    {!notification.read && (
                                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
