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
