import { User } from '../entities/user';
import { AuthRepository, RegisterParams } from '../repositories/auth.repository';

export interface RegisterInput extends RegisterParams {
    confirmPassword: string;
}

const MIN_PASSWORD_LENGTH = 6;

export class RegisterUseCase {
    constructor(private readonly repository: AuthRepository) { }

    async execute(input: RegisterInput): Promise<User> {
        const name = input.name.trim();
        const email = input.email.trim().toLowerCase();

        if (name === '' || email === '' || input.password === '' || input.confirmPassword === '') {
            throw new Error('Completa todos los campos.');
        }

        if (input.password !== input.confirmPassword) {
            throw new Error('Las contraseñas no coinciden.');
        }

        if (input.password.length < MIN_PASSWORD_LENGTH) {
            throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
        }

        return await this.repository.register({ name, email, password: input.password });
    }
}
