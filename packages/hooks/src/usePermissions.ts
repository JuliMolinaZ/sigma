import { useAuth } from './useAuth';

export const usePermissions = () => {
    const { user } = useAuth();

    const can = (resource: string, action: string) => {
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        return user.permissions.some(p => p.resource === resource && p.action === action);
    };

    return { can };
};
