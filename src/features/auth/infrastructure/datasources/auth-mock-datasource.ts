import 'server-only';
import { createHmac } from 'node:crypto';
import { AuthDatasource } from './auth-datasource.interface';
import { LoginDto, LoginResponseDto, RegisterDto, UserResponseDto } from '../dtos/auth.dto';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_SECRET = 'secreto-de-prueba';
const TOKEN_TTL_SECONDS = 60 * 60;
const DEFAULT_PERMISSIONS = ['view_routines', 'create_routines'];

interface StoredUser extends UserResponseDto {
    password: string;
    role: 'ADMIN' | 'USER';
    permissions: string[];
}

const base64url = (data: object) => Buffer.from(JSON.stringify(data)).toString('base64url');

function signMockToken(payload: object): string {
    const body = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}`;
    const signature = createHmac('sha256', MOCK_SECRET).update(body).digest('base64url');
    return `${body}.${signature}`;
}

export class AuthMockDatasource implements AuthDatasource {
    private users: StoredUser[] = [
        {
            id: 1,
            full_name: 'Ana Pérez',
            email: 'ana@icesi.edu.co',
            password: '123456',
            role: 'USER',
            permissions: [...DEFAULT_PERMISSIONS],
        },
        {
            id: 2,
            full_name: 'Admin Icesi',
            email: 'admin@icesi.edu.co',
            password: 'admin123',
            role: 'ADMIN',
            permissions: [...DEFAULT_PERMISSIONS],
        },
    ];

    async login(dto: LoginDto): Promise<LoginResponseDto | null> {
        await delay(600);
        const found = this.users.find(
            (u) => u.email === dto.email && u.password === dto.password
        );

        if (!found) {
            return null;
        }

        const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
        const accessToken = signMockToken({
            sub: String(found.id),
            name: found.full_name,
            role: found.role,
            permissions: found.permissions,
            exp,
        });

        return { access_token: accessToken };
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
            role: 'USER',
            permissions: [...DEFAULT_PERMISSIONS],
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
