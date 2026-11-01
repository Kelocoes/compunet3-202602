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
        httpOnly: true,// JavaScript del navegador no puede leer la cookie (protege contra XSS)
        secure: process.env.NODE_ENV === 'production', // Solo viaja por HTTPS en producción; en desarrollo se permite http://localhost
        sameSite: 'lax',// No se envía en peticiones entre sitios, salvo al navegar con un enlace (protege contra CSRF)
        expires: new Date(payload.exp * 1000),  // exp viene en segundos y Date espera milisegundos; la cookie vence cuando vence el token
        path: '/',// La cookie se envía en todas las rutas de la aplicación
    });

    return payload;
}

export async function deleteSession(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
}
