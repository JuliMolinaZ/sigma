import { create } from 'zustand';
import { AuthService, User, AuthResponse } from '../services/auth.service';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    signIn: (credentials: any) => Promise<void>;
    signUp: (data: any) => Promise<void>;
    signOut: () => Promise<void>;
    restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,

    signIn: async (credentials) => {
        set({ isLoading: true });
        try {
            const data = await AuthService.login(credentials);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('orgId', data.user.organizationId);
            localStorage.setItem('user', JSON.stringify(data.user));
            set({
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    signUp: async (formData) => {
        set({ isLoading: true });
        try {
            const data = await AuthService.register(formData);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('orgId', data.user.organizationId);
            localStorage.setItem('user', JSON.stringify(data.user));
            set({
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    signOut: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
            try {
                await AuthService.logout(refreshToken);
            } catch (e) {
                console.error('Logout failed', e);
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('orgId');
        localStorage.removeItem('user');
        set({ user: null, accessToken: null, refreshToken: null });
    },

    restoreSession: async () => {
        set({ isLoading: true });
        try {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const userStr = localStorage.getItem('user');

            if (accessToken && userStr) {
                set({
                    accessToken,
                    refreshToken,
                    user: JSON.parse(userStr),
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            set({ isLoading: false });
        }
    },
}));
