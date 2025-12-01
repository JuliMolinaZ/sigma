import api from '@/lib/api';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    avatarUrl?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export const AuthService = {
    login: async (credentials: any): Promise<AuthResponse> => {
        const response = await api.post<{ success: boolean, data: AuthResponse }>('/auth/login', credentials);
        return response.data.data;
    },

    register: async (data: any): Promise<AuthResponse> => {
        const response = await api.post<{ success: boolean, data: AuthResponse }>('/auth/register', data);
        return response.data.data;
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await api.post<{ success: boolean, data: AuthResponse }>('/auth/refresh', { refreshToken });
        return response.data.data;
    },

    logout: async (refreshToken: string): Promise<void> => {
        await api.post('/auth/logout', { refreshToken });
    },
};
