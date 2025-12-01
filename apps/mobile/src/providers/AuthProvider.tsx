import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
    user: any | null;
    signIn: () => void;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    signIn: () => { },
    signOut: () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);

    const signIn = () => setUser({ name: 'Julian Molina', role: 'ADMIN' });
    const signOut = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
