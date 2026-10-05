import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DynamicItemPage({ params }: PageProps) {
    const { id } = await params;

    if (id === "error") {
        throw new Error("¡Error forzado para probar error.tsx!");
    }

    if (id === "404") {
        notFound();
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold">
                Página con el path variable: <span className="text-blue-600">{id}</span>
            </h1>
            <p className="text-gray-600">
                El valor capturado desde la URL es <code>{id}</code>.
            </p>

            <div>
                <Link
                    href="/sandbox/file-structure"
                    className="text-sm underline text-blue-500 hover:text-blue-700"
                >
                    ← Volver
                </Link>
            </div>
        </div>
    );
}
