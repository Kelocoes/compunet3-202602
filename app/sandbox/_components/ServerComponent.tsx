export function ServerComponent() {
    return (
        <div className="border p-4 rounded bg-green-50">
            <h2 className="font-bold text-lg mb-2">Server Component</h2>
            <p className="mb-2">Renderizado en el servidor (sin estado de React).</p>
            <button className="btn px-4 py-2 bg-green-600 text-white rounded opacity-80 cursor-default">
                Botón estático
            </button>
        </div>
    );
}
