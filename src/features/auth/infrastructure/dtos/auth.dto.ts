export interface UserResponseDto {
    id: number;
    full_name: string;
    email: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    full_name: string;
    email: string;
    password: string;
}
