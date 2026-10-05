import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "File Structure Demo",
    description: "Ejemplo de convenciones de archivos y rutas en Next.js",
};

export default function FileStructureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="p-6 border-2 border-dashed border-gray-300 rounded m-4">
            <header className="mb-4 pb-2 border-b text-sm text-gray-500 font-mono">
                File Structure Layout
            </header>
            {children}
        </div>
    );
}
