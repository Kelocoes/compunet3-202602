import Link from "next/link";

export default function NotFound() {
    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            <h2 className="font-bold">404 - No encontrado</h2>
            <p className="text-sm my-2">No pudimos encontrar el recurso solicitado.</p>
            <Link
                href="/sandbox/file-structure"
                className="text-sm underline text-yellow-900 font-medium"
            >
                Volver a File Structure
            </Link>
        </div>
    );
}
