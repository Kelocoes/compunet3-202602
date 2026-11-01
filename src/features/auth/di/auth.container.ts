import { AuthMockDatasource } from '../infrastructure/datasources/auth-mock-datasource';
import { AuthRepositoryImpl } from '../infrastructure/repositories/auth.repository.impl';
import { LoginUseCase } from '../domain/usecases/login.usecase';
import { RegisterUseCase } from '../domain/usecases/register.usecase';

const datasource = new AuthMockDatasource();

const authRepository = new AuthRepositoryImpl(datasource);

export const authContainer = {
    login: new LoginUseCase(authRepository),
    register: new RegisterUseCase(authRepository),
};

export type AuthContainer = typeof authContainer;
