import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    role: {
        id: string;
        name: string;
    };
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: string;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    roleId?: string;
    isActive?: boolean;
    avatarUrl?: string;
}

export function useUsers() {
    return useQuery<User[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await api.get("/users");
            const body = response.data;

            // Handle different response structures
            if (Array.isArray(body)) {
                return body;
            }
            if (body?.data && Array.isArray(body.data)) {
                return body.data;
            }
            if (body?.success && Array.isArray(body.data)) {
                return body.data;
            }
            return [];
        },
    });
}

export function useUser(id: string) {
    return useQuery<User>({
        queryKey: ["user", id],
        queryFn: async () => {
            const response = await api.get(`/users/${id}`);
            return response.data?.data || response.data;
        },
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateUserDto) => {
            const response = await api.post("/users", data);
            return response.data?.data || response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Usuario creado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al crear usuario";
            toast.error(message);
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateUserDto }) => {
            const response = await api.patch(`/users/${id}`, data);
            return response.data?.data || response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
            toast.success("Usuario actualizado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al actualizar usuario";
            toast.error(message);
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Usuario eliminado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al eliminar usuario";
            toast.error(message);
        },
    });
}
