import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createRoutineAction, getRoutinesAction } from '../actions/routines.actions';
import { CreateRoutineParams } from '../../domain/repositories/routine.repository';
import { RoutineItemViewModel } from '../viewmodels/routine.viewmodel';

interface RoutinesState {
    items: RoutineItemViewModel[];
    isLoading: boolean;
    isMutating: boolean;
    errorMessage: string | null;
}

const initialState: RoutinesState = {
    items: [],
    isLoading: false,
    isMutating: false,
    errorMessage: null,
};

/**
 * 1. Thunk de Consulta / Lectura (Query)
 * Invoca la Server Action getRoutinesAction, que exige el permiso view_routines en el servidor.
 */
export const fetchRoutines = createAsyncThunk(
    'routines/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const result = await getRoutinesAction();

            if (!result.ok) {
                return rejectWithValue(result.message);
            }

            return result.routines;
        } catch {
            return rejectWithValue('No se pudieron cargar las rutinas. Intenta de nuevo.');
        }
    }
);

/**
 * 2. Thunk de Mutación (Mutation)
 * Invoca la Server Action createRoutineAction, que exige el permiso create_routines en el servidor.
 */
export const createRoutineMutation = createAsyncThunk(
    'routines/create',
    async (params: CreateRoutineParams, { rejectWithValue }) => {
        try {
            const result = await createRoutineAction(params);

            if (!result.ok) {
                return rejectWithValue(result.message);
            }

            return result.routine;
        } catch {
            return rejectWithValue('No se pudo crear la rutina. Intenta de nuevo.');
        }
    }
);

export const routinesSlice = createSlice({
    name: 'routines',
    initialState,
    reducers: {
        clearError: (state) => {
            state.errorMessage = null;
        },
    },
    extraReducers: (builder) => {
        // --- Ciclo de vida de Lectura (fetchRoutines) ---
        builder
            .addCase(fetchRoutines.pending, (state) => {
                state.isLoading = true;
                state.errorMessage = null;
            })
            .addCase(fetchRoutines.fulfilled, (state, action: PayloadAction<RoutineItemViewModel[]>) => {
                state.isLoading = false;
                state.items = action.payload;
            })
            .addCase(fetchRoutines.rejected, (state, action) => {
                state.isLoading = false;
                state.errorMessage = (action.payload as string) ?? 'Error al obtener rutinas';
            });

        // --- Ciclo de vida de Mutación (createRoutineMutation) ---
        builder
            .addCase(createRoutineMutation.pending, (state) => {
                state.isMutating = true;
                state.errorMessage = null;
            })
            .addCase(createRoutineMutation.fulfilled, (state, action: PayloadAction<RoutineItemViewModel>) => {
                state.isMutating = false;
                state.items.unshift(action.payload); // Actualización optimista/reactiva en el estado local
            })
            .addCase(createRoutineMutation.rejected, (state, action) => {
                state.isMutating = false;
                state.errorMessage = (action.payload as string) ?? 'Error al guardar rutina';
            });
    },
});

export const { clearError } = routinesSlice.actions;
export const routinesReducer = routinesSlice.reducer;
