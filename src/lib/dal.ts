import 'server-only';
import { cookies } from 'next/headers';
import { forbidden, redirect } from 'next/navigation';
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
        throw new Error("No tienes permiso");
    }

    return session;
}
