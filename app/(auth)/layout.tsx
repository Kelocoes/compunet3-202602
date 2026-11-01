import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main className="grid flex-1 place-items-center px-4 py-10">
            {children}
        </main>
    );
}
