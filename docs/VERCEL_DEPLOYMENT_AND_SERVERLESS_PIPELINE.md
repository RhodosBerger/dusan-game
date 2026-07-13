# Architectural Blueprint: Vercel Serverless Integration & Microservice Routing

This blueprint specifies the architecture to deploy the Dušan Game monorepo to Vercel, coordinating the React 3D frontend, the Node.js Express CMS, and the high-performance Go Core as isolated serverless functions.

---

## 1. Vercel Serverless Architecture Overview

To achieve seamless deployment, the monorepo is partitioned into three serverless domains managed by Vercel's orchestration layer:

```
                  ┌──► [ Static Frontend Client ] (packages/client)
                  │      Renders WebGL Canvas & CMS Editor
                  │
[ Vercel Router ] ┼──► [ Node.js Serverless Function ] (packages/server)
                  │      Handles Turn State Machine & SQLite Sync
                  │
                  └──► [ Go Serverless Functions ] (api/**/*.go)
                         Executes fast pathfinding & combat formulas
```

*   **Static Asset Caching**: The React WebGL frontend is deployed as static assets served globally from Vercel's Edge CDN.
*   **Node.js Serverless Backend**: Express endpoints are executed on-demand in Vercel's Node.js runtime, keeping connection cold-starts minimal.
*   **Go Serverless Backend**: Heavily optimized Go math solvers are compiled and executed inside Vercel's Go runtime.

---

## 2. Serverless Routing Configuration (`vercel.json`)

We route requests using a unified routing matrix in the root `vercel.json`:
*   `GET/POST /api/go/*` requests are forwarded directly to the compiled Go binaries.
*   `GET/POST /api/*` requests route to the Node CMS and turn engine.
*   All other routes default to the compiled React index page, allowing client-side routing.

---

## 3. Go Serverless Helper Function Template

Vercel compiles Go files placed inside the root `api/` directory. Here is the structure for the Go pathfinding serverless helper:

```go
// api/pathfind.go
package handler

import (
	"encoding/json"
	"net/http"
	"dusan-game/go-core/engine"
)

type PathfindRequest struct {
	Start []int `json:"start"`
	End   []int `json:"end"`
}

// Handler is the entry point for Vercel Serverless Go execution
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PathfindRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Execute Go A* pathfinding calculation
	path := engine.ComputePath(req.Start, req.End)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(path)
}
```

---

## 4. Continuous Integration & CMS Deployment Pipeline

1.  **Vercel GitHub Integration**: Push to `main` triggers a production deployment pipeline.
2.  **Yarn Workspaces Optimization**: Vercel caches the shared monorepo node modules, executing yarn compilation tasks sequentially to avoid compilation locks:
    ```bash
    yarn workspace @dusan-game/shared build && yarn workspace client build
    ```
3.  **Dynamic Environment Sync**: Serverless functions automatically fetch variables (such as SQLite location, Go core API tokens) from Vercel's encrypted environment variables store.
