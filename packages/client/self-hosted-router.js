// packages/client/self-hosted-router.js
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import fs from 'fs';

const app = express();
const vercelConfig = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));

const GO_CORE_URL = process.env.GO_CORE_URL || 'http://localhost:8081';
const NODE_SERVER_URL = process.env.NODE_SERVER_URL || 'http://localhost:3001';

// 1. Map vercel.json routes dynamically
vercelConfig.routes.forEach(route => {
    // Forward /api/go/* to Go Core microservice (port 8081)
    if (route.src.includes('/api/go')) {
        app.use('/api/go', createProxyMiddleware({
            target: GO_CORE_URL,
            changeOrigin: true,
            pathRewrite: { '^/api/go': '' }
        }));
    } else if (route.src.includes('/api')) {
        // Forward other /api/* to local Node server (port 3001)
        app.use('/api', createProxyMiddleware({
            target: NODE_SERVER_URL,
            changeOrigin: true,
            pathRewrite: (path) => '/api' + path
        }));
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
