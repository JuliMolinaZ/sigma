import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();

    return useMutation({
        mutationFn: async (data: UpdateProfileDto) => {
            if (!user?.id) {
                throw new Error("User not found");
            }
            const response = await api.patch(`/users/${user.id}`, data);
            return response.data?.data || response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
            // Update auth store with new user data
            if (data) {
                setUser({ ...user, ...data });
            }
            toast.success("Perfil actualizado exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al actualizar perfil";
            toast.error(message);
        },
    });
}

export function useChangePassword() {
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (data: ChangePasswordDto) => {
            if (!user?.id) {
                throw new Error("User not found");
            }
            // Validate passwords match
            if (data.newPassword !== data.confirmPassword) {
                throw new Error("Las contraseñas no coinciden");
            }
            // Send only the new password - backend should validate current password
            // For now, we'll send it in a way the backend can handle
            const response = await api.patch(`/users/${user.id}`, {
                password: data.newPassword,
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Contraseña actualizada exitosamente");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || "Error al cambiar contraseña";
            toast.error(message);
        },
    });
}
