# Dušan Game

An experimental game-engine and web-game monorepo exploring procedural gameplay, a browser-based 3D client, and several backend approaches. The repository is also intended as a **learning project**: follow the code and documentation to study how a game client, real-time server, data services, and optional compute components can fit together.

> **Project status:** experimental and evolving. Some documentation describes planned or proposed architecture, not necessarily shipped or production-ready functionality. Verify each feature in the source before relying on it.

## What’s in the repository

| Area | Technologies / role | What to explore |
| --- | --- | --- |
| Browser client | React, TypeScript, Vite, Three.js, React Three Fiber | 3D rendering, component-based UI, client/server communication |
| Game server | Node.js, TypeScript, Express, Socket.IO | HTTP APIs, real-time events, server-side game state |
| Go core | Go service / computation component | A place to learn about a small service boundary and compute-intensive work |
| Data services | PostgreSQL and Redis are declared in `docker-compose.yml`; Prisma is listed for the server | Persistence, schema/client workflows, caching and service configuration |
| Laravel application | PHP / Laravel subproject | A separate backend and web-app structure to compare with the TypeScript server |
| Tests and docs | Vitest, Playwright, Markdown studies and blueprints | Testing approaches, architecture notes, and design proposals |

This is a mixed and actively changing codebase. Treat the table as an orientation guide, not a guarantee that every integration is complete. Start with the actual package manifests and source code when tracing a feature.

## Usability and accessibility framework ideas

Use this section as a practical checklist for improving the game. These are **recommendations and opportunities**, not claims that every item is already implemented.

### 1. Learnability and onboarding

- Give first-time players a short, skippable tutorial that teaches one action at a time.
- Explain controls in context; provide a persistent help page or controls overlay.
- Start with a low-pressure practice mode and let players replay tutorial steps.
- Use plain language, consistent names, examples, and clear next steps.
- Save tutorial progress and let players reset it.

### 2. Clear feedback and error recovery

- Confirm important actions with visible state changes, animation, sound, or text—without relying on sound or color alone.
- Show loading, connection, save, and error states, including what the player can do next.
- Make destructive or costly actions explicit and provide undo or confirmation where appropriate.
- Preserve recoverable progress after a disconnect or refresh; explain when an action cannot be undone.
- Keep server errors safe and useful: show a player-friendly message and log diagnostic details on the server.

### 3. Accessibility

- Aim for WCAG 2.2 AA for web UI and document any game-specific exceptions.
- Support keyboard navigation, visible focus, logical focus order, and accessible names for controls.
- Use semantic HTML and labels; ensure menus, dialogs, and status messages work with assistive technology.
- Provide scalable text, sufficient contrast, and a color-blind-friendly palette. Never encode essential meaning by color alone.
- Offer reduced-motion settings and avoid flashing effects; make camera movement and screen shake adjustable.
- Provide captions or text equivalents for important audio cues and dialogue.
- Test with screen readers, keyboard-only navigation, zoom, and automated accessibility checks; automated tools do not replace user testing.

### 4. Responsive and adaptable play

- Design for small screens, touch, mouse, and keyboard rather than shrinking a desktop-only layout.
- Keep critical controls reachable and prevent UI overlays from obscuring gameplay.
- Offer configurable input bindings and sensitivity where applicable.
- Let players adjust graphics quality and provide graceful fallbacks for limited devices.
- Preserve readable text and stable layouts across screen sizes and localization lengths.

### 5. Player control, trust, and privacy

- Explain what data is collected and why; collect only what is needed and provide opt-outs where possible.
- Avoid manipulative timers, misleading purchase prompts, or dark patterns.
- Make account, privacy, and moderation settings easy to find.
- Communicate multiplayer rules, reporting options, and community expectations.
- Keep telemetry purpose-limited and avoid sending secrets or unnecessary personal data in events and logs.

### 6. A practical usability workflow

1. Identify a player task and the audience (new player, returning player, keyboard user, etc.).
2. Write a measurable success criterion, such as completing a first match without assistance.
3. Sketch the flow and identify failure and recovery states before implementation.
4. Test a small prototype with representative players; observe rather than leading them.
5. Fix high-impact barriers first, then repeat the test.
6. Track qualitative feedback alongside metrics; do not treat engagement time alone as proof of good usability.
7. Add regression tests for important UI and game flows, including keyboard and responsive behavior.

## Backend learning guide

The repository offers several useful concepts to study. Follow the actual code and treat architecture documents as proposals unless verified in implementation.

### Suggested learning path

1. **Start with the client-server boundary.** Trace how the React client connects to the server and how a player action becomes a request or real-time event.
2. **Study the Node/TypeScript server.** Explore the Express application, Socket.IO events, validation, error handling, and the separation between transport and game rules.
3. **Follow state and persistence.** Check the Prisma schema and database access patterns, then ask which state is authoritative, how it is validated, and how reconnects are handled.
4. **Explore PostgreSQL and Redis.** The Compose file declares both services. Learn which data belongs in durable storage and which data is transient/cacheable; confirm actual usage in the source.
5. **Inspect the Go component.** Trace its entry point and the server integration to understand when a separate service is useful and what happens if it is unavailable.
6. **Compare the Laravel subproject.** Treat it as a separate application to learn Laravel conventions; do not assume it is wired into the main game server.
7. **Test and observe.** Add tests for rules and API behavior, then exercise real-time flows and failure cases such as a dropped connection or unavailable database.

### Backend concepts to practice

- HTTP routes versus persistent WebSocket connections
- Message validation, authorization, and server-authoritative game state
- Database migrations, transactions, indexes, and data lifecycle
- Caching and the difference between cache state and source-of-truth data
- Service boundaries, timeouts, health checks, and graceful degradation
- Logging, metrics, tracing, and privacy-conscious telemetry
- Unit, integration, and end-to-end testing
- Configuration via environment variables and safe secret management

## Run locally

The repository includes a Docker Compose configuration for PostgreSQL, Redis, a Go core, a server, and a client. From the repository root, you can try:

```bash
docker compose up --build
```

Then check the Compose port mappings and service logs to see what started. The configuration currently contains simple development credentials; use it **only on a trusted local machine**. Do not expose these services to the internet or reuse these credentials for deployment. Before using Compose as a reliable setup, verify that each Dockerfile, service entry point, required environment variable, and health check matches the current source.

For JavaScript/TypeScript development, the root manifest declares Node.js 18+ and npm 9+:

```bash
npm install
```

The repository’s package/workspace layout and scripts may be in transition, so inspect the package manifests and run the relevant package-level script rather than assuming every root-level command is currently wired up. For the Laravel subproject, follow `laravel_app/README.md` and its own environment setup.

## Documentation map

- [`BACKEND_RESEARCH_STUDY.md`](BACKEND_RESEARCH_STUDY.md) — backend language and architecture research
- [`GAME_STATUS.md`](GAME_STATUS.md) — status notes and known setup blockers; check whether notes are still current
- [`OPEN_SOURCE_ARCHITECTURE.md`](OPEN_SOURCE_ARCHITECTURE.md) — modular architecture proposal
- [`DOCUMENTATION.md`](DOCUMENTATION.md) and [`WALKTHROUGH.md`](WALKTHROUGH.md) — project guides
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution notes
- [`docker-compose.yml`](docker-compose.yml) — local service definitions

## Contributing

Issues and pull requests are welcome. Before making a larger change, open an issue to discuss the approach. Please include tests for behavior changes and update documentation when the setup or user experience changes. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the project’s current contribution guidance.

## License

Check the repository’s license file and the licenses for included assets and dependencies before redistributing or reusing this project. A package manifest or design document mentioning a license is not a substitute for an actual license file.
