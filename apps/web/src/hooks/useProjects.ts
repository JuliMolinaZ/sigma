import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Project } from "@/types";

// Project interface is imported from @/types
// Removing local definition to avoid conflicts if it exists there, 
// otherwise we will keep it but let's assume it's in @/types based on ProjectsPage import.
// If it's not in @/types, I will need to restore it or add it there.
// Checking previous file content, ProjectsPage imported from @/types.
// So I will remove the local interface here to avoid duplication.

export function useProjects(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    return useQuery({
        queryKey: ["projects", params],
        queryFn: async () => {
            const response = await api.get("/projects", {
                params,
            });
            const body = response.data;

            // Case 1: Paginated response wrapped in success object
            if (body?.data?.data && Array.isArray(body.data.data)) {
                return {
                    data: body.data.data,
                    meta: body.data.meta
                };
            }

            // Case 2: Array wrapped in success object
            if (body?.data && Array.isArray(body.data)) {
                return { data: body.data, meta: null };
            }

            // Case 3: Direct Paginated
            if (body?.data && Array.isArray(body.data)) {
                return { data: body.data, meta: body.meta || null };
            }

            // Case 4: Direct Array
            if (Array.isArray(body)) {
                return { data: body, meta: null };
            }

            return { data: [], meta: null };
        },
    });
}

export function useProject(id: string) {
    return useQuery<Project>({
        queryKey: ["project", id],
        queryFn: async () => {
            const response = await api.get(`/projects/${id}`);
            // Handle { success: true, data: { ... } } structure
            if (response.data && response.data.data) {
                return response.data.data;
            }
            return response.data;
        },
        enabled: !!id,
    });
}

export function useProjectStats(id: string) {
    return useQuery({
        queryKey: ["project-stats", id],
        queryFn: async () => {
            const { data } = await api.get(`/projects/${id}/statistics`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Project>) => {
            const response = await api.post("/projects", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
            const response = await api.patch(`/projects/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/projects/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
}

export function useProjectFinancials(id: string) {
    return useQuery({
        queryKey: ["project-financials", id],
        queryFn: async () => {
            const { data } = await api.get(`/projects/${id}/financial-stats`);
            return data;
        },
        enabled: !!id,
    });
}
