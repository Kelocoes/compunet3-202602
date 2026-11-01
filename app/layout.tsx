import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/src/store/StoreProvider";

export const metadata: Metadata = {
    title: "GymRoutines",
    description: "Administra y consulta tus rutinas de entrenamiento.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="es"
            data-theme="light"
            className={`h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-base-200">
                <StoreProvider>
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
