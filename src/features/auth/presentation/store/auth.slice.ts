import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authContainer } from '../../di/auth.container';
import { LoginParams } from '../../domain/repositories/auth.repository';
import { RegisterInput } from '../../domain/usecases/register.usecase';
import { AuthUserViewModel, AuthViewModelMapper } from '../viewmodels/auth.viewmodel';

interface AuthState {
    user: AuthUserViewModel | null;
    isLoading: boolean;
    errorMessage: string | null;
}

const initialState: AuthState = {
    user: null,
    isLoading: false,
    errorMessage: null,
};

export const loginMutation = createAsyncThunk(
    'auth/login',
    async (params: LoginParams, { rejectWithValue }) => {
        try {
            const user = await authContainer.login.execute(params);
            return AuthViewModelMapper.toViewModel(user);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión';
            return rejectWithValue(message);
        }
    }
);

export const registerMutation = createAsyncThunk(
    'auth/register',
    async (input: RegisterInput, { rejectWithValue }) => {
        try {
            const user = await authContainer.register.execute(input);
            return AuthViewModelMapper.toViewModel(user);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta';
            return rejectWithValue(message);
        }
    }
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.errorMessage = null;
        },
        clearError: (state) => {
            state.errorMessage = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginMutation.pending, (state) => {
                state.isLoading = true;
                state.errorMessage = null;
            })
            .addCase(loginMutation.fulfilled, (state, action: PayloadAction<AuthUserViewModel>) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(loginMutation.rejected, (state, action) => {
                state.isLoading = false;
                state.errorMessage = (action.payload as string) ?? 'No se pudo iniciar sesión';
            });

        builder
            .addCase(registerMutation.pending, (state) => {
                state.isLoading = true;
                state.errorMessage = null;
            })
            .addCase(registerMutation.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(registerMutation.rejected, (state, action) => {
                state.isLoading = false;
                state.errorMessage = (action.payload as string) ?? 'No se pudo crear la cuenta';
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export const authReducer = authSlice.reducer;
