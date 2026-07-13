// packages/client/self-hosted-router.js
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
