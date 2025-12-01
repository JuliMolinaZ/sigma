import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface OrganizationModule {
    id: string;
    moduleId: string;
    isEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ModuleUpdate {
    moduleId: string;
    isEnabled: boolean;
}

// Get enabled modules for the organization
export function useEnabledModules() {
    return useQuery({
        queryKey: ["organization-modules", "enabled"],
        queryFn: async () => {
            try {
                const response = await api.get("/organization-modules");
                const body = response.data;
                if (Array.isArray(body)) return body as OrganizationModule[];
                if (body?.data && Array.isArray(body.data)) return body.data as OrganizationModule[];
                return [] as OrganizationModule[];
            } catch (error: any) {
                // Silently handle session expiration errors
                if (error?.silent || error?.isSessionExpired) {
                    // Return empty array, redirect will happen automatically
                    return [] as OrganizationModule[];
                }
                throw error;
            }
        },
        retry: (failureCount, error: any) => {
            // Don't retry on session expiration
            if (error?.silent || error?.isSessionExpired) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

// Get all modules status (for admin panel)
export function useAllModulesStatus() {
    return useQuery({
        queryKey: ["organization-modules", "all"],
        queryFn: async () => {
            const response = await api.get("/organization-modules/all");
            const body = response.data;
            if (Array.isArray(body)) return body as OrganizationModule[];
            if (body?.data && Array.isArray(body.data)) return body.data as OrganizationModule[];
            return [] as OrganizationModule[];
        },
    });
}

// Toggle a single module visibility
export function useToggleModuleVisibility() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ moduleId, isEnabled }: ModuleUpdate) => {
            const response = await api.put(
                `/organization-modules/${moduleId}`,
                { moduleId, isEnabled }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organization-modules"] });
        },
    });
}

// Batch update modules
export function useBatchUpdateModules() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (modules: ModuleUpdate[]) => {
            const response = await api.post("/organization-modules/batch-update", {
                modules,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organization-modules"] });
        },
    });
}

// Initialize default modules
export function useInitializeDefaultModules() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (moduleIds: string[]) => {
            const response = await api.post("/organization-modules/initialize", {
                moduleIds,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organization-modules"] });
        },
    });
}
