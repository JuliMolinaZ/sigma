import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Dispatch {
    id: string;
    content: string;
    urgencyLevel: 'NORMAL' | 'URGENT' | 'CRITICAL';
    status: 'SENT' | 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'CONVERTED_TO_TASK';
    senderId: string;
    recipientId: string;
    taskId?: string | null;
    dueDate?: string | null;
    readAt?: string | null;
    inProgressAt?: string | null;
    resolvedAt?: string | null;
    resolutionNote?: string | null;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string | null;
        role: {
            name: string;
        };
    };
    recipient: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl?: string | null;
        role: {
            name: string;
        };
    };
    task?: {
        id: string;
        title: string;
        status: string;
    } | null;
    _count?: {
        attachments: number;
    };
}

export interface DispatchStats {
    totalSent: number;
    totalReceived: number;
    unreadCount: number;
    urgentCount: number;
}

export function useDispatches(params?: {
    page?: number;
    limit?: number;
    status?: string;
    urgencyLevel?: string;
    type?: 'sent' | 'received';
}) {
    return useQuery({
        queryKey: ["dispatches", params],
        queryFn: async () => {
            const response = await api.get("/dispatches", { params });
            const body = response.data;

            // Handle response structure
            if (body?.data?.data && Array.isArray(body.data.data)) {
                return {
                    data: body.data.data,
                    meta: body.data.meta
                };
            }

            if (body?.data && Array.isArray(body.data)) {
                return { data: body.data, meta: body.meta || null };
            }

            if (Array.isArray(body)) {
                return { data: body, meta: null };
            }

            return { data: [], meta: null };
        },
    });
}

export function useDispatch(id: string) {
    return useQuery<Dispatch>({
        queryKey: ["dispatch", id],
        queryFn: async () => {
            const response = await api.get(`/dispatches/${id}`);
            if (response.data && response.data.data) {
                return response.data.data;
            }
            return response.data;
        },
        enabled: !!id,
    });
}

export function useDispatchStats() {
    return useQuery<DispatchStats>({
        queryKey: ["dispatch-stats"],
        queryFn: async () => {
            const response = await api.get("/dispatches/stats");
            return response.data.data || response.data;
        },
    });
}

export function useCreateDispatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            content: string;
            description?: string;
            link?: string;
            recipientId: string;
            urgencyLevel?: 'NORMAL' | 'URGENT' | 'CRITICAL';
            dueDate?: string;
        }) => {
            const response = await api.post("/dispatches", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dispatches"] });
            queryClient.invalidateQueries({ queryKey: ["dispatch-stats"] });
        },
    });
}

export function usePatchDispatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/dispatches/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["dispatches"] });
            queryClient.invalidateQueries({ queryKey: ["dispatch", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["dispatch-stats"] });
        },
    });
}

export function useDeleteDispatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/dispatches/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dispatches"] });
            queryClient.invalidateQueries({ queryKey: ["dispatch-stats"] });
        },
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/dispatches/${id}/read`);
            return response.data;
        },
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ["dispatches"] });
            queryClient.invalidateQueries({ queryKey: ["dispatch", id] });
            queryClient.invalidateQueries({ queryKey: ["dispatch-stats"] });
        },
    });
}

export function useMarkInProgress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/dispatches/${id}/progress`);
            return response.data;
        },
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ["dispatches"] });
            queryClient.invalidateQueries({ queryKey: ["dispatch", id] });
        },
    });
}

export function useResolveDispatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, resolutionNote }: { id: string; resolutionNote?: string }) => {
            const response = await api.post(`/dispatches/${id}/resolve`, { resolutionNote });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["dispatches"] });
            queryClient.invalidateQueries({ queryKey: ["dispatch", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["dispatch-stats"] });
        },
    });
}

export function useConvertToTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, projectId }: { id: string; projectId?: string }) => {
            const response = await api.post(`/dispatches/${id}/convert-to-task`, { projectId });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dispatches'] });
            queryClient.invalidateQueries({ queryKey: ["dispatch", variables.id] });
            queryClient.invalidateQueries({ queryKey: ['dispatch-stats'] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
}
