"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardChartsProps {
    revenueData?: Array<{ name: string; total: number }>;
    recentActivity?: Array<{
        id: string;
        action: string;
        resource: string;
        metadata?: any;
        createdAt: string;
        user?: {
            firstName: string;
            lastName: string;
        };
    }>;
}

export function DashboardCharts({ revenueData, recentActivity }: DashboardChartsProps) {
    // Default data if none provided
    const defaultData = [
        { name: "Ene", total: 0 },
        { name: "Feb", total: 0 },
        { name: "Mar", total: 0 },
        { name: "Abr", total: 0 },
        { name: "May", total: 0 },
        { name: "Jun", total: 0 },
    ];

    const chartData = revenueData && revenueData.length > 0 ? revenueData : defaultData;

    const getActivityIcon = (action: string) => {
        if (action.includes('create')) return '➕';
        if (action.includes('update')) return '✏️';
        if (action.includes('delete')) return '🗑️';
        if (action.includes('payment')) return '💰';
        return '📝';
    };

    const getActivityDescription = (activity: any) => {
        const { action, resource, metadata, user } = activity;
        const userName = user ? `${user.firstName} ${user.lastName}` : 'Usuario';

        if (resource === 'finance' && action.includes('payment')) {
            return `${userName} registró un pago`;
        }
        if (resource === 'clients' && action.includes('create')) {
            return `${userName} creó un nuevo cliente`;
        }
        if (resource === 'projects' && action.includes('create')) {
            return `${userName} creó un nuevo proyecto`;
        }
        if (resource === 'tasks' && action.includes('update')) {
            return `${userName} actualizó una tarea`;
        }

        return `${userName} ${action} en ${resource}`;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Resumen de Ingresos</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.slice(0, 5).map((activity) => (
                                <div key={activity.id} className="flex items-start">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {getActivityIcon(activity.action)} {activity.action}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {getActivityDescription(activity)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay actividad reciente
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
