# GymRoutines: sesiones con JWT y cookie `httpOnly`

Guía paso a paso para agregar **sesiones** a la aplicación de rutinas (Next.js 16, Redux Toolkit y Clean Architecture). Al terminar, el usuario inicia sesión, la sesión sobrevive a las recargas y se cierra borrando la cookie.

- **Punto de partida:** rama `week-14/next-auth-start`.
- **Resultado:** rama `week-14/next-auth-end`.
- **Fuera de esta guía:** `proxy.ts`, `requireSession`, el chequeo de sesión dentro de cada Server Action y el uso de roles en la interfaz. Son la siguiente clase.

---

## 1. Qué hay y qué falta

La rama de partida ya trae las capas que no cambian de concepto (mismo patrón que `routines`):

| Capa | Archivos listos | Qué hacen |
| :--- | :--- | :--- |
| Dominio | `AuthTokens`, `AuthRepository`, `LoginUseCase`, `RegisterUseCase`, `User` | `login` devuelve un token opaco (`AuthTokens`) o `null`. |
| Infraestructura | DTOs, mappers, `AuthMockDatasource`, `AuthRepositoryImpl` | El mock hace de backend: firma un JWT (HS256) con `sub`, `name`, `role`, `permissions` y `exp`. |
| DI | `auth.container.ts` | Arma el datasource, el repositorio y los casos de uso. |
| Presentación base | `LoginForm`, `RegisterForm`, `Header`, `Navbar` | La interfaz de la semana 13. |

**Es normal que la rama de partida falle.** El slice llama al contenedor desde el navegador, pero el contenedor usa el mock, y el mock usa `node:crypto`, que no existe en el navegador. El objetivo de esta guía es arreglarlo moviendo esa llamada al servidor con **Server Actions**.

### Usuarios de prueba (los crea el mock)

| Correo | Contraseña | Rol |
| :--- | :--- | :--- |
| `ana@icesi.edu.co` | `123456` | `USER` |
| `admin@icesi.edu.co` | `admin123` | `ADMIN` |

Ambos reciben `permissions: ["view_routines", "create_routines"]`. Los usuarios que se registren nacen como `USER` y viven en la memoria del servidor: se pierden al reiniciar `npm run dev`.

---

## 2. Cómo funciona

```
LoginForm → useAuth() → thunk loginMutation → [POST] → loginAction (servidor)
                                                          │
                                  LoginUseCase → repositorio → mock (devuelve un JWT)
                                                          │
                                  createSession → Set-Cookie: session=<jwt>; HttpOnly
```

- El navegador **nunca ve el token**: queda en una cookie `httpOnly`. A Redux solo llega `{ id, name, role, permissions }`.
- Al recargar, Redux nace vacío y JavaScript no puede leer la cookie. Por eso el **servidor** la lee en el layout (`getSession`) y le pasa el usuario al cliente con `AuthHydrator`.
- Decodificar un JWT **no es verificarlo**: lo que el front lee solo sirve para mostrar u ocultar cosas. Quien verifica la firma y decide permisos es el backend.

---

## 3. Paso a paso

### Paso 1. Instalar dependencias

```bash
npm install jwt-decode zod server-only
```

| Paquete | Para qué |
| :--- | :--- |
| `jwt-decode` | Decodifica el token (no lo firma ni lo verifica). |
| `zod` | Valida los datos que llegan a las Server Actions. |
| `server-only` | Hace fallar el build si código de cliente importa un archivo del servidor. |

### Paso 2. `src/lib/session.ts` (único archivo que toca la cookie)

Guarda, decodifica y borra la sesión. Los demás archivos lo usan y nadie más toca la cookie.

```ts
import 'server-only';
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'session';

export type TokenPayload = {
    sub: string;
    name: string;
    role: string;
    permissions: string[];
    exp: number;
};

export function decodeToken(token: string | undefined): TokenPayload | null {
    if (!token) {
        return null;
    }

    try {
        const payload = jwtDecode<TokenPayload>(token);

        if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

export async function createSession(token: string): Promise<TokenPayload> {
    const payload = decodeToken(token);

    if (!payload) {
        throw new Error('El backend entregó un token inválido');
    }

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
        // JavaScript del navegador no puede leer la cookie (protege contra XSS)
        httpOnly: true,
        // Solo viaja por HTTPS en producción; en desarrollo se permite http://localhost
        secure: process.env.NODE_ENV === 'production',
        // No se envía en peticiones entre sitios, salvo al navegar con un enlace (protege contra CSRF)
        sameSite: 'lax',
        // exp viene en segundos y Date espera milisegundos; la cookie vence cuando vence el token
        expires: new Date(payload.exp * 1000),
        // La cookie se envía en todas las rutas de la aplicación
        path: '/',
    });

    return payload;
}

export async function deleteSession(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
}
```

Puntos clave:
- `decodeToken` devuelve `null` en vez de lanzar: "no hay sesión" es un resultado normal, no un error.
- Comprobar `exp` no verifica la firma; solo evita tratar como sesión un token que ya venció.
- `createSession` guarda **el mismo token** que entregó el backend.

### Paso 3. `src/lib/dal.ts` (leer la sesión en el servidor)

DAL es la capa de acceso a datos: el lugar único, en el servidor, que responde "¿quién hace esta petición?". Por ahora solo necesitamos `getSession`.

```ts
import 'server-only';
import { cookies } from 'next/headers';
import { decodeToken, SESSION_COOKIE } from './session';

export async function getSession() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const payload = decodeToken(token);

    if (!payload || !token) {
        return null;
    }

    return {
        userId: payload.sub,
        name: payload.name,
        role: payload.role,
        permissions: payload.permissions,
        accessToken: token,
    };
}
```

### Paso 4. `src/features/auth/presentation/actions/auth.actions.ts` (Server Actions)

`'use server'` marca estas funciones como código del servidor: Next.js no las envía al navegador, y las llama como un POST. **La cookie `httpOnly` solo puede escribirla el servidor**, por eso el login y el logout viven aquí. El registro también, porque el contenedor es de servidor.

Las acciones devuelven `{ ok, ... }` en vez de lanzar errores: los errores **esperados** (datos inválidos, credenciales incorrectas) viajan como valor.

```ts
'use server';

import { z } from 'zod';
import { authContainer } from '../../di/auth.container';
import { createSession, deleteSession } from '@/src/lib/session';

const loginSchema = z.object({
    email: z.email('Correo inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
});

export type AuthUser = {
    id: string;
    name: string;
    role: string;
    permissions: string[];
};

export type LoginResult =
    | { ok: true; user: AuthUser }
    | { ok: false; message: string };

export type RegisterResult =
    | { ok: true }
    | { ok: false; message: string };

export async function loginAction(email: string, password: string): Promise<LoginResult> {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
        return { ok: false, message: parsed.error.issues[0].message };
    }

    const tokens = await authContainer.login.execute(parsed.data);

    if (!tokens) {
        return { ok: false, message: 'Credenciales inválidas' };
    }

    const payload = await createSession(tokens.accessToken);

    return {
        ok: true,
        user: {
            id: payload.sub,
            name: payload.name,
            role: payload.role,
            permissions: payload.permissions,
        },
    };
}

export async function registerAction(input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}): Promise<RegisterResult> {
    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) {
        return { ok: false, message: 'Los datos del formulario no son válidos' };
    }

    try {
        await authContainer.register.execute(parsed.data);
        return { ok: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta';
        return { ok: false, message };
    }
}

export async function logoutAction(): Promise<void> {
    await deleteSession();
}
```

Puntos clave:
- El usuario que devuelve sale **del contenido del token**. El token no sale del servidor.
- `registerAction` **no** crea sesión: crea la cuenta y el formulario manda al usuario a `/login`.
- Una Server Action es un endpoint público: cualquiera puede enviarle un POST. Por eso valida con `zod`.

### Paso 5. Marcar el contenedor y el mock como `server-only`

Agrega esta línea **al inicio** de estos dos archivos:

```ts
import 'server-only';
```

- `src/features/auth/di/auth.container.ts`
- `src/features/auth/infrastructure/datasources/auth-mock-datasource.ts`

Así, si un componente de cliente los importa, el build falla con un mensaje claro en vez de un error confuso de `node:crypto`.

### Paso 6. ViewModel: `presentation/viewmodels/auth.viewmodel.ts`

La interfaz no usa el `AuthUser` crudo: el mapper lo convierte en un ViewModel con las **iniciales** para el avatar.

```ts
import type { AuthUser } from '../actions/auth.actions';

export interface AuthUserViewModel {
    readonly id: string;
    readonly displayName: string;
    readonly role: string;
    readonly permissions: string[];
    readonly initials: string;
}

export class AuthViewModelMapper {
    static toViewModel(user: AuthUser): AuthUserViewModel {
        return {
            id: user.id,
            displayName: user.name,
            role: user.role,
            permissions: user.permissions,
            initials: AuthViewModelMapper.buildInitials(user.name),
        };
    }

    private static buildInitials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join('');
    }
}
```

`permissions` es `string[]` y no `readonly string[]` porque Immer (Redux Toolkit) quita el `readonly` del estado dentro de los reducers, y TypeScript no deja asignar un arreglo de solo lectura a uno mutable.

### Paso 7. Slice: `presentation/store/auth.slice.ts`

Los thunks dejan de llamar al contenedor y llaman a las Server Actions. Un `{ ok: false, message }` se convierte en `rejectWithValue`; un fallo inesperado (red, servidor) se atrapa con `try/catch`.

```ts
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
```

`setUser` lo usará `AuthHydrator` (paso 9). El reducer `authReducer` ya está registrado en `src/store/store.ts`.

### Paso 8. Hook fachada: `presentation/hooks/use-auth.ts`

Es lo único que conocen los componentes. `logout` ahora es asíncrono porque espera a que el servidor borre la cookie.

```ts
'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearError, loginMutation, logoutMutation, registerMutation } from '../store/auth.slice';
import type { LoginParams } from '../../domain/repositories/auth.repository';
import type { RegisterInput } from '../../domain/usecases/register.usecase';

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

    const logout = async (): Promise<void> => {
        await dispatch(logoutMutation());
    };

    const resetError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    const hasRole = (role: string): boolean => user?.role === role;

    const hasPermission = (permission: string): boolean =>
        !!user?.permissions.includes(permission);

    return {
        user,
        isAuthenticated: user !== null,
        isLoading,
        errorMessage,
        login,
        register,
        logout,
        resetError,
        hasRole,
        hasPermission,
    };
}
```

`LoginForm` y `RegisterForm` no cambian: siguen llamando a `login()` y `register()`.

### Paso 9. `presentation/components/AuthHydrator.tsx` (mantener la sesión al recargar)

Al recargar, Redux nace vacío. Este componente recibe el usuario que el servidor leyó de la cookie y lo guarda en el store. No dibuja nada.

```tsx
'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/src/store/hooks';
import { setUser } from '../store/auth.slice';
import { AuthViewModelMapper } from '../viewmodels/auth.viewmodel';
import type { AuthUser } from '../actions/auth.actions';

export function AuthHydrator({ user }: { user: AuthUser | null }) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setUser(user ? AuthViewModelMapper.toViewModel(user) : null));
    }, [dispatch, user]);

    return null;
}
```

### Paso 10. `app/layout.tsx` (leer la cookie en el servidor)

El layout pasa a ser `async`, lee la sesión con `getSession()` y le entrega **solo el usuario** (nunca el token) al hidratador.

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/src/store/StoreProvider";
import { AuthHydrator } from "@/src/features/auth/presentation/components/AuthHydrator";
import { getSession } from "@/src/lib/dal";

export const metadata: Metadata = {
    title: "GymRoutines",
    description: "Administra y consulta tus rutinas de entrenamiento.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
    const session = await getSession();
    const user = session && {
        id: session.userId,
        name: session.name,
        role: session.role,
        permissions: session.permissions,
    };

    return (
        <html
            lang="es"
            data-theme="light"
            className={`h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-base-200">
                <StoreProvider>
                    <AuthHydrator user={user} />
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
```

Como el layout raíz lee cookies, todas las rutas pasan de estáticas (`○`) a dinámicas (`ƒ`) en el resultado de `npm run build`. Es lo esperado cuando la aplicación depende de la sesión.

### Paso 11. `src/shared/components/Header.tsx` (cerrar sesión y mostrar las iniciales)

Tres cambios en el Header, que ya es `'use client'`:

1. Importar `useRouter` y `useAuth`:

```tsx
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/features/auth/presentation/hooks/use-auth';
```

2. Dentro del componente, esperar el `logout` antes de navegar:

```tsx
const router = useRouter();
const { user, logout } = useAuth();

const handleLogout = async () => {
    await logout();
    router.replace('/login');
};
```

3. Mostrar las iniciales y usar un botón en vez de un `<Link>` para cerrar sesión:

```tsx
<span>{user?.initials ?? '?'}</span>
```

```tsx
<li><button type="button" onClick={handleLogout}>Cerrar sesión</button></li>
```

Un `<Link>` navegaría de inmediato, antes de que el servidor borre la cookie. Con el botón se espera el cierre y después se navega con `replace`, para que "atrás" no regrese a una página interna.

---

## 4. Verificar

Ejecuta `npm run build` y `npm run lint`, luego `npm run dev` (puerto 3001) y prueba:

| Qué probar | Resultado esperado |
| :--- | :--- |
| Entrar con `ana@icesi.edu.co` / `123456` | Va a `/routines` y el avatar muestra **AP** |
| Recargar `/routines` | El avatar vuelve a mostrar **AP** (primero `?` un instante) |
| DevTools → Application → Cookies | Existe `session` con `HttpOnly`, `SameSite=Lax` y ~60 min de vigencia |
| Consola del navegador: `document.cookie` | Devuelve vacío: JavaScript no ve la cookie |
| Entrar con `admin@icesi.edu.co` / `admin123` | Avatar **AI**. Decodifica la cookie en jwt.io para ver `role: "ADMIN"` y los `permissions` |
| Contraseña incorrecta | "Credenciales inválidas" y no se crea cookie |
| Correo mal formado | "Correo inválido" |
| Contraseña de menos de 6 caracteres | "La contraseña debe tener al menos 6 caracteres" |
| Registrar una cuenta nueva | Va a `/login` **sin** crear sesión; luego se puede entrar con ella |
| Cerrar sesión | Va a `/login` y la cookie desaparece |

---

## 5. Límites conocidos

- **El avatar parpadea al recargar.** Muestra `?` hasta que `AuthHydrator` llena el store, porque los efectos corren después de pintar. La solución es pasar el usuario como estado inicial del store en `StoreProvider`; aquí no se aplica a propósito.
- **Rutas sin protección.** Se puede abrir `/routines` escribiendo la URL sin haber iniciado sesión: se verá con avatar `?`. Es la siguiente clase.
- **Las rutinas no se reinician al cambiar de usuario.** La lista queda en el store hasta recargar. Con un backend por usuario habría que limpiarla.
- **Solo para clase.** El secreto del mock y las contraseñas en texto plano nunca deben usarse así en un backend real, que guarda un hash y no tiene su clave en el código.

---

## 6. Siguiente clase: protección de rutas

- `requireSession()` en el DAL: redirige a `/login` si no hay sesión.
- `proxy.ts`: primera barrera, antes de renderizar.
- Cada Server Action exige su propia sesión.
- Usar `hasRole` y `hasPermission` para mostrar u ocultar elementos de la interfaz.
- Manejo de errores con `error.tsx`.

---

## Comandos

```bash
npm install
npm run dev     # http://localhost:3001
npm run build
npm run lint
```
