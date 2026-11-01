'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavLinkProps {
    href: string;
    children: ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={isActive ? 'menu-active' : undefined}
            aria-current={isActive ? 'page' : undefined}
        >
            {children}
        </Link>
    );
}
