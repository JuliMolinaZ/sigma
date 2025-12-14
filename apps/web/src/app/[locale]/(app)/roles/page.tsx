'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Shield, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Loader from '@/components/ui/loader'
import {
    useRoles,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    type Role,
    type CreateRoleDto,
    type UpdateRoleDto,
} from '@/hooks/useRoles'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { RolePermissionsDialog } from '@/components/roles/RolePermissionsDialog'

const roleSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    isSystem: z.boolean(),
    level: z.number().min(1).max(100),
    category: z.string().optional(),
})

type RoleFormData = z.infer<typeof roleSchema>

export default function RolesPage() {
    const { data: roles = [], isLoading } = useRoles()
    const createRole = useCreateRole()
    const updateRole = useUpdateRole()
    const deleteRole = useDeleteRole()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreateMode, setIsCreateMode] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
    const [roleForPermissions, setRoleForPermissions] = useState<Role | null>(null)

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            name: '',
            description: '',
            isSystem: false,
            level: 1,
            category: '',
        },
    })

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreate = () => {
        setSelectedRole(null)
        setIsCreateMode(true)
        reset({
            name: '',
            description: '',
            isSystem: false,
            level: 1,
            category: '',
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (role: Role) => {
        setSelectedRole(role)
        setIsCreateMode(false)
        reset({
            name: role.name,
            description: role.description || '',
            isSystem: role.isSystem,
            level: role.level,
            category: role.category || '',
        })
        setIsDialogOpen(true)
    }

    const handleDelete = (role: Role) => {
        setRoleToDelete(role)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (roleToDelete) {
            deleteRole.mutate(roleToDelete.id, {
                onSuccess: () => {
                    setDeleteDialogOpen(false)
                    setRoleToDelete(null)
                },
            })
        }
    }

    const handleManagePermissions = (role: Role) => {
        setRoleForPermissions(role)
        setPermissionsDialogOpen(true)
    }

    const onSubmit = (data: RoleFormData) => {
        if (isCreateMode) {
            createRole.mutate(data as CreateRoleDto, {
                onSuccess: () => {
                    setIsDialogOpen(false)
                    reset()
                },
            })
        } else if (selectedRole) {
            updateRole.mutate(
                {
                    id: selectedRole.id,
                    data: data as UpdateRoleDto,
                },
                {
                    onSuccess: () => {
                        setIsDialogOpen(false)
                        setSelectedRole(null)
                        reset()
                    },
                }
            )
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader size="lg" text="Cargando roles..." />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Roles y Permisos
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona los roles y permisos del sistema
                    </p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Rol
                </Button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Buscar roles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 text-sm sm:text-base"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredRoles.map((role) => (
                    <Card key={role.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-5 h-5 text-gray-500" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {role.name}
                                    </h3>
                                    {role.isSystem && (
                                        <Badge variant="secondary" className="text-xs">
                                            Sistema
                                        </Badge>
                                    )}
                                </div>
                                {role.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {role.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    Usuarios
                                </span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {role._count?.users || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Permisos
                                </span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {role.permissions?.length || 0}
                                </span>
                            </div>
                            {role.level && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Nivel
                                    </span>
                                    <Badge variant="outline">{role.level}</Badge>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-initial"
                                onClick={() => handleManagePermissions(role)}
                            >
                                <Shield className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Permisos</span>
                                <span className="sm:hidden">Perm.</span>
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(role)}
                                    disabled={role.isSystem}
                                    className="flex-1 sm:flex-initial"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(role)}
                                    disabled={role.isSystem || (role._count?.users || 0) > 0}
                                    className="flex-1 sm:flex-initial"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredRoles.length === 0 && (
                <Card className="p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No se encontraron roles' : 'No hay roles creados'}
                    </p>
                </Card>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isCreateMode ? 'Crear Nuevo Rol' : 'Editar Rol'}
                        </DialogTitle>
                        <DialogDescription>
                            {isCreateMode
                                ? 'Completa los datos para crear un nuevo rol'
                                : 'Modifica los datos del rol'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nombre del Rol *</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="Ej: Gerente de Proyectos"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Descripción del rol..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="level">Nivel (1-100)</Label>
                                <Input
                                    id="level"
                                    type="number"
                                    min={1}
                                    max={100}
                                    {...register('level', { valueAsNumber: true })}
                                />
                                {errors.level && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.level.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="category">Categoría</Label>
                                <Input
                                    id="category"
                                    {...register('category')}
                                    placeholder="Ej: Ejecutivo"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Controller
                                name="isSystem"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="isSystem"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={!isCreateMode && selectedRole?.isSystem}
                                    />
                                )}
                            />
                            <Label htmlFor="isSystem" className="cursor-pointer">
                                Rol del Sistema
                            </Label>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false)
                                    reset()
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                                {isCreateMode ? 'Crear' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El rol "{roleToDelete?.name}" será
                            eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Permissions Dialog */}
            {roleForPermissions && (
                <RolePermissionsDialog
                    open={permissionsDialogOpen}
                    onOpenChange={setPermissionsDialogOpen}
                    role={roleForPermissions}
                />
            )}
        </div>
    )
}
