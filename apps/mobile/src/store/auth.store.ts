import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
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

async function saveSession(data: AuthResponse) {
    if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    } else {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
}

async function clearSession() {
    if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
    } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
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
            await saveSession(data);
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
            await saveSession(data);
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
        await clearSession();
        set({ user: null, accessToken: null, refreshToken: null });
    },

    restoreSession: async () => {
        set({ isLoading: true });
        try {
            let accessToken, refreshToken, userStr;

            if (Platform.OS !== 'web') {
                accessToken = await SecureStore.getItemAsync('accessToken');
                refreshToken = await SecureStore.getItemAsync('refreshToken');
                userStr = await SecureStore.getItemAsync('user');
            } else {
                accessToken = localStorage.getItem('accessToken');
                refreshToken = localStorage.getItem('refreshToken');
                userStr = localStorage.getItem('user');
            }

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
