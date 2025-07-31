export interface User {
    id?: string;
    username: string;
    fullname: string;
    email?: string;
    phone?: string;
    role: string;
    isActive?: boolean;
}