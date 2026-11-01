import { User } from '../entities/user';
import { AuthRepository, LoginParams } from '../repositories/auth.repository';

export class LoginUseCase {
    constructor(private readonly repository: AuthRepository) { }

    async execute(params: LoginParams): Promise<User> {
        const email = params.email.trim().toLowerCase();

        if (email === '' || params.password === '') {
            throw new Error('Completa el correo y la contraseña.');
        }

        const user = await this.repository.login({ email, password: params.password });

        if (!user) {
            throw new Error('Correo o contraseña incorrectos.');
        }

        return user;
    }
}
