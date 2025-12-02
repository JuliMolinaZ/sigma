'use client'

import { useEffect, useState } from 'react'
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardLists } from "@/components/dashboard/DashboardLists";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Skeleton } from "@/components/ui/skeleton";
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const t = useTranslations('dashboard')

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const userRole = (typeof user?.role === 'string' ? user.role : (user?.role as any)?.name) || ''
                const isExecutive = ['SUPERADMIN', 'CEO', 'GERENTE OPERACIONES'].includes(userRole.toUpperCase())

                let endpoint = '/analytics/dashboard'

                if (!isExecutive) {
                    // Non-executives (PMs, Devs) should fetch task stats instead of full analytics
                    endpoint = '/tasks/stats/dashboard'
                }

                const response = await api.get(endpoint)
                setData(response.data)
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchStats()
        }
    }, [user])

    if (loading) {
        return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>
    }

    if (!data) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <Heading title={t('title', { name: user?.firstName || 'Usuario' })} description={t('subtitle')} />
                </div>
                <Separator />
                <div className="p-8 text-center text-gray-500">
                    <p>{t('messages.noAccess', { defaultValue: 'No tienes permisos para ver el panel de control global o hubo un error al cargar los datos.' })}</p>
                    <p className="text-sm mt-2">{t('messages.useMenu', { defaultValue: 'Utiliza el menú lateral para acceder a tus módulos asignados.' })}</p>
                </div>
            </div>
        )
    }

    const userRole = (typeof user?.role === 'string' ? user.role : (user?.role as any)?.name) || ''
    const isExecutive = ['SUPERADMIN', 'CEO', 'GERENTE OPERACIONES'].includes(userRole.toUpperCase())
    const isPM = ['PROJECT MANAGER', 'SUPERVISOR'].includes(userRole.toUpperCase())

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Heading title={t('title', { name: user?.firstName || '' })} description={t('subtitle')} />
            </div>
            <Separator />

            <div className="space-y-4">
                {/* Executive View */}
                {isExecutive && (
                    <>
                        <QuickActions />
                        <DashboardCharts revenueData={data.revenueData} recentActivity={data.recentActivity} />
                        <DashboardLists topClients={data.topClients || []} topSuppliers={data.topSuppliers || []} />
                    </>
                )}

                {/* PM View */}
                {isPM && (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="p-6">
                                <h3 className="text-sm font-medium text-gray-500">{t('stats.activeProjects', { defaultValue: 'Mis Proyectos Activos' })}</h3>
                                <p className="text-2xl font-bold mt-2">{data.projects?.active || 0}</p>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-sm font-medium text-gray-500">{t('stats.pendingTasks', { defaultValue: 'Tareas Pendientes' })}</h3>
                                <p className="text-2xl font-bold mt-2">{data.tasks?.total - data.tasks?.completed || 0}</p>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-sm font-medium text-gray-500">{t('stats.activeSprints', { defaultValue: 'Sprints Activos' })}</h3>
                                <p className="text-2xl font-bold mt-2">{data.sprints?.total || 0}</p>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-sm font-medium text-gray-500">{t('stats.efficiency', { defaultValue: 'Eficiencia' })}</h3>
                                <p className="text-2xl font-bold mt-2">{data.tasks?.completionRate || 0}%</p>
                            </Card>
                        </div>
                        <DashboardCharts recentActivity={data.recentActivity} />
                    </>
                )}

                {/* Developer/Personal View */}
                {!isExecutive && !isPM && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="p-6">
                            <h3 className="text-sm font-medium text-gray-500">{t('stats.assignedTasks', { defaultValue: 'Mis Tareas Asignadas' })}</h3>
                            <p className="text-2xl font-bold mt-2">{data.tasks?.total || 0}</p>
                        </Card>
                        <Card className="p-6">
                            <h3 className="text-sm font-medium text-gray-500">{t('stats.completedTasks', { defaultValue: 'Tareas Completadas' })}</h3>
                            <p className="text-2xl font-bold mt-2">{data.tasks?.completed || 0}</p>
                        </Card>
                        <Card className="p-6">
                            <h3 className="text-sm font-medium text-gray-500">{t('stats.hoursToday', { defaultValue: 'Horas Registradas Hoy' })}</h3>
                            <p className="text-2xl font-bold mt-2">--</p>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
