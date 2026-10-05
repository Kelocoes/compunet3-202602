"use client";

export default function Error({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            <h2 className="font-bold">¡Ocurrió un error!</h2>
            <p className="text-sm my-2">{error.message || "Error inesperado"}</p>
            <button
                onClick={() => reset()}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
                Reintentar
            </button>
        </div>
    );
}
