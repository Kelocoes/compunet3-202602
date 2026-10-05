"use client";

import { useState } from "react";

export function ClientComponent() {
    const [count, setCount] = useState(0);

    return (
        <div className="border p-4 rounded bg-blue-50">
            <h2 className="font-bold text-lg mb-2">Client Component</h2>
            <p className="mb-2">Clicks: {count}</p>
            <button
                onClick={() => setCount(count + 1)}
                className="btn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Incrementar
            </button>
        </div>
    );
}
