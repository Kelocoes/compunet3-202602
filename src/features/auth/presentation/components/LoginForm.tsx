'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';

export function LoginForm() {
    const router = useRouter();
    const { login, isLoading, errorMessage, resetError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        resetError();
    }, [resetError]);

    const emailInvalid = submitted && email.trim() === '';
    const passwordInvalid = submitted && password === '';

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        const success = await login({ email, password });

        if (success) {
            router.replace('/routines');
        }
    };

    return (
        <div className="card bg-base-100 w-full max-w-sm shadow-md">
            <form className="card-body" onSubmit={handleSubmit} noValidate>
                <h1 className="card-title text-2xl justify-center">GymRoutines</h1>
                <p className="text-center text-base-content/70 text-sm">
                    Inicia sesión para ver tus rutinas
                </p>

                <fieldset className="fieldset">
                    <legend className="fieldset-legend">Correo</legend>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        className={`input w-full ${emailInvalid ? 'input-error' : ''}`}
                    />

                    <legend className="fieldset-legend">Contraseña</legend>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        placeholder="********"
                        autoComplete="current-password"
                        className={`input w-full ${passwordInvalid ? 'input-error' : ''}`}
                    />

                    {errorMessage && (
                        <p role="alert" className="label text-error">
                            {errorMessage}
                        </p>
                    )}
                </fieldset>

                <button type="submit" disabled={isLoading} className="btn btn-primary w-full mt-2">
                    {isLoading ? <span className="loading loading-spinner loading-sm"></span> : null}
                    Iniciar sesión
                </button>

                <p className="text-center text-sm mt-2">
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" className="link link-primary">
                        Regístrate
                    </Link>
                </p>
            </form>
        </div>
    );
}
