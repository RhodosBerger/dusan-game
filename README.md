# Dušan Game: The Last Tribe

Dušan Game is an experimental open-source tactical game project focused on hex-based arena combat, card-driven decisions, procedural world generation, and a 3D client. The repository combines a React/Three.js frontend, TypeScript game/server packages, and a Go HTTP service for simulation and telemetry experiments.

> Status: active prototype and research project. This project is not currently production-ready. The repository contains working experiments, but its CI, dependency locks, and runtime setup still need to be stabilized before a release candidate can be claimed.

[View source](https://github.com/RhodosBerger/dusan-game) · [Report issue](https://github.com/RhodosBerger/dusan-game/issues) · [Pull requests](https://github.com/RhodosBerger/dusan-game/pulls) · [Rules](RULES.md)

## Overview

The Last Tribe explores a tactical arena game where movement, card play, combat, and procedural world logic interact. It is intended both as a playable prototype and as a learning project for developers interested in:

- React + Vite game frontends
- Three.js and 3D rendering
- Socket.IO real-time communication
- TypeScript game logic and shared modules
- Go-based compute services and telemetry processing

This repository is a public experimentation space. Some roadmap and blueprint documents describe future ideas or architectural directions, but they should not be mistaken for fully implemented production features.

## What is in the codebase

- Client: `packages/client/` — React/Vite client, 3D scene, game UI, and Socket.IO interaction.
- Shared modules: `packages/shared/` — reusable TypeScript logic for game systems and procedural generation.
- Server: `packages/server/` — Express/Socket.IO server and game logic.
- Go core: `packages/go-core/` — Go HTTP service for computation and telemetry experiments.
- Laravel app: `laravel_app/` — separate Laravel/Vite implementation.
- E2E tests: `e2e/` — Playwright-based end-to-end tests.

## Current project status

The repository was reviewed on 2026-11-04. The latest inspected workflow run failed during `npm ci`, which means the dependency lockfile and package manifests are not currently consistent. That makes the current CI and deployment pipeline not yet validated.

### Known blockers

- `package.json` and `package-lock.json` are out of sync.
- CI config pins Go 1.22 while `packages/go-core/go.mod` targets Go 1.26.4.
- Dockerfiles and Compose configuration mix npm and yarn usage and include development credentials.
- The database setup is inconsistent: the server logic refers to local SQLite usage while Prisma and Compose declare PostgreSQL.
- The project includes a separate Laravel app and Go service, but their integration with the main game stack is not yet operationally proven.

These issues are evidence-based and should be resolved before any production claim is made.

## Tech stack

- Frontend: React, TypeScript, Vite, Three.js, React Three Fiber
- Game server: Node.js, TypeScript, Express, Socket.IO
- Shared logic: TypeScript
- Compute layer: Go
- Additional service: Laravel/Vite app in `laravel_app/`
- Test tooling: Vitest and Playwright

## Repository structure

| Path | Purpose |
| --- | --- |
| `packages/client/` | Game client and UI |
| `packages/shared/` | Shared game and procedural modules |
| `packages/server/` | Server-side game logic and network layer |
| `packages/go-core/` | Go microservice for calculations and telemetry |
| `laravel_app/` | Separate Laravel app |
| `e2e/` | End-to-end test suite |
| `docs/` and root design files | Architecture, roadmap, and game blueprints |

## Local setup notes

Before running the project locally, confirm the toolchain versions and dependency state. The repository currently has mismatches in package manifests, Go versioning, and container setup, so a clean install cannot yet be assumed to work.

```bash
# After lockfile and package manifests are reconciled
npm ci

# Then build the shared module and client as needed
npm run build --workspace=@dusan-game/shared
npm run build --workspace=client
```

## Documentation

- [RULES.md](RULES.md) — game rules and mechanics
- [NEW_INTEGRATION_GOALS.md](NEW_INTEGRATION_GOALS.md) — roadmap and integration goals
- [TARGET_VISION_BLUEPRINT.md](TARGET_VISION_BLUEPRINT.md) — target architecture and product vision
- [GAME_STATUS.md](GAME_STATUS.md) — historical project status notes
- [PRODUCTION_READY.md](PRODUCTION_READY.md) — current readiness assessment and release gates
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution guidelines

## Contributing

Contributions are welcome in the form of reproducible bug reports, tests, accessibility improvements, documentation updates, and small feature experiments. If you file a bug report, include your environment, exact steps to reproduce, expected behavior, actual behavior, and relevant logs without exposing secrets or credentials.

## Licensing

Before redistributing or using this project commercially, confirm the licensing of the repo, all included assets, and all third-party dependencies. The package metadata references MIT, but the root license file should be verified and kept in sync with project distribution requirements.

---

This README is intentionally written in English to keep the public-facing project description consistent across the repository and easier for contributors to understand.
