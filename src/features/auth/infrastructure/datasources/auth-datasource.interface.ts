import { LoginDto, LoginResponseDto, RegisterDto, UserResponseDto } from '../dtos/auth.dto';

export interface AuthDatasource {
    login(dto: LoginDto): Promise<LoginResponseDto | null>;
    register(dto: RegisterDto): Promise<UserResponseDto>;
}
