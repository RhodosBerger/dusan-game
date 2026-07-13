# Architectural Blueprint: Docker & Jenkins Self-Hosted Orchestration

This document details the configuration and deployment of our self-hosted edge runtime, Node CMS, and Go Core microservices using Docker containers and automated Jenkins pipelines.

---

## 1. Multi-Container Orchestration Architecture

To deploy the game stack locally or on dedicated clouds (e.g. AWS, DigitalOcean), we containerize each microservice and run them in a unified network managed by Docker Compose:

```
[ Incoming Client Connection (Port 8080) ] 
                   │
                   ▼
┌─────────────────────────────────────────┐
│     Client Router (Express Proxy)       │
└─────────────────────────────────────────┘
         │                           │
         ▼ (Port 3001)               ▼ (Port 8081)
┌───────────────────┐       ┌───────────────────┐
│    Node CMS       │       │      Go Core      │
│ (sqlite/turn API) │       │ (physics/combat)  │
└───────────────────┘       └───────────────────┘
```

*   **Go Core Container** (`packages/go-core/Dockerfile`): Compiles the Go engine into a minimal Alpine-based container, exposing port `8081`.
*   **Node CMS Container** (`packages/server/Dockerfile`): Runs turn operations and handles SQLite writes, exposing port `3001`.
*   **Edge Router Container** (`Dockerfile`): Serves compiled React assets and proxies `/api/*` and `/api/go/*` requests to the respective service containers, exposing port `8080`.

---

## 2. Dependency Cache Layering (Rule 5 compliance)

To keep container build times fast, all Node Dockerfiles implement cache layering:
1.  Copy parent and sub-project `package.json` configurations.
2.  Execute `yarn install` to populate the Docker image dependency cache.
3.  Only copy the rest of the source code *after* dependency resolution, ensuring code changes do not trigger re-installation of dependencies.

---

## 3. Jenkins CI/CD Pipeline

The `Jenkinsfile` at the root of the project automates continuous integration:
1.  **Checkout**: Pulls code from Git.
2.  **Yarn Install**: Restores monorepo node modules using `yarn install --frozen-lockfile`.
3.  **Engine Tests**: Run the full test suite (`testEngine.ts`) to ensure 100% green compilation before build stages.
4.  **Package Build**: Builds the shared typescript library and client Vite static files.
5.  **Docker Orchestration Build**: Builds Docker containers to prepare for deployment.

---

## 4. Container Cybersecurity Safeguards

To prevent security compromises on self-hosted instances:
*   **Minimal Base Images**: Utilizing `golang:alpine` and `node:alpine` instead of full Debian images, reducing the CVE vulnerability footprint.
*   **Non-Root Execution**: In production, container tasks run under dedicated non-root users (`node` or `alpine` system users) rather than root, limiting filesystem escalation risks.
*   **Network Isolation**: The Go Core and Node CMS are not exposed to the public Internet; they only communicate internally within the Docker virtual network. The Client Edge Router serves as the single public gateway.
