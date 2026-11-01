import { AuthDatasource } from './auth-datasource.interface';
import { LoginDto, RegisterDto, UserResponseDto } from '../dtos/auth.dto';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface StoredUser extends UserResponseDto {
    password: string;
}

export class AuthMockDatasource implements AuthDatasource {
    private users: StoredUser[] = [
        {
            id: 1,
            full_name: 'Ana Pérez',
            email: 'ana@icesi.edu.co',
            password: '123456',
        },
    ];

    async login(dto: LoginDto): Promise<UserResponseDto | null> {
        await delay(600);
        const found = this.users.find(
            (u) => u.email === dto.email && u.password === dto.password
        );

        return found ? this.toResponse(found) : null;
    }

    async register(dto: RegisterDto): Promise<UserResponseDto> {
        await delay(800);

        if (this.users.some((u) => u.email === dto.email)) {
            throw new Error('El correo ya está registrado.');
        }

        const nextId = this.users.length > 0
            ? Math.max(...this.users.map((u) => u.id)) + 1
            : 1;

        const created: StoredUser = {
            id: nextId,
            full_name: dto.full_name,
            email: dto.email,
            password: dto.password,
        };

        this.users.push(created);
        return this.toResponse(created);
    }

    private toResponse(user: StoredUser): UserResponseDto {
        return {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
        };
    }
}
