import { useState, useEffect } from 'react';

export interface CurrentUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string | { name: string };
    avatarUrl?: string;
    organizationId: string;
}

export function useUser() {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to parse user from local storage', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();

        // Listen for storage changes (e.g. logout in another tab)
        window.addEventListener('storage', loadUser);
        return () => window.removeEventListener('storage', loadUser);
    }, []);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
    };
}
