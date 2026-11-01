import { AuthTokens } from '../../domain/entities/auth-tokens';
import { LoginResponseDto } from '../dtos/auth.dto';

export class AuthTokensMapper {
    static toDomain(dto: LoginResponseDto): AuthTokens {
        return {
            accessToken: dto.access_token,
        };
    }
}
