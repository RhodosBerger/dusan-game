# Architectural Spec: Multi-DevOps & Universal Technology Integration Pack

This specification outlines the scaling path to support multiple backend microservices (written in Go, Rust, C++, C#, or Python) using a unified serialization protocol (Protocol Buffers) and a multi-cloud DevOps orchestration pipeline.

---

## 1. Universal Communication Layer (Protocol Buffers)

To prevent rewrite overhead when introducing new technologies (e.g. C++ physics engines or Python ML agents), we replace raw JSON APIs with **gRPC and Protocol Buffers (protobuf)**. A single schema compiles to all languages:

```
                          [ protobuf schema: schema.proto ]
                                         │
       ┌──────────────────┬──────────────┼──────────────┬──────────────────┐
       ▼                  ▼              ▼              ▼                  ▼
  (TypeScript)           (Go)          (Rust)        (Python)            (C#)
  Web Client         Math Engine     WASM Solver     ML Agent        Unity Server
```

### Reference Protobuf Definition (`schema.proto`)
```protobuf
syntax = "proto3";
package dusan;

option go_package = "engine/proto";

message HexNode {
  int32 macro_index = 1;
  int32 sub_index = 2;
  string biome = 3;
  bool walkable = 4;
  float friction = 5;
  float conductivity = 6;
  float hazard_index = 7;
}

message CombatResolveRequest {
  int32 damage = 1;
  string attacker_id = 2;
  string defender_id = 3;
  int32 defender_armor = 4;
  int32 reactions_count = 5;
}

message CombatResolveResponse {
  int32 final_damage = 1;
  string log = 2;
}

service GameEngineService {
  rpc ResolveCombat(CombatResolveRequest) returns (CombatResolveResponse);
}
```

---

## 2. Multi-Technology WebAssembly (WASM) Bridge

To orchestrate WASM modules compiled from different languages (Go, Rust, C++) inside the TypeScript frontend, we implement a **Universal WASM Loader**:

```javascript
// packages/client/src/utils/UniversalWasmLoader.js

export class UniversalWasmLoader {
    static async loadModule(url, importObject = {}) {
        const response = await fetch(url);
        const { instance } = await WebAssembly.instantiateStreaming(response, importObject);
        return instance.exports;
    }

    /**
     * Load Go-compiled WASM using Go's JS runtime
     */
    static async loadGoWasm(url) {
        const go = new window.Go();
        const response = await fetch(url);
        const { instance } = await WebAssembly.instantiateStreaming(response, go.importObject);
        go.run(instance);
        return window; // Functions are bound to global namespace
    }

    /**
     * Load Rust-compiled WASM (wasm-bindgen)
     */
    static async loadRustWasm(url) {
        const exports = await this.loadModule(url);
        return exports; // Directly access exported Rust functions
    }
}
```

---

## 3. Multi-DevOps CI/CD Build & Deployment Matrix

To ship these microservices separately to distinct target runtimes (Vercel, AWS ECS, GCP Cloud Run, or Kubernetes), we structure our deployment pipeline into parallel, technology-specific builders:

```
                                  [ Git Push Event ]
                                           │
                                           ▼
                            [ Jenkins / GitHub Actions ]
                                           │
       ┌───────────────────────────┬───────┴───────────┬───────────────────────────┐
       ▼                           ▼                   ▼                           ▼
[ Client Builder ]          [ Go core Builder ] [ Node CMS Builder ]    [ WASM Compiler Matrix ]
   (Vite static)               (Go compiler)      (Node compilation)     (Go/Rust/C++ target)
       │                           │                   │                           │
       ▼                           ▼                   ▼                           ▼
[ Target: Vercel CDN ]      [ Target: AWS ECR ] [ Target: Docker Hub ] [ Client Static Public/ ]
```

### Multi-Cloud Registry & Deploy Script (`deploy-matrix.sh`)
This script compiles and pushes the containers to the respective registries during Jenkins build runs:

```bash
#!/bin/bash
# deploy-matrix.sh

# 1. Compile WASM payloads
GOOS=js GOARCH=wasm go build -o packages/client/public/go_core.wasm packages/go-core/wasm/main.go
# rustc --target wasm32-unknown-unknown -O packages/rust-core/src/lib.rs

# 2. Build & Tag Docker Containers
docker build -t dusangame/go-core:latest -f packages/go-core/Dockerfile .
docker build -t dusangame/node-server:latest -f packages/server/Dockerfile .
docker build -t dusangame/edge-router:latest -f Dockerfile .

# 3. Push to Registry (Docker Hub or ECR)
docker push dusangame/go-core:latest
docker push dusangame/node-server:latest
docker push dusangame/edge-router:latest

# 4. Trigger Orchestrated Container Updates (Kubernetes / ECS)
# kubectl rollout restart deployment/dusan-game-deployment
```
