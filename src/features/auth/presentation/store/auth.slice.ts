import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loginAction, logoutAction, registerAction } from '../actions/auth.actions';
import type { LoginParams } from '../../domain/repositories/auth.repository';
import type { RegisterInput } from '../../domain/usecases/register.usecase';
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
            const result = await loginAction(params.email, params.password);

            if (!result.ok) {
                return rejectWithValue(result.message);
            }

            return AuthViewModelMapper.toViewModel(result.user);
        } catch {
            return rejectWithValue('No se pudo iniciar sesión. Intenta de nuevo.');
        }
    }
);

export const registerMutation = createAsyncThunk(
    'auth/register',
    async (input: RegisterInput, { rejectWithValue }) => {
        try {
            const result = await registerAction(input);

            if (!result.ok) {
                return rejectWithValue(result.message);
            }
        } catch {
            return rejectWithValue('No se pudo crear la cuenta. Intenta de nuevo.');
        }
    }
);

export const logoutMutation = createAsyncThunk('auth/logout', async () => {
    await logoutAction();
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<AuthUserViewModel | null>) => {
            state.user = action.payload;
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

        builder.addCase(logoutMutation.fulfilled, (state) => {
            state.user = null;
            state.errorMessage = null;
        });
    },
});

export const { setUser, clearError } = authSlice.actions;
export const authReducer = authSlice.reducer;
