'use client';

import { useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const emailInvalid = submitted && email.trim() === '';
    const passwordInvalid = submitted && password.trim() === '';
    const hasError = emailInvalid || passwordInvalid;

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        if (email.trim() === '' || password.trim() === '') {
            return;
        }

        router.replace('/routines');
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
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        className={`input w-full ${emailInvalid ? 'input-error' : ''}`}
                    />

                    <legend className="fieldset-legend">Contraseña</legend>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        autoComplete="current-password"
                        className={`input w-full ${passwordInvalid ? 'input-error' : ''}`}
                    />

                    {hasError && (
                        <p role="alert" className="label text-error">
                            Completa el correo y la contraseña.
                        </p>
                    )}
                </fieldset>

                <button type="submit" className="btn btn-primary w-full mt-2">
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
