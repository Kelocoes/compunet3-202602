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
