# Dušan Game Client

This package contains the browser client for Dušan Game. It is the front-end layer for the tactical hex-based game, built with React, Vite, and Three.js.

## Purpose

The client renders the game scene, handles the user interface, connects to the server via Socket.IO, and provides the presentation layer for the gameplay loop.

## Tech stack

- React
- Vite
- TypeScript
- Three.js
- @react-three/fiber
- Socket.IO client

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm test
```

## Notes

This package is part of the overall Dušan Game monorepo. It is currently an active experimental frontend and should be treated as a prototype until the project-wide CI, dependency, and deployment setup are stabilized.
