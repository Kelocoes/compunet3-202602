'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearError, loginMutation, logout as logoutAction, registerMutation } from '../store/auth.slice';
import { LoginParams } from '../../domain/repositories/auth.repository';
import { RegisterInput } from '../../domain/usecases/register.usecase';

export function useAuth() {
    const dispatch = useAppDispatch();

    const user = useAppSelector((state) => state.auth.user);
    const isLoading = useAppSelector((state) => state.auth.isLoading);
    const errorMessage = useAppSelector((state) => state.auth.errorMessage);

    const login = async (params: LoginParams): Promise<boolean> => {
        const resultAction = await dispatch(loginMutation(params));
        return loginMutation.fulfilled.match(resultAction);
    };

    const register = async (input: RegisterInput): Promise<boolean> => {
        const resultAction = await dispatch(registerMutation(input));
        return registerMutation.fulfilled.match(resultAction);
    };

    const logout = useCallback(() => {
        dispatch(logoutAction());
    }, [dispatch]);

    const resetError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    return {
        user,
        isAuthenticated: user !== null,
        isLoading,
        errorMessage,
        login,
        register,
        logout,
        resetError,
    };
}
