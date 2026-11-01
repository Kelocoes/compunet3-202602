import type { ReactNode } from 'react';
import { Header } from '@/src/shared/components/Header';
import { Navbar } from '@/src/shared/components/Navbar';

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <Header />
            <Navbar />
            {children}
        </>
    );
}
