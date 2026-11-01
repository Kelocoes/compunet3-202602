import { User } from '../entities/user';

export interface LoginParams {
    email: string;
    password: string;
}

export interface RegisterParams {
    name: string;
    email: string;
    password: string;
}

export interface AuthRepository {
    login(params: LoginParams): Promise<User | null>;

    register(params: RegisterParams): Promise<User>;
}
