'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAllModulesStatus, useBatchUpdateModules, useInitializeDefaultModules } from '@/hooks/useOrganizationModules'
import { MODULES } from '@/lib/constants'
import { Loader2, Save, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'

export default function ModulesManagementPage() {
    const t = useTranslations('modules')
    const tNav = useTranslations('navigation')
    const { user } = useAuthStore()
    const { data: modulesStatus, isLoading, refetch } = useAllModulesStatus()
    const batchUpdateMutation = useBatchUpdateModules()
    const initializeMutation = useInitializeDefaultModules()
    const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({})
    const [hasChanges, setHasChanges] = useState(false)

    // Check if user is Super Admin
    const isSuperAdmin = useMemo(() => {
        if (!user) return false
        const roleName = typeof user.role === 'object' ? (user.role as any).name : user.role
        return roleName?.includes('Super') || roleName === 'Superadmin'
    }, [user])

    // Initialize selected modules from API data
    useEffect(() => {
        if (modulesStatus) {
            const statusMap: Record<string, boolean> = {}
            modulesStatus.forEach((module) => {
                statusMap[module.moduleId] = module.isEnabled
            })
            setSelectedModules(statusMap)
            setHasChanges(false)
        }
    }, [modulesStatus])

    // Handle module toggle
    const toggleModule = (moduleId: string) => {
        setSelectedModules((prev) => {
            const newState = {
                ...prev,
                [moduleId]: !prev[moduleId],
            }
            setHasChanges(true)
            return newState
        })
    }

    // Handle save changes
    const handleSave = async () => {
        const updates = Object.entries(selectedModules).map(([moduleId, isEnabled]) => ({
            moduleId,
            isEnabled,
        }))

        try {
            await batchUpdateMutation.mutateAsync(updates)
            toast.success(t('updateSuccess', { defaultValue: 'Módulos actualizados correctamente' }))
            setHasChanges(false)
            refetch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('updateError', { defaultValue: 'Error al actualizar módulos' }))
        }
    }

    // Handle initialize all modules
    const handleInitialize = async () => {
        const allModuleIds = MODULES.map((m) => m.id)

        try {
            await initializeMutation.mutateAsync(allModuleIds)
            toast.success(t('initializeSuccess', { defaultValue: 'Módulos inicializados correctamente' }))
            refetch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('initializeError', { defaultValue: 'Error al inicializar módulos' }))
        }
    }

    // Group modules by category
    const modulesByCategory = useMemo(() => {
        return {
            core: MODULES.filter((m) => m.category === 'core'),
            finance: MODULES.filter((m) => m.category === 'finance'),
            admin: MODULES.filter((m) => m.category === 'admin'),
            tools: MODULES.filter((m) => m.category === 'tools'),
        }
    }, [])

    const categoryTitles = {
        core: tNav('categories.core'),
        finance: tNav('categories.finance'),
        admin: tNav('categories.admin'),
        tools: tNav('categories.tools'),
    }

    if (!isSuperAdmin) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Acceso Denegado</CardTitle>
                        <CardDescription>
                            Solo los SUPERADMINISTRADORES pueden acceder a esta página.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('title')}</h1>
                    <p className="text-gray-500 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {modulesStatus && modulesStatus.length === 0 && (
                        <Button
                            onClick={handleInitialize}
                            variant="outline"
                            disabled={initializeMutation.isPending}
                        >
                            {initializeMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Inicializando...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Inicializar Todos
                                </>
                            )}
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || batchUpdateMutation.isPending}
                    >
                        {batchUpdateMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {modulesStatus && modulesStatus.length === 0 && (
                <Card className="mb-6 border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-800">Módulos No Inicializados</CardTitle>
                        <CardDescription className="text-yellow-700">
                            No hay módulos configurados aún. Haz clic en "Inicializar Todos" para
                            habilitar todos los módulos por defecto.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(modulesByCategory).map(([category, modules]) => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle>{categoryTitles[category as keyof typeof categoryTitles]}</CardTitle>
                            <CardDescription>
                                Selecciona los módulos que quieres mostrar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {modules.map((module) => {
                                    const Icon = module.icon
                                    const isEnabled = selectedModules[module.id] ?? false

                                    return (
                                        <div
                                            key={module.id}
                                            className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                                        >
                                            <Checkbox
                                                id={module.id}
                                                checked={isEnabled}
                                                onCheckedChange={() => toggleModule(module.id)}
                                                className="mt-1"
                                            />
                                            <label
                                                htmlFor={module.id}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium text-sm">
                                                        {module.name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {module.description}
                                                </p>
                                            </label>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {hasChanges && (
                <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                    Tienes cambios sin guardar
                </div>
            )}
        </div>
    )
}
