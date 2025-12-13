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

export interface CreatePermissionDto {
    resource: string;
    action: string;
    description?: string;
}

export interface UpdatePermissionDto {
    resource?: string;
    action?: string;
    description?: string;
}

export function usePermissions(resource?: string) {
    return useQuery<Permission[]>({
        queryKey: ["permissions", resource],
        queryFn: async () => {
            try {
                const url = resource ? `/permissions?resource=${resource}` : "/permissions";
                const response = await api.get(url);
                const body = response.data;
                
                // Debug logging
                console.log('Permissions API Response:', { body, resource });
                
                if (Array.isArray(body)) {
                    return body;
                }
                if (body?.data && Array.isArray(body.data)) {
                    return body.data;
                }
                console.warn('Unexpected permissions response format:', body);
                return [];
            } catch (error: any) {
                console.error('Error fetching permissions:', error);
                toast.error(`Error al cargar permisos: ${error.response?.data?.message || error.message}`);
                throw error;
            }
        },
        retry: 2,
    });
}

export function usePermission(id: string) {
    return useQuery<Permission>({
        queryKey: ["permission", id],
        queryFn: async () => {
            const response = await api.get(`/permissions/${id}`);
            return response.data?.data || response.data;
        },
        enabled: !!id,
    });
}

export function usePermissionResources() {
    return useQuery<string[]>({
        queryKey: ["permission-resources"],
        queryFn: async () => {
            try {
                const response = await api.get("/permissions/resources");
                const data = response.data?.data || response.data || [];
                console.log('Permission Resources:', data);
                return Array.isArray(data) ? data : [];
            } catch (error: any) {
                console.error('Error fetching permission resources:', error);
                toast.error(`Error al cargar recursos: ${error.response?.data?.message || error.message}`);
                return [];
            }
        },
        retry: 2,
    });
}

export function useCreatePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreatePermissionDto) => {
            const response = await api.post("/permissions", data);
            return response.data?.data || response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
            queryClient.invalidateQueries({ queryKey: ["permission-resources"] });
            toast.success("Permiso creado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al crear permiso";
            toast.error(message);
        },
    });
}

export function useUpdatePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdatePermissionDto }) => {
            const response = await api.patch(`/permissions/${id}`, data);
            return response.data?.data || response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
            queryClient.invalidateQueries({ queryKey: ["permission", variables.id] });
            toast.success("Permiso actualizado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al actualizar permiso";
            toast.error(message);
        },
    });
}

export function useDeletePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/permissions/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
            queryClient.invalidateQueries({ queryKey: ["permission-resources"] });
            toast.success("Permiso eliminado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al eliminar permiso";
            toast.error(message);
        },
    });
}
