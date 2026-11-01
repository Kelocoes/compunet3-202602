# GymRoutines: protección de rutas y permisos

Guía paso a paso para proteger la aplicación de rutinas (Next.js 16, Redux Toolkit y Clean Architecture) con tres capas: `proxy.ts`, el DAL y las Server Actions. Al terminar, solo se puede ver `/routines` con sesión y permiso, `/login` y `/register` redirigen si ya hay sesión, y crear una rutina exige el permiso `create_routines` también en el servidor.

- **Punto de partida:** rama `week-14/next-auth-end`, que ya tiene la sesión con JWT en una cookie `httpOnly`.
- **Resultado:** rama `week-14/next-auth-guards`.
- **Fuera de esta guía:** el uso de roles, las páginas `forbidden` y `unauthorized` (experimentales) y el manejo de errores con `error.tsx`.

---

## 1. Punto de partida

Ya existe, de la rama anterior:

| Pieza | Qué hace |
| :--- | :--- |
| `src/lib/session.ts` | Guarda, decodifica y borra la cookie `session` |
| `src/lib/dal.ts` | `getSession()`: lee la cookie en el servidor |
| `AuthHydrator` y `useAuth` | Llenan Redux con el usuario; `hasPermission` y `hasRole` leen de ahí |
| Mock de autenticación | Hace de backend y firma un JWT con `sub`, `name`, `role`, `permissions` y `exp` |

Lo que **no** existe todavía: cualquiera puede escribir `/routines` en la barra de direcciones, y las rutinas se leen y se crean desde el navegador sin comprobar permisos.

### Usuarios de prueba (los crea el mock)

| Correo | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- |
| `ana@icesi.edu.co` | `123456` | `USER` | `view_routines` |
| `admin@icesi.edu.co` | `admin123` | `ADMIN` | `view_routines`, `create_routines` |

Los permisos distintos se agregan en el paso 2. Los usuarios que se registren nacen como `USER` y viven en la memoria del servidor: se pierden al reiniciar `npm run dev`.

---

## 2. Las tres capas

Tener sesión no sirve de nada si cualquiera puede escribir `/routines` en la barra de direcciones. Proteger una ruta es decidir, **en cada petición**, si el usuario puede ver ese contenido. Una sola puerta no alcanza, así que se usan tres capas, cada una por su cuenta:

| Capa | Qué comprueba | Qué NO puede hacer |
| :--- | :--- | :--- |
| **`proxy.ts`** | Que haya un token decodificable y vigente, antes de renderizar. Es rápida y no consulta al backend. | No verifica la firma. Es un chequeo "optimista". |
| **El DAL** (`requireSession`, `requirePermission`) | Lo mismo, pero **junto a la página o al dato**, y además comprueba el permiso. | No verifica la firma. La decisión final es del backend. |
| **Cada Server Action** | Que quien la llama tenga sesión y el permiso, por su cuenta. | No hereda lo que comprueba la página que la usa. |

Una Server Action es un endpoint público: alguien puede enviarle un POST sin pasar por la interfaz. Por eso **cada acción exige su permiso**, aunque el proxy y la página ya lo hayan hecho.

Esta parte usa **permisos**, no roles. El token sigue llevando `role`, pero ningún guardia lo usa.

---

## 3. Paso a paso

### Paso 1. `src/lib/token.ts` (separar lo que no depende del servidor)

El proxy necesita decodificar el token y saber cómo se llama la cookie, igual que `session.ts` y `dal.ts`. Pero `session.ts` tiene `server-only` y `next/headers`. Para que el proxy no dependa de eso, saca `SESSION_COOKIE`, `TokenPayload` y `decodeToken` a un archivo puro:

```ts
import { jwtDecode } from 'jwt-decode';

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
```

Luego `session.ts` deja de definir eso y lo importa. Solo conserva `createSession` y `deleteSession`:

```ts
import 'server-only';
import { cookies } from 'next/headers';
import { decodeToken, SESSION_COOKIE, type TokenPayload } from './token';
```

Y en `dal.ts` cambia el import de la primera línea relevante:

```ts
import { decodeToken, SESSION_COOKIE } from './token';
```

### Paso 2. Mock: permisos distintos por usuario

En `auth-mock-datasource.ts` reemplaza la constante de permisos por dos, para que haya una diferencia que se pueda ver:

```ts
const USER_PERMISSIONS = ['view_routines'];
const ADMIN_PERMISSIONS = ['view_routines', 'create_routines'];
```

Y úsalas en los usuarios semilla y en el registro:

```ts
// Ana (USER) y los usuarios que se registran
permissions: [...USER_PERMISSIONS],

// Admin Icesi (ADMIN)
permissions: [...ADMIN_PERMISSIONS],
```

Como el token se firma al iniciar sesión, **hay que cerrar sesión y volver a entrar** para que una cookie vieja adopte los permisos nuevos.

### Paso 3. DAL: `requireSession` y `requirePermission`

Agrega dos funciones a `src/lib/dal.ts`, debajo de `getSession`:

```ts
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeToken, SESSION_COOKIE } from './token';

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

export async function requireSession() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return session;
}

export async function requirePermission(permission: string) {
    const session = await requireSession();

    if (!session.permissions.includes(permission)) {
        throw new Error('No tienes permiso');
    }

    return session;
}
```

- `requireSession` redirige a `/login` si no hay sesión. Sirve donde solo importa que haya alguien.
- `requirePermission` además exige que el permiso esté en el token. Devuelve la sesión, así que puedes usarla después.
- **Simplificación a propósito:** si falta el permiso, lanza un error genérico. Next.js ofrece `forbidden()` para mostrar una página 403, pero es experimental y requiere activar `experimental.authInterrupts` en `next.config.ts`; aquí no se usa.

`hasPermission` del hook `useAuth` hace la misma comprobación en el navegador, pero para **mostrar u ocultar**. Este DAL es el que **impide**.

### Paso 4. La página de rutinas: servidor y cliente

La página actual es un componente de cliente (`'use client'`, porque usa `useRoutines`), y un componente de cliente no puede llamar al DAL: este usa `cookies()` y `server-only`. La solución es dividirla en dos:

1. Crea `src/features/routines/presentation/components/RoutinesView.tsx` con **el contenido de la página actual**, convertido en un componente (`export function RoutinesView()`) y con imports relativos (`../hooks/use-routines`, `./RoutineCard`, `./RoutineForm`).
2. Reescribe `app/(app)/routines/page.tsx` como página de **servidor**, que exige el permiso y renderiza la vista:

```tsx
import { requirePermission } from '@/src/lib/dal';
import { RoutinesView } from '@/src/features/routines/presentation/components/RoutinesView';

export default async function RoutinesPage() {
    await requirePermission('view_routines');

    return <RoutinesView />;
}
```

Sin sesión, redirige a `/login`. Sin el permiso, falla antes de dibujar nada.

### Paso 5. `proxy.ts` (primera barrera)

Crea `proxy.ts` en la **raíz** del proyecto, junto a `app/`. Next.js lo ejecuta antes de cada petición, sin que lo llames. En Next.js 16 se llama `proxy.ts` y exporta la función `proxy` (en versiones anteriores era `middleware.ts`), y corre en el runtime de Node.js.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeToken, SESSION_COOKIE } from '@/src/lib/token';

const protectedRoutes = ['/routines'];
const publicRoutes = ['/login', '/register'];

export function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtected = protectedRoutes.some((route) => path.startsWith(route));
    const isPublic = publicRoutes.includes(path);

    const payload = decodeToken(req.cookies.get(SESSION_COOKIE)?.value);

    if (isProtected && !payload) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isPublic && payload) {
        return NextResponse.redirect(new URL('/routines', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
```

- Sin sesión, `/routines` redirige a `/login`. Con sesión, `/login` y `/register` redirigen a `/routines`.
- `config.matcher` le dice en qué peticiones correr. Sin él correría en todas, incluidos los archivos estáticos; este patrón es el de la documentación de Next.js y los excluye.
- Usa `token.ts` y no `session.ts`, por lo que explicamos en el paso 1.
- **Las Server Actions son un POST a la ruta donde se usan.** Si el matcher excluyera esa ruta, el proxy tampoco las revisaría. Por eso no basta con él: cada acción verifica por su cuenta (paso 6).

### Paso 6. Server Actions de rutinas con permisos

Hasta ahora las rutinas se leían y se creaban desde el navegador. Para que sus permisos se comprueben en el servidor, pasan a ser Server Actions.

**a) Marca el contenedor como `server-only`** (primera línea de `src/features/routines/di/routine.container.ts`):

```ts
import 'server-only';
```

**b) Crea `src/features/routines/presentation/actions/routines.actions.ts`:**

```ts
'use server';

import { requirePermission } from '@/src/lib/dal';
import { routineContainer } from '../../di/routine.container';
import type { CreateRoutineParams } from '../../domain/repositories/routine.repository';
import { RoutineViewModelMapper, type RoutineItemViewModel } from '../viewmodels/routine.viewmodel';

export type RoutinesResult =
    | { ok: true; routines: RoutineItemViewModel[] }
    | { ok: false; message: string };

export type CreateRoutineResult =
    | { ok: true; routine: RoutineItemViewModel }
    | { ok: false; message: string };

export async function getRoutinesAction(): Promise<RoutinesResult> {
    await requirePermission('view_routines');

    try {
        const entities = await routineContainer.getRoutines.execute();
        return {
            ok: true,
            routines: entities.map((entity) => RoutineViewModelMapper.toViewModel(entity)),
        };
    } catch {
        return { ok: false, message: 'Error al cargar rutinas' };
    }
}

export async function createRoutineAction(params: CreateRoutineParams): Promise<CreateRoutineResult> {
    await requirePermission('create_routines');

    try {
        const entity = await routineContainer.createRoutine.execute(params);
        return { ok: true, routine: RoutineViewModelMapper.toViewModel(entity) };
    } catch {
        return { ok: false, message: 'No se pudo crear la rutina' };
    }
}
```

`requirePermission` va **fuera** del `try/catch` a propósito: `redirect()` funciona lanzando una excepción especial, y un `catch` se la tragaría.

**c) Cambia los dos thunks de `routines.slice.ts`** para que llamen a las acciones en vez del contenedor. Quita los imports de `routineContainer` y de `RoutineViewModelMapper`, e importa las acciones:

```ts
import { createRoutineAction, getRoutinesAction } from '../actions/routines.actions';
```

```ts
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
```

Efectos que conviene explicar en clase:
- El mock de rutinas ahora vive **en el servidor**: las rutinas creadas sobreviven a recargar la página, y se pierden al reiniciar `npm run dev`.
- Es un único mock compartido por todos los usuarios.

### Paso 7. Mostrar u ocultar según permisos

En `RoutinesView.tsx`, usa `hasPermission` para dibujar el formulario de crear rutina solo a quien puede usarlo:

```tsx
import { useAuth } from '@/src/features/auth/presentation/hooks/use-auth';

export function RoutinesView() {
    const { hasPermission } = useAuth();
    const { routines, isLoading, errorMessage, createRoutine } = useRoutines();
    const canCreate = hasPermission('create_routines');

    // ...
    {canCreate && (
        <section>
            <RoutineForm onSubmit={createRoutine} isLoading={isLoading} />
        </section>
    )}
```

Ocultar mejora la experiencia, pero **no protege**: quien no tiene `create_routines` tampoco puede crear la rutina enviando el POST a mano, porque `createRoutineAction` lo rechaza en el servidor. Eso es lo que hace la diferencia entre ocultar y proteger.

---

---

## 4. Verificar

Ejecuta `npm run build` y `npm run lint`, luego `npm run dev`. En `npm run build` aparecerá `ƒ Proxy (Middleware)` junto a las rutas.

| Qué probar | Resultado esperado |
| :--- | :--- |
| Abrir `/routines` sin sesión | Redirige a `/login` (lo hace el proxy) |
| Con sesión, abrir `/login` o `/register` | Redirige a `/routines` |
| Entrar como Ana (`USER`) | Ve la lista de rutinas, pero **no** el formulario |
| Entrar como Admin (`ADMIN`) | Ve la lista y el formulario; crea una rutina con una descripción de 10 caracteres o más |
| Recargar la página como Admin | La rutina creada sigue ahí |
| Cerrar sesión y abrir `/routines` | Redirige a `/login` |

También puedes comprobar el proxy sin navegador:

```bash
curl -i http://localhost:3001/routines
```

La respuesta es `307` con `location: /login`.

---

---

## 5. Límites conocidos

- **La firma del token no se verifica.** El proxy y el DAL solo **decodifican**. Un token con forma correcta pero firma inventada pasa ambos, y nuestro backend simulado tampoco lo comprueba. En una arquitectura real, el backend verifica la firma en cada petición. Las guardias del front mejoran la experiencia y reducen trabajo; no reemplazan al backend.
- **Sin permiso, el error es genérico.** `requirePermission` lanza un `Error`, así que el usuario ve una pantalla de error y no una página 403. Es una simplificación; `forbidden()` y `unauthorized()` (experimentales) darían páginas propias.
- **Las rutinas viven en la memoria del servidor.** Son compartidas por todos los usuarios, no se reinician al cambiar de sesión y se pierden al reiniciar `npm run dev`.
- **Defecto conocido del mock de rutinas.** Al crear una rutina con una descripción de menos de 10 caracteres, el datasource guarda el registro antes de que la entidad lo valide. Desde ese momento, cargar la lista falla para todos hasta reiniciar el servidor. Se arregla validando en `CreateRoutineUseCase` antes de guardar; aquí no se aplica porque es código de la semana 12.
- **Los mensajes de las acciones de rutinas son genéricos.** El usuario no ve la causa real de un fallo de dominio, como una descripción demasiado corta.
- **El avatar y el formulario parpadean al recargar.** Aparecen después del primer render, cuando `AuthHydrator` llena el store.
- **Carga doble de rutinas en desarrollo.** `useRoutines` pide la lista dos veces en modo desarrollo por cómo evalúa su efecto.
- **`role` viaja en el token, pero no se usa.** Solo los permisos intervienen en las guardias.
- **Solo para clase.** El secreto del mock y las contraseñas en texto plano nunca deben usarse así en un backend real.



---

## Comandos

```bash
npm install
npm run dev     # http://localhost:3001
npm run build
npm run lint
```
