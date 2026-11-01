import { configureStore } from '@reduxjs/toolkit';
import { routinesReducer } from '@/src/features/routines/presentation/store/routines.slice';
import { authReducer } from '@/src/features/auth/presentation/store/auth.slice';

/**
 * Fábrica para crear una nueva instancia del Store de Redux.
 * 
 * ¿Por qué una función en vez de una constante global?
 * En Next.js (App Router con Server Components / SSR), una constante global 
 * compartiría el mismo store entre múltiples peticiones de usuarios en el servidor.
 * Con makeStore(), cada contexto obtiene su propia instancia limpia.
 */
export const makeStore = () => {
    return configureStore({
        reducer: {
            routines: routinesReducer,
            auth: authReducer,
        },
    });
};

// Tipos inferidos a partir del propio Store
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
