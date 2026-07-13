# Cybersecurity & Sandboxing Specification: Go-TS Boundary Safety

This specification defines the security protocols, sanitization rules, and architectural boundaries to prevent Remote Code Execution (RCE), state tampering, and denial-of-service (DoS) attacks across the Go Core and TypeScript React bridge.

---

## 1. Threat Model & Boundary Vulnerabilities

```
[ Unsecured Frontend Client ] ──► (Malicious JSON Payload) ──┐
                                                             ▼
                                                [ TS Backend / Node.js ]
                                                             │
                                                             ▼ (HTTP/gRPC Bridge)
                                                [ Isolated Go Math Core ]
                                                             │
                                                 (Vulnerable AST Evaluation)
                                                             ▼
                                                    [ System Collapse ]
```

1.  **Remote Code Execution (RCE)**: Transmitting raw TypeScript script strings to the Go core for evaluation can lead to arbitrary code execution if the Go interpreter evaluates strings using dynamic VM instances.
2.  **Resource Exhaustion (DoS)**: Dispatching malicious pathfinding parameters (e.g. requesting a path across $10^9$ virtual coordinates) can lock the Go processor, spiking system TDP and triggering CPU thermal throttling.
3.  **State Manipulation**: Injecting negative damage values or out-of-bounds coordinates to bypass rule sets and force illegal gameplay configurations.

---

## 2. Secure Cohabitation Axioms (Security Patterns)

### Axiom 1: No Dynamic Code Evaluation (Strict Schema Typing)
The Go Core must **never** accept or run raw Javascript, TypeScript, or shell scripts. All communications must occur via strongly-typed, declarative JSON schemas that serialize only state variables:
*   *Forbidden Pattern*: Sending a string containing `if (node.walkable) { calculate(); }`.
*   *Safe Pattern*: Sending `{ "metaId": 0, "hexId": 3 }` and letting the Go engine resolve the logic using compiled, static Go functions.

### Axiom 2: Strict Struct Unmarshaling & Enum Range Validation
Before executing calculations, the Go API must validate all payload inputs against strict range thresholds:
*   **Coordinate Bounds**: Check if `macroIndex` is within the active grid bounds `[0, 8]` and `subIndex` is within `[0, 6]`.
*   **Sign Checks**: Reject any negative damage, armor, or reaction counts.
*   **Enum Sanitization**: Match string values (like Biomes or Factions) against a strict whitelist array. Reject mismatched strings.

### Axiom 3: Time-Sliced Execution Caps & Rate Limiting
To prevent resource exhaustion:
*   **Compute Budget**: Cap pathfinding searches (e.g., A* node expansion limit is set to 1024 operations max per query).
*   **Rate Limiting**: Limit API requests to `/api/physics/energy-cost` and `/api/combat/resolve` to a maximum of 30 requests per second per client to prevent TDP thermal overloads.

---

## 3. Go Reference Implementation: Secure Payload Sanitization

We define a sanitization middleware pattern in the Go engine to filter incoming requests before executing algorithms:

```go
package engine

import (
	"errors"
	"strings"
)

// Allowed Biomes Whitelist
var AllowedBiomes = map[string]bool{
	"LUSH_FOREST": true,
	"TOXIC_SWAMP": true,
	"GLACIER":     true,
	"DESERT":      true,
	"BARRENS":     true,
}

// SanitizeSolveRequest validates math solver bounds
func SanitizeSolveRequest(req SolveRequest) error {
	if req.Type != "direct" && req.Type != "inverse" && req.Type != "ohm" {
		return errors.New("invalid solver type: must be direct, inverse, or ohm")
	}

	// Prevent divide-by-zero or negative resistance injection
	if req.R != nil && *req.R < 0 {
		return errors.New("resistance R cannot be negative")
	}
	if req.I != nil && *req.I < 0 {
		return errors.New("current I cannot be negative")
	}
	return nil
}

// SanitizeCombatRequest validates combat telemetry inputs
func SanitizeCombatRequest(req CombatResolveRequest) error {
	if req.Damage < 0 || req.Damage > 1000 {
		return errors.New("damage must be positive and within game balancing caps (0-1000)")
	}
	if req.DefenderArmor < 0 {
		return errors.New("defender armor cannot be negative")
	}

	// Sanitize hero ID strings to prevent SQL or buffer injections
	if len(req.AttackerHeroId) > 64 || len(req.DefenderHeroId) > 64 {
		return errors.New("hero ID identifier length exceeded")
	}
	
	return nil
}
```
