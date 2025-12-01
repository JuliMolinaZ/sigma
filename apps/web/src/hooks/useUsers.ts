import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: {
        id: string;
        name: string;
    };
    isActive: boolean;
}

export function useUsers() {
    return useQuery({
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
            return [];
        },
    });
}
