'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Loader from '@/components/ui/loader'
import {
    usePermissions,
    useCreatePermission,
    useUpdatePermission,
    useDeletePermission,
    type Permission,
    type CreatePermissionDto,
    type UpdatePermissionDto,
} from '@/hooks/usePermissions'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

const permissionSchema = z.object({
    resource: z.string().min(1, 'El recurso es requerido'),
    action: z.string().min(1, 'La acción es requerida'),
    description: z.string().optional(),
})

type PermissionFormData = z.infer<typeof permissionSchema>

export default function PermissionsPage() {
    const { data: permissions = [], isLoading } = usePermissions()
    const createPermission = useCreatePermission()
    const updatePermission = useUpdatePermission()
    const deletePermission = useDeletePermission()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreateMode, setIsCreateMode] = useState(true)
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PermissionFormData>({
        resolver: zodResolver(permissionSchema),
        defaultValues: {
            resource: '',
            action: '',
            description: '',
        },
    })

    const filteredPermissions = permissions.filter(
        (permission) =>
            permission.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
            permission.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            permission.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreate = () => {
        setSelectedPermission(null)
        setIsCreateMode(true)
        reset({
            resource: '',
            action: '',
            description: '',
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (permission: Permission) => {
        setSelectedPermission(permission)
        setIsCreateMode(false)
        reset({
            resource: permission.resource,
            action: permission.action,
            description: permission.description || '',
        })
        setIsDialogOpen(true)
    }

    const handleDelete = (permission: Permission) => {
        setPermissionToDelete(permission)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (permissionToDelete) {
            deletePermission.mutate(permissionToDelete.id, {
                onSuccess: () => {
                    setDeleteDialogOpen(false)
                    setPermissionToDelete(null)
                },
            })
        }
    }

    const onSubmit = (data: PermissionFormData) => {
        if (isCreateMode) {
            createPermission.mutate(data as CreatePermissionDto, {
                onSuccess: () => {
                    setIsDialogOpen(false)
                    reset()
                },
            })
        } else if (selectedPermission) {
            updatePermission.mutate(
                {
                    id: selectedPermission.id,
                    data: data as UpdatePermissionDto,
                },
                {
                    onSuccess: () => {
                        setIsDialogOpen(false)
                        setSelectedPermission(null)
                        reset()
                    },
                }
            )
        }
    }

    // Agrupar permisos por recurso
    const permissionsByResource = filteredPermissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
            acc[permission.resource] = []
        }
        acc[permission.resource].push(permission)
        return acc
    }, {} as Record<string, Permission[]>)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader size="lg" text="Cargando permisos..." />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Permisos
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona los permisos del sistema
                    </p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Permiso
                </Button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Buscar permisos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 text-sm sm:text-base"
                    />
                </div>
            </div>

            <Card className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3 p-4">
                    {filteredPermissions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery
                                    ? 'No se encontraron permisos'
                                    : 'No hay permisos creados'}
                            </p>
                        </div>
                    ) : (
                        filteredPermissions.map((permission) => (
                            <Card key={permission.id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                {permission.resource}
                                            </Badge>
                                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                {permission.action}
                                            </span>
                                        </div>
                                        {permission.description && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                {permission.description}
                                            </p>
                                        )}
                                        <Badge variant="secondary" className="text-xs">
                                            {permission._count?.roles || 0} roles
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(permission)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(permission)}
                                            disabled={(permission._count?.roles || 0) > 0}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Recurso</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPermissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {searchQuery
                                                ? 'No se encontraron permisos'
                                                : 'No hay permisos creados'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPermissions.map((permission) => (
                                    <TableRow key={permission.id}>
                                        <TableCell>
                                            <Badge variant="outline">{permission.resource}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {permission.action}
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">
                                            {permission.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {permission._count?.roles || 0} roles
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(permission)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(permission)}
                                                    disabled={(permission._count?.roles || 0) > 0}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isCreateMode ? 'Crear Nuevo Permiso' : 'Editar Permiso'}
                        </DialogTitle>
                        <DialogDescription>
                            {isCreateMode
                                ? 'Completa los datos para crear un nuevo permiso'
                                : 'Modifica los datos del permiso'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="resource">Recurso *</Label>
                            <Input
                                id="resource"
                                {...register('resource')}
                                placeholder="Ej: users, projects, tasks"
                            />
                            {errors.resource && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.resource.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="action">Acción *</Label>
                            <Input
                                id="action"
                                {...register('action')}
                                placeholder="Ej: create, read, update, delete"
                            />
                            {errors.action && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.action.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Descripción del permiso..."
                                rows={3}
                            />
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
                            <Button
                                type="submit"
                                disabled={createPermission.isPending || updatePermission.isPending}
                            >
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
                        <AlertDialogTitle>¿Eliminar permiso?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El permiso "
                            {permissionToDelete?.resource}:{permissionToDelete?.action}" será
                            eliminado permanentemente.
                            {permissionToDelete && (permissionToDelete._count?.roles || 0) > 0 && (
                                <span className="block mt-2 text-red-600">
                                    ⚠️ Este permiso está asignado a{' '}
                                    {permissionToDelete._count?.roles} rol(es). Debes
                                    eliminarlo de los roles primero.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={
                                (permissionToDelete?._count?.roles || 0) > 0
                            }
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
