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
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        expires: new Date(payload.exp * 1000),  
        path: '/',
    });

    return payload;
}

export async function deleteSession(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
}