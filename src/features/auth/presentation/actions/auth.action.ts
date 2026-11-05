"use server";

import z from "zod";
import { authContainer } from "../../di/auth.container";
import { createSession, deleteSession } from "@/src/lib/session";

const loginSchema = z.object({
    email: z.email("Correo invalido"),
    password: z.string().min(6, "Contraseña debil")
});
const registerSchema = z.object({
    name: z.email("Correo invalido"),
    email: z.email("Correo invalido"),
    password: z.string().min(6, "Contraseña debil"),
    confirmPassword: z.string().min(6, "Contraseña debil")
});

export type AuthUser = {
    id: string,
    name: string,
    role: string,
    permissions: string[],
}


export type LoginResult =
    | { ok: true; user: AuthUser }
    | { ok: false; message: string };

export type RegisterResult =
    | { ok: true }
    | { ok: false; message: string };

export async function loginAction(email: string, password: string): Promise<LoginResult> {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

    const result = await authContainer.login.execute(parsed.data); // API

    if (!result) return { ok: false, message: "Credenciales invalidas" };

    const payload = await createSession(result.accessToken); // Guardo el token jwt en cookies

    return {
        ok: true,
        user: {
            id: payload.sub,
            name: payload.name,
            role: payload.role,
            permissions: payload.permissions,
        } as AuthUser
    }
}

export async function registerAction(input: {
    name: string,
    email: string,
    password: string
    confirmPassword: string
}): Promise<RegisterResult> {
    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

    try {
        await authContainer.register.execute(parsed.data);
        return { ok: true }
    } catch {
        return { ok: false, message: "Error :/" }
    }

}

export async function logoutAction(): Promise<void> {
    await deleteSession();
}