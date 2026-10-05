import Link from "next/link";

export default function FileStructurePage() {
    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold">Página Principal: File Structure</h1>
            <p className="text-gray-600">Prueba acceder a rutas dinámicas con un path variable:</p>

            <div className="flex gap-2 text-black">
                <Link
                    href="/sandbox/file-structure/1"
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Item 1
                </Link>
                <Link
                    href="/sandbox/file-structure/2"
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Item 2
                </Link>
                <Link
                    href="/sandbox/file-structure/3"
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Item 3
                </Link>
            </div>
        </div>
    );
}
