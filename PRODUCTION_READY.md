# Production readiness assessment — Dušan Game

## Current decision: NOT READY FOR PRODUCTION

This document is a code-and-product status assessment, not a feature-completion claim. It supersedes older aspirational content in this file, including the former "~95% complete" statement. Reviewed against the public repository state on 2026-11-04.

### Evidence-based status

| Area | Evidence | Assessment |
| --- | --- | --- |
| Product | Public repository describes an experimental tactical game; the code includes a React/Three.js client, TypeScript game server/shared modules, and a Go HTTP service | Active prototype/learning project; no evidence here of a stable public game service or validated release |
| CI | Latest inspected workflow run failed at `npm ci` because dependencies declared in `package.json` are missing from `package-lock.json` | Release checks are currently blocked; subsequent build/test/deploy stages are not validated |
| Toolchain | Workflow pins Go 1.22, while `packages/go-core/go.mod` specifies Go 1.26.4 | Version mismatch must be resolved and tested |
| Containers | Root Dockerfiles use Yarn commands while copying npm manifests/lockfile; Compose uses local development credentials | Builds and deployment configuration need correction and security hardening |
| Persistence | Server constructs `DatabaseSyncManager('./database.db')`; Prisma schema declares PostgreSQL; Compose also declares PostgreSQL and Redis | Persistence configuration is inconsistent; verify the active data path and migrations before relying on it |
| Telemetry | Go Core stores telemetry in process memory; coordinates are calculated from sample values in code | Prototype telemetry only; no durable analytics, real player GPS, or operational monitoring claim is justified |
| Security | Compose includes default credentials and exposes data service ports; reviewed server code contains permissive CORS configuration | Not suitable for internet-facing deployment without security review and hardening |
| License | Package metadata mentions MIT, while repository documentation notes that a root license file may be missing | Resolve repository-wide licensing before distribution |

## Release gates

Do not treat a green-looking workflow definition or a Docker image as a production release. Before release:

1. Regenerate and commit a lockfile that matches all workspace manifests; require `npm ci` to pass on a clean runner.
2. Align the Go version across `go.mod`, GitHub Actions, and Docker builds; run build, vet, and tests.
3. Make Docker builds deterministic and use one package manager consistently. Confirm every Dockerfile path and runtime command against the repository.
4. Decide whether the server uses SQLite or PostgreSQL, remove dead/conflicting configuration, and test migrations, backup, restore, and data retention.
5. Replace hard-coded/default credentials, use managed secrets, restrict CORS and network exposure, and review authentication, authorization, input limits, and rate limits.
6. Run unit, integration, and E2E tests from a clean checkout and record results. Ensure image publishing is gated on all required checks.
7. Deploy to staging, exercise health checks, observability, rollback, and recovery; define an owner and incident procedure.
8. Add/verify the root license and review dependency and asset licensing.

## Status vocabulary

- **Implemented** — code exists; this alone does not mean production validated.
- **Experimental/partial** — a prototype exists, but key reliability, security, or operational work remains.
- **Planned/unverified** — appears in a blueprint or roadmap, or has not been validated by tests/deployment.
- **Production-ready** — use this label only after release gates pass with reproducible evidence.

No production readiness percentage is reported: the repository does not currently provide evidence that supports a meaningful percentage.
