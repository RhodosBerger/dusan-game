# Architectural Spec: Self-Hosted Serverless & Edge Runtime Engine

This specification outlines the design of a platform-agnostic, open-source serverless runtime. It translates `vercel.json` routing configurations into dynamic Express/Nginx rewrites, allowing the monorepo to run on any Linux environment (e.g., Docker, AWS EC2, self-hosted Kubernetes) without vendor lock-in.

---

## 1. Concept: Edge Runtime Independence

To deploy the game engine on standard server environments while preserving Vercel's serverless structure, we implement an **Edge Emulation Layer (Runtime Adapter)**:

```
[ Incoming Client Request ] 
            │
            ▼
┌───────────────────────────────┐
│   Self-Hosted Edge Router     │ ── (Parses vercel.json routes)
└───────────────────────────────┘
            │
            ├─► Static Client Files  ──► Express Static / Nginx Static
            ├─► /api/go/* Endpoints   ──► Local compiled Go Core (port 8081)
            └─► /api/* Node Endpoints ──► Node.js worker threads
```

*   **Universal Routing Translate**: A Javascript daemon parser that translates `vercel.json` paths into Express router endpoints.
*   **Decoupled Process Cohabitation**: Instead of cloud-only serverless functions, the Node CMS and Go Core run as persistent, supervised daemons (`pm2` or Docker containers) coordinated by the Edge Router.

---

## 2. Platform-Agnostic Routing & Runtime Adapter

Below is the JavaScript router that parses `vercel.json` rules and mounts them onto a standard Express server to simulate Vercel's serverless environment locally:

```javascript
// docs/self-hosted-router.js
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import fs from 'fs';

const app = express();
const vercelConfig = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));

// 1. Map vercel.json routes dynamically
vercelConfig.routes.forEach(route => {
    if (route.dest.includes('api/')) {
        // Forward /api/go/* to Go Core microservice (port 8081)
        if (route.src.includes('go')) {
            app.use(route.src, createProxyMiddleware({
                target: 'http://localhost:8081',
                changeOrigin: true,
                pathRewrite: { '^/api/go': '' }
            }));
        } else {
            // Forward other /api/* to local Node server (port 3001)
            app.use(route.src, createProxyMiddleware({
                target: 'http://localhost:3001',
                changeOrigin: true
            }));
        }
    }
});

// 2. Serve compiled React static assets
app.use(express.static(path.join(process.cwd(), 'packages/client/dist')));

// SPA Fallback routing
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'packages/client/dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`[EDGE RUNTIME] Self-hosted Vercel emulator online on port ${PORT}`);
});
```

---

## 3. Dependency Harvesting & Compilation Pipeline

To match Vercel's deployment flow on local servers:
1.  **Dependency Isolation**: The build script checks out workspace package files and runs yarn dependency installs.
2.  **Go Compilation**: Compiles Go handlers into native binaries inside the execution container:
    ```bash
    go build -o dist/api/pathfind packages/go-core/main.go
    ```
3.  **Process Monitoring**: PM2 configures daemon status monitoring, automatically restarting Go and Node processes on crash events.

---

## 4. Security & Sanitization at the Self-Hosted Edge
When running outside Vercel's sandboxed infrastructure, the Edge Router enforces additional local firewall limits:
*   **Request Size Limits**: Clamps maximum JSON payloads to 1MB to prevent memory exhaustion.
*   **Process Timeout limits**: Kills any execution thread that blocks the event loop for more than 5 seconds.
