import { LoginDto, RegisterDto, UserResponseDto } from '../dtos/auth.dto';

export interface AuthDatasource {
    login(dto: LoginDto): Promise<UserResponseDto | null>;
    register(dto: RegisterDto): Promise<UserResponseDto>;
}
