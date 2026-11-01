import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/src/store/StoreProvider";
import { AuthHydrator } from "@/src/features/auth/presentation/components/AuthHydrator";
import { getSession } from "@/src/lib/dal";

export const metadata: Metadata = {
    title: "GymRoutines",
    description: "Administra y consulta tus rutinas de entrenamiento.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
    const session = await getSession();
    const user = session && {
        id: session.userId,
        name: session.name,
        role: session.role,
        permissions: session.permissions,
    };

    return (
        <html
            lang="es"
            data-theme="light"
            className={`h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-base-200">
                <StoreProvider>
                    <AuthHydrator user={user} />
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
