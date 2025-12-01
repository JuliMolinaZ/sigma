export interface UserSession {
    sessionId: string;
    userId: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        organizationId: string;
        permissions: { resource: string; action: string }[];
        avatarUrl?: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
