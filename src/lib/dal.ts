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
