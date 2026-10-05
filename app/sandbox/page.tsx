import { ClientComponent } from "./_components/ClientComponent";
import { ServerComponent } from "./_components/ServerComponent";

export default function SandboxPage() {
    return (
        <main className="p-8 font-sans max-w-xl mx-auto space-y-6 text-black">
            <h1 className="text-2xl font-bold">Sandbox</h1>
            <p className="text-gray-600">Comparación simple de componentes:</p>

            <div className="space-y-4">
                <ClientComponent />
                <ServerComponent />
            </div>
        </main>
    );
}
