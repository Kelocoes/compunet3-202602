'use client';

import Link from 'next/link';
import { useAuth } from '@/src/features/auth/presentation/hooks/use-auth';
import { NavLink } from './NavLink';
import { NAV_ITEMS } from './nav-items';

export function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="navbar bg-base-100 shadow-sm px-4">
            <div className="flex-1 flex items-center gap-2">
                <div className="dropdown md:hidden">
                    <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost btn-square"
                        aria-label="Abrir menú"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu dropdown-content bg-base-100 rounded-box z-10 mt-3 w-48 p-2 shadow"
                    >
                        {NAV_ITEMS.map((item) => (
                            <li key={item.href}>
                                <NavLink href={item.href}>{item.label}</NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
                <span className="text-xl font-bold">GymRoutines</span>
            </div>

            <div className="dropdown dropdown-end">
                <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-ghost btn-circle avatar avatar-placeholder"
                    aria-label="Menú de usuario"
                >
                    <div className="bg-primary text-primary-content w-9 rounded-full">
                        <span>{user?.initials ?? '?'}</span>
                    </div>
                </div>
                <ul
                    tabIndex={0}
                    className="menu dropdown-content bg-base-100 rounded-box z-10 mt-3 w-44 p-2 shadow"
                >
                    <li><a>Mi perfil</a></li>
                    <li><Link href="/login" onClick={logout}>Cerrar sesión</Link></li>
                </ul>
            </div>
        </header>
    );
}
