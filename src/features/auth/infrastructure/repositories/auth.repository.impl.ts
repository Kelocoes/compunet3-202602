import { User } from '../../domain/entities/user';
import { AuthRepository, LoginParams, RegisterParams } from '../../domain/repositories/auth.repository';
import { AuthDatasource } from '../datasources/auth-datasource.interface';
import { UserMapper } from '../mappers/user.mapper';

export class AuthRepositoryImpl implements AuthRepository {
    constructor(private readonly datasource: AuthDatasource) { }

    async login(params: LoginParams): Promise<User | null> {
        const dto = await this.datasource.login(UserMapper.toLoginDto(params));
        return dto ? UserMapper.toDomain(dto) : null;
    }

    async register(params: RegisterParams): Promise<User> {
        const dto = await this.datasource.register(UserMapper.toRegisterDto(params));
        return UserMapper.toDomain(dto);
    }
}
