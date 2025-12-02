'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Loader from '@/components/ui/loader'
import { User } from '@/types'
import api from '@/lib/api'
import { getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Role {
    id: string
    name: string
}

export default function UsersPage() {
    const { user: currentUser } = useAuthStore()
    const isSuperAdmin = currentUser?.email === 'j.molina@runsolutions-services.com'

    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get<{ success: boolean, data: User[] }>('/users'),
                api.get<{ success: boolean, data: Role[] }>('/roles')
            ])
            setUsers(usersRes.data.data || [])

            // Handle roles response structure
            const rolesData = rolesRes.data as any
            if (Array.isArray(rolesData)) setRoles(rolesData)
            else if (Array.isArray(rolesData.data)) setRoles(rolesData.data)
            else setRoles([])

        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.error('Error al cargar usuarios')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (user: User) => {
        setSelectedUser(user)
        setIsDialogOpen(true)
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return
        try {
            await api.delete(`/users/${userId}`)
            toast.success('Usuario eliminado correctamente')
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar usuario')
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            roleId: formData.get('roleId'),
        }

        try {
            if (selectedUser) {
                await api.patch(`/users/${selectedUser.id}`, data)
                toast.success('Usuario actualizado correctamente')
            } else {
                // Handle create if needed, though button says "Invite User"
                // For now just update logic
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar usuario')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage team members and permissions</p>
                </div>
                {isSuperAdmin && (
                    <Button><Plus className="w-4 h-4 mr-2" />Invite User</Button>
                )}
            </div>

            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>
            </Card>

            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-12">
                        <Loader size="lg" text="Loading users..." />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                    {isSuperAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatarUrl || undefined} alt={user.firstName} />
                                                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary">{typeof user.role === 'object' ? user.role.name : user.role}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="success">Active</Badge>
                                        </td>
                                        {isSuperAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="icon" variant="ghost">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modificar información del usuario
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre</Label>
                                    <Input id="firstName" name="firstName" defaultValue={selectedUser?.firstName} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellido</Label>
                                    <Input id="lastName" name="lastName" defaultValue={selectedUser?.lastName} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={selectedUser?.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="roleId">Rol</Label>
                                <Select name="roleId" defaultValue={typeof selectedUser?.role === 'object' ? selectedUser.role.id : undefined}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
