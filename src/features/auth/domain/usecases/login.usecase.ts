import { AuthTokens } from '../entities/auth-tokens';
import { AuthRepository, LoginParams } from '../repositories/auth.repository';

export class LoginUseCase {
    constructor(private readonly repository: AuthRepository) { }

    async execute(params: LoginParams): Promise<AuthTokens | null> {
        const email = params.email.trim().toLowerCase();

        if (email === '' || params.password === '') {
            return null;
        }

        return await this.repository.login({ email, password: params.password });
    }
}
