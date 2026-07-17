---
name: cross-component-logging
description: Guidelines for implementing, formatting, and verifying cross-component logs across Go Core, server, and client environments to resolve framework diagnostics.
---

# Skill: Cross-Component Logging & Verification

Use this skill when you need to add, inspect, or troubleshoot log messages in the workspace. Conforming to this logging format ensures that the DDA models, telemetry scrapers, and game monitoring scripts can parse log outputs cleanly without state side effects.

---

## 1. Implementation Guidelines

### Go (`packages/go-core/`)
When writing log output in Go, format strings using standard library `log` or `fmt` output:

```go
// Correct Go standard logging
log.Printf("[GO_CORE -> SERVER] [STATE_SYNC] A* Pathfinder solved steps | start=%s | end=%s | stepsCount=%d", startNode, endNode, len(steps))
```

### Node.js/TypeScript Server (`packages/server/`)
In TypeScript backend handlers, format using `console.log` or a telemetry logging adapter:

```typescript
// Correct TS standard logging
console.log(`[SERVER -> CLIENT_R3F] [STATE_SYNC] Tile collapsed authoritatively | chunkId=${chunkId} | blockId=${blockId} | isSunk=true`);
```

### React WebGL Client (`packages/client/`)
In client viewports, logs should only be dispatched when receiving messages from Socket.io, or when rendering frames:

```javascript
// Correct R3F client log
console.log(`[CLIENT_R3F -> SERVER] [PHYSICS] Played card cast | cardId=${cardId} | cost=${cost} | targetChunk=${chunkId}`);
```

---

## 2. Formatting Checklist

Before completing your code edits, confirm that log strings adhere to the matrix:
1. **Enclosed Brackets**: The source and target components MUST be wrapped in brackets: `[Source -> Target]`.
2. **Category Brackets**: The log category MUST be wrapped in brackets: `[Category]`.
3. **Structured Keys**: Variables must be appended using key-value pairs separated by vertical bars: `| key=value`.
4. **No Mutations**: Ensure that formatting and printing log statements does not perform state mutations or trigger secondary database writes.
