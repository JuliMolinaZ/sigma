'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Users,
    FolderKanban,
    ArrowRight
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { usePurchaseOrders, useAccountsPayable, useAccountsReceivable } from "@/hooks/useFinance"
import api from '@/lib/api'
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function QuickActions() {
    const { data: purchaseOrders } = usePurchaseOrders()
    const { data: accountsPayable } = useAccountsPayable()
    const { data: accountsReceivable } = useAccountsReceivable()
    const [tasks, setTasks] = useState<any[]>([])

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks')
                const tasksList = Array.isArray(res.data) ? res.data :
                    Array.isArray(res.data?.data) ? res.data.data : []
                setTasks(tasksList)
            } catch (error) {
                console.error('Failed to fetch tasks:', error)
            }
        }
        fetchTasks()
    }, [])

    // Calculate pending items
    const pendingPOs = purchaseOrders?.filter((po: any) => po.status === 'PENDING') || []
    const pendingAP = accountsPayable?.filter((ap: any) => ap.status === 'PENDING') || []
    const pendingAR = accountsReceivable?.filter((ar: any) => ar.status === 'PENDING') || []
    const pendingTasks = tasks.filter((task: any) => task.status !== 'DONE') || []

    const quickActions = [
        {
            title: "Órdenes de Compra",
            description: "Pendientes de aprobación",
            count: pendingPOs.length,
            icon: FileText,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-950",
            href: "/finance/purchase-orders",
            items: pendingPOs.slice(0, 3)
        },
        {
            title: "Cuentas por Pagar",
            description: "Pagos pendientes",
            count: pendingAP.length,
            icon: DollarSign,
            color: "text-red-600 dark:text-red-400",
            bgColor: "bg-red-50 dark:bg-red-950",
            href: "/finance/ap",
            items: pendingAP.slice(0, 3)
        },
        {
            title: "Cuentas por Cobrar",
            description: "Cobros pendientes",
            count: pendingAR.length,
            icon: TrendingUp,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-50 dark:bg-green-950",
            href: "/finance/ar",
            items: pendingAR.slice(0, 3)
        },
        {
            title: "Tareas Pendientes",
            description: "Por realizar o aprobar",
            count: pendingTasks.length,
            icon: CheckCircle2,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-50 dark:bg-purple-950",
            href: "/tasks",
            items: pendingTasks.slice(0, 3)
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
                const Icon = action.icon
                return (
                    <Card key={action.title} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                                    <Icon className={`w-5 h-5 ${action.color}`} />
                                </div>
                                <Badge variant={action.count > 0 ? "destructive" : "secondary"}>
                                    {action.count}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg">{action.title}</CardTitle>
                            <CardDescription>{action.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {action.items.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                    {action.items.map((item: any, idx: number) => (
                                        <div key={idx} className="text-sm p-2 bg-muted rounded-md">
                                            <p className="font-medium truncate">
                                                {item.folio || item.concepto || item.title || `Item ${idx + 1}`}
                                            </p>
                                            {item.monto && (
                                                <p className="text-xs text-muted-foreground">
                                                    ${parseFloat(item.monto).toLocaleString('es-MX')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-3">
                                    No hay elementos pendientes
                                </p>
                            )}
                            <Link href={action.href}>
                                <Button variant="ghost" size="sm" className="w-full group">
                                    Ver todos
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
