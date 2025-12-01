export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}
