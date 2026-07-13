# Advanced Modular Architecture Blueprint: Monorepo Topology & Go-WASM Path

This blueprint defines our long-term modular architecture, package topology, and the compilation pipeline to run the Go Core deterministically inside the browser via WebAssembly (WASM).

---

## 1. Monorepo Module Topology

To keep calculations fast and isolated, we organize the monorepo into decoupled package domains:

```
                          ┌───────────────────────────┐
                          │     packages/go-core      │ (Deterministic Rules / A* Pathfinding)
                          └─────────────┬─────────────┘
                                        │
                                        ▼ (REST API or WASM)
┌───────────────────────────┐     ┌─────┴─────────────┐
│      packages/client      │◄────┤  packages/shared  │ (TypeScript Models / Fallback Math)
│ (React 3D / Board Editor) │     └─────┬─────────────┘
└───────────────────────────┘           │
                                        ▼
                          ┌─────────────┴─────────────┐
                          │      packages/server      │ (Turn State Machine / SQLite Sync)
                          └───────────────────────────┘
```

### Module Roles & Interfaces:
1.  **`packages/go-core` (Go Engine)**: The single source of truth for grid logic and hazard metrics. Decoupled from TypeScript runtime.
2.  **`packages/shared` (TypeScript Bridge)**: Defines typescript interfaces (e.g. `HexNode`, `Thread`) and exports the `GoCoreMediator` to communicate with the Go Core.
3.  **`packages/server` (Express CMS)**: Orchestrates match sessions, persists templates to SQLite database, and schedules waves.
4.  **`packages/client` (R3F Canvas)**: Controls WebGL canvas rendering, camera matrix lerps, and hosts the visual `SovereignBoardComposer` dashboard.

---

## 2. Advanced Go Core WebAssembly (WASM) Compilation Path

To enable offline execution and zero-latency client-side calculations, we compile the Go Core into a WASM module running directly in the browser's worker threads.

### Step A: Go WASM Entry Point Setup
We expose Go functions to the global JS context using Go's `syscall/js` library:

```go
// packages/go-core/wasm/main.go
package main

import (
	"syscall/js"
	"dusan-game/go-core/engine"
)

// SolvePhysicsCostWASM bridges Go solver to JS runtime
func SolvePhysicsCostWASM(this js.Value, args []js.Value) interface{} {
	baseCost := args[0].Int()
	metaId := args[1].Int()
	hexId := args[2].Int()

	// Run Go engine solver
	cost := engine.CalculateCost(baseCost, metaId, hexId)
	return js.ValueOf(cost)
}

func main() {
	c := make(chan struct{}, 0)
	// Register Go function in JavaScript namespace
	js.Global().Set("solvePhysicsCostGo", js.FuncOf(SolvePhysicsCostWASM))
	<-c
}
```

### Step B: Compile Target Commands
We compile the Go module targeting the browser runtime using:
```bash
GOOS=js GOARCH=wasm go build -o packages/client/public/go_core.wasm packages/go-core/wasm/main.go
```

### Step C: Client-Side WASM Loader
The browser loads and initializes the WASM module inside a React hook:

```javascript
// packages/client/src/hooks/useGoWasm.js
import { useState, useEffect } from 'react';

export function useGoWasm() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const go = new window.Go(); // Instantiated from wasm_exec.js
        WebAssembly.instantiateStreaming(
            fetch("/go_core.wasm"), 
            go.importObject
        ).then((result) => {
            go.run(result.instance);
            setIsLoaded(true);
            console.log("[WASM] Go Core compiled math online");
        }).catch(err => {
            console.error("[WASM] Failed to load Go Core WASM:", err);
        });
    }, []);

    return isLoaded;
}
```

---

## 3. Reinterpretation Flow & Fallback Safety

When client requests are processed:
1.  **Online Mode**: The client calls `/api/go/pathfind` (proxied via `vercel.json` edge routing).
2.  **Edge Mode (Local WASM)**: If WASM is initialized, the client runs `window.solvePhysicsCostGo(baseCost, meta, hex)` directly in-browser.
3.  **Offline Fallback Mode**: If the backend is unreachable and WASM is loading, the client uses `GoCoreMediator`'s local TypeScript equations, preventing any UI freeze or crash.
