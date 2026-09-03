# Sovereign Integration Manual: The Last Tribe (V3.0 Production Scale)

Tento manuál slúži ako technický návod a programová príručka pre implementáciu fáz A, B, C a D z Target Vision Blueprintu. Obsahuje konkrétne šablóny kódu, konfiguračné súbory a postupy.

---

## FÁZA A: Kinetická Odozva a Web Audio API (Ambient & Sound Feedback)

### 1. Inicializácia Web Audio API Syntetizátora (ambientný biomový zvuk)
V React prostredí (`packages/client/src/hooks/useArenaAudio.js`):

```javascript
export class ArenaSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.ambientOsc = null;
        this.gainNode = null;
    }

    startAmbient(biomeType) {
        if (this.ambientOsc) this.stopAmbient();

        this.ambientOsc = this.ctx.createOscillator();
        this.gainNode = this.ctx.createGain();

        // Modulácia frekvencie podľa typu biomu
        if (biomeType === 'TOXIC_SWAMP') {
            this.ambientOsc.type = 'sawtooth';
            this.ambientOsc.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2 (hĺbka a bublanie)
            this.gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);
        } else if (biomeType === 'GLACIER') {
            this.ambientOsc.type = 'sine';
            this.ambientOsc.frequency.setValueAtTime(220, this.ctx.currentTime); // A3 (studený vietor)
            this.gainNode.gain.setValueAtTime(0.02, this.ctx.currentTime);
        } else {
            this.ambientOsc.type = 'triangle';
            this.ambientOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 (les)
            this.gainNode.gain.setValueAtTime(0.03, this.ctx.currentTime);
        }

        this.ambientOsc.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
        this.ambientOsc.start();
    }

    playSpellFeedback(current, voltage) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (current < 1.0) {
            // Skrat (Spark fizzle)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.16);
        } else {
            // Dunivý úspešný zásah modulovaný napätím
            osc.type = 'sine';
            osc.frequency.setValueAtTime(55, this.ctx.currentTime); // hlboké basy
            osc.frequency.exponentialRampToValueAtTime(150 + voltage * 20, this.ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.6);
        }
    }

    stopAmbient() {
        if (this.ambientOsc) {
            this.ambientOsc.stop();
            this.ambientOsc.disconnect();
            this.ambientOsc = null;
        }
    }
}
```

### 2. Kinetický Camera Shake (chvenie kamery pri zásahu)
V React-Three-Fiber vykresľovači (`packages/client/src/components/ArenaCanvas.jsx`):

```javascript
import { useFrame } from '@react-three/fiber';
import { useState } from 'react';

export function CameraShakeController({ triggerShake, damage }) {
    const [shakeTime, setShakeTime] = useState(0);

    useFrame(({ camera }) => {
        if (triggerShake && shakeTime < 15) {
            const amplitude = damage * 0.05;
            camera.position.x += (Math.random() - 0.5) * amplitude;
            camera.position.y += (Math.random() - 0.5) * amplitude;
            setShakeTime(prev => prev + 1);
        } else if (shakeTime >= 15) {
            setShakeTime(0);
            // vrátenie kamery na stabilnú pozíciu
        }
    });

    return null;
}
```

---

## FÁZA B: PostgreSQL Ekonómika & Crafting (Meta-Progression)

### 1. PostgreSQL Databázová Schéma (Prisma Schema)
Pretrvávajúce profily, inventáre a questy:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Player {
  id           String    @id @default(uuid())
  username     String    @unique
  level        Int       @default(1)
  xp           Int       @default(0)
  mmr          Int       @default(1000)
  inventory    Json      // GIN indexované JSONB (napr. {"crystals": 5, "spores": 3})
  quests       Json      // Aktívny progres úloh
  createdAt    DateTime  @default(now())
}
```

### 2. Crafting Simulator (Syntéza vlastných kariet)
Umožňuje hráčom kombinovať nazbierané suroviny na výrobu modifikovaných inštrukcií:

```typescript
export interface CraftingRecipe {
    requiredCrystals: number;
    requiredSpores: number;
    targetCardType: string;
}

export class CraftingSimulator {
    static craftCard(playerInventory: any, recipe: CraftingRecipe): { success: boolean; newCard?: any; updatedInventory?: any } {
        const crystals = playerInventory.crystals || 0;
        const spores = playerInventory.spores || 0;

        if (crystals < recipe.requiredCrystals || spores < recipe.requiredSpores) {
            return { success: false }; // Nedostatok surovín
        }

        const updatedInventory = {
            ...playerInventory,
            crystals: crystals - recipe.requiredCrystals,
            spores: spores - recipe.requiredSpores
        };

        // Generovanie karty s jemne pozmeneným odporom/napätím (R, V)
        const statVariance = (Math.random() - 0.5) * 0.4; // +/- 0.2 odchýlka
        const newCard = {
            id: `${recipe.targetCardType}_crafted_${Date.now()}`,
            baseType: recipe.targetCardType,
            customVoltageModifier: statVariance
        };

        return {
            success: true,
            newCard,
            updatedInventory
        };
    }
}
```

---

## FÁZA C: Redis-based Matchmaking & Kubernetes pod spúšťanie (Scaling)

### 1. Redis Sorted Set pre Matchmaking
Spájanie hráčov podľa ich aktuálneho MMR:

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function joinQueue(playerId, mmr) {
    const timestamp = Date.now();
    // Uložíme hráča do sorted setu pod názvom "matchmaking_queue" s jeho MMR ako score
    await redis.zadd("matchmaking_queue", mmr, JSON.stringify({ id: playerId, enteredAt: timestamp }));
}

async function findMatchForPlayer(playerId, mmr, bracketSize = 100) {
    // Hľadáme súperov v okolí MMR +/- bracketSize
    const opponents = await redis.zrangebyscore("matchmaking_queue", mmr - bracketSize, mmr + bracketSize);
    
    for (const oppStr of opponents) {
        const opp = JSON.parse(oppStr);
        if (opp.id !== playerId) {
            // Našli sme vhodného súpera! Odstránime oboch z fronty a spárujeme
            await redis.zrem("matchmaking_queue", oppStr);
            return opp.id;
        }
    }
    return null; // Zatiaľ žiadny zápas
}
```

### 2. Spustenie Kubernetes Podu pre izolovanú arénu
V orchestrátore spúšťame samostatný microservice pre zápas (vytvára izoláciu room):

```javascript
const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

async function spawnMatchPod(matchId) {
    const pod = {
        metadata: { name: `match-room-${matchId}` },
        spec: {
            containers: [{
                name: 'sovereign-engine-instance',
                image: 'dusan-game-sovereign-engine:latest',
                env: [
                    { name: 'MATCH_ID', value: matchId },
                    { name: 'PORT', value: '3002' }
                ],
                ports: [{ containerPort: 3002 }]
            }],
            restartPolicy: 'Never'
        }
    };

    await k8sApi.createNamespacedPod('default', pod);
}
```

---

## FÁZA D: ClickHouse Big Data Telemetria & ML Balans

### 1. ClickHouse Dávkový Ingestion Telemetrie
Rýchle ukladanie trace logs z engine do ClickHouse databázy:

```typescript
import { ClickHouse } from 'clickhouse';
const clickhouse = new ClickHouse({ url: 'http://localhost:8123' });

export async function uploadTraceBatch(events: any[]) {
    // ClickHouse vyžaduje pre vysoký výkon batch vkladanie
    const rows = events.map(e => ({
        timestamp: new Date().toISOString(),
        event_type: e.type,
        player_id: e.playerId,
        card_id: e.data?.cardId || '',
        voltage: e.data?.voltage || 0.0,
        resistance: e.data?.resistance || 0.0,
        current: e.data?.current || 0.0
    }));

    await clickhouse.insert('INSERT INTO telemetry_events', rows).toPromise();
}
```

### 2. Python K-Means Clustering pre automatický balans kariet (`balance_analyzer.py`)
Tento skript načíta ClickHouse dáta, rozradí karty a odhalí "overpowered" inštrukcie:

```python
import pandas as pd
from sklearn.cluster import KMeans
import json

# Načítanie telemetrie (simulované z CSV exportu)
data = pd.DataFrame({
    'card_id': ['crystal_laser', 'snake_venom', 'acid_rain', 'crystal_shield'],
    'avg_voltage': [4.5, 4.0, 5.0, 0.5],
    'avg_resistance': [1.5, 1.0, 2.0, 4.0],
    'win_rate': [0.58, 0.54, 0.62, 0.45]
})

# Použijeme clustering na rozdelenie kariet do 3 kategórií: High-Performance, Balanced, Defensive
X = data[['avg_voltage', 'avg_resistance', 'win_rate']]
kmeans = KMeans(n_clusters=3, random_state=42)
data['cluster'] = kmeans.fit_predict(X)

# Karty v clusteri s vysokým napätím a nízkym odporom a vysokým win_rate sú anomálie (OP)
op_cards = data[(data['cluster'] == 0) & (data['win_rate'] > 0.55)]

# Vygenerujeme nový konfiguračný patch pre hot-reload na serveri
adjustments = {}
for idx, row in op_cards.iterrows():
    adjustments[row['card_id']] = {
        'voltage': row['avg_voltage'] - 0.5, # Znížime silu o 0.5
        'resistance': row['avg_resistance'] + 0.5 # Zvýšime cenu/odpor o 0.5
    }

with open('rule_adjustments.json', 'w') as f:
    json.dump(adjustments, f)
print("Odporúčané balančné zmeny vygenerované do rule_adjustments.json")
```
