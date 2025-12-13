import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface Permission {
    id: string;
    resource: string;
    action: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    _count?: {
        roles: number;
    };
}

export interface RolePermission {
    permission: Permission;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    level: number;
    category?: string;
    organizationId: string;
    permissions?: RolePermission[];
    _count?: {
        users: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateRoleDto {
    name: string;
    description?: string;
    isSystem?: boolean;
    level?: number;
    category?: string;
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    isSystem?: boolean;
    level?: number;
    category?: string;
}

export interface AssignPermissionsDto {
    permissionIds: string[];
}

export function useRoles() {
    return useQuery<Role[]>({
        queryKey: ["roles"],
        queryFn: async () => {
            const response = await api.get("/roles");
            const body = response.data;
            if (Array.isArray(body)) {
                return body;
            }
            if (body?.data && Array.isArray(body.data)) {
                return body.data;
            }
            return [];
        },
    });
}

export function useRole(id: string) {
    return useQuery<Role>({
        queryKey: ["role", id],
        queryFn: async () => {
            const response = await api.get(`/roles/${id}`);
            return response.data?.data || response.data;
        },
        enabled: !!id,
    });
}

export function useCreateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateRoleDto) => {
            const response = await api.post("/roles", data);
            return response.data?.data || response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            toast.success("Rol creado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al crear rol";
            toast.error(message);
        },
    });
}

export function useUpdateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateRoleDto }) => {
            const response = await api.patch(`/roles/${id}`, data);
            return response.data?.data || response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            queryClient.invalidateQueries({ queryKey: ["role", variables.id] });
            toast.success("Rol actualizado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al actualizar rol";
            toast.error(message);
        },
    });
}

export function useDeleteRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/roles/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            toast.success("Rol eliminado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al eliminar rol";
            toast.error(message);
        },
    });
}

export function useAssignPermissions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: AssignPermissionsDto }) => {
            const response = await api.put(`/roles/${id}/permissions`, data);
            return response.data?.data || response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            queryClient.invalidateQueries({ queryKey: ["role", variables.id] });
            toast.success("Permisos asignados exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al asignar permisos";
            toast.error(message);
        },
    });
}
