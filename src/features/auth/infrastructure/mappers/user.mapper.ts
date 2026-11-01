import { User } from '../../domain/entities/user';
import { LoginParams, RegisterParams } from '../../domain/repositories/auth.repository';
import { LoginDto, RegisterDto, UserResponseDto } from '../dtos/auth.dto';

export class UserMapper {
    static toDomain(dto: UserResponseDto): User {
        return new User({
            id: dto.id,
            name: dto.full_name,
            email: dto.email,
        });
    }

    static toLoginDto(params: LoginParams): LoginDto {
        return {
            email: params.email,
            password: params.password,
        };
    }

    static toRegisterDto(params: RegisterParams): RegisterDto {
        return {
            full_name: params.name,
            email: params.email,
            password: params.password,
        };
    }
}
