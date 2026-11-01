'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';

export function RegisterForm() {
    const router = useRouter();
    const { register, isLoading, errorMessage, resetError } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        resetError();
    }, [resetError]);

    const nameInvalid = submitted && name.trim() === '';
    const emailInvalid = submitted && email.trim() === '';
    const passwordInvalid = submitted && password === '';
    const confirmInvalid = submitted && (confirmPassword === '' || password !== confirmPassword);

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        const success = await register({ name, email, password, confirmPassword });

        if (success) {
            router.push('/login');
        }
    };

    return (
        <div className="card bg-base-100 w-full max-w-sm shadow-md">
            <form className="card-body" onSubmit={handleSubmit} noValidate>
                <h1 className="card-title text-2xl justify-center">Crea tu cuenta</h1>

                <fieldset className="fieldset">
                    <legend className="fieldset-legend">Nombre</legend>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        placeholder="Ana Pérez"
                        autoComplete="name"
                        className={`input w-full ${nameInvalid ? 'input-error' : ''}`}
                    />

                    <legend className="fieldset-legend">Correo</legend>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        placeholder="ana@correo.com"
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
                        autoComplete="new-password"
                        className={`input w-full ${passwordInvalid ? 'input-error' : ''}`}
                    />

                    <legend className="fieldset-legend">Confirmar contraseña</legend>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        placeholder="********"
                        autoComplete="new-password"
                        className={`input w-full ${confirmInvalid ? 'input-error' : ''}`}
                    />

                    {errorMessage && (
                        <p role="alert" className="label text-error">
                            {errorMessage}
                        </p>
                    )}
                </fieldset>

                <button type="submit" disabled={isLoading} className="btn btn-primary w-full mt-2">
                    {isLoading ? <span className="loading loading-spinner loading-sm"></span> : null}
                    Crear cuenta
                </button>

                <p className="text-center text-sm mt-2">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" className="link link-primary">
                        Inicia sesión
                    </Link>
                </p>
            </form>
        </div>
    );
}
