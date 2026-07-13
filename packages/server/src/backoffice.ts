import express from 'express';
import { SovereignEngine } from './models/SovereignEngine';
import { AlgebraicActionTensor } from '@dusan-game/shared';

export function startBackoffice(engine: SovereignEngine, port: number = 3005) {
  const app = express();
  app.use(express.json());

  // API: Get live performance and governor telemetry
  app.get('/api/backoffice/telemetry', (req, res) => {
    try {
      const activeNPCs = engine.threads.filter(t => t.type === 'NPC').length;
      const loadFactor = (activeNPCs * 1.5) + (engine.actionNetwork.length * 2.0);
      const simulatedTemp = 45.0 + Math.min(40.0, loadFactor * 0.8);
      const profile = simulatedTemp > 75 ? 'THERMAL_PROTECTION' : simulatedTemp > 65 ? 'BALANCED' : 'PERFORMANCE';

      res.status(200).json({
        status: 'ONLINE',
        simulatedTemperature: Number(simulatedTemp.toFixed(1)),
        activeThreads: engine.threads.length,
        currentEntropy: engine.globalEntropy,
        performanceProfile: profile,
        systemEnergy: engine.systemEnergy,
        actionNetworkQueueLength: engine.actionNetwork.length
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API: Get live distance analysis and algebraic connection alternatives
  app.get('/api/backoffice/algebraic-map', (req, res) => {
    try {
      const activeThreads = engine.threads.filter(t => t.health > 0 && t.position && t.position.meta !== null);
      
      const distanceMatrix = activeThreads.map(t => {
        const otherThreads = activeThreads.filter(ot => ot.id !== t.id);
        const connections = otherThreads.map(ot => {
          const metaA = t.position.meta!;
          const metaB = ot.position.meta!;
          
          const coordsA = { x: metaA % 3, y: Math.floor(metaA / 3) };
          const coordsB = { x: metaB % 3, y: Math.floor(metaB / 3) };
          const dist = Math.abs(coordsA.x - coordsB.x) + Math.abs(coordsA.y - coordsB.y);

          const availableCards = t.currentBuffer || [];
          const alternatives = availableCards.map((card: any) => {
            const outcome = AlgebraicActionTensor.evaluate(t, card.id, ot.position);
            return {
              cardId: card.id,
              cardName: card.name || card.id,
              estimatedDamage: outcome.damageApplied,
              successChance: outcome.successProbability,
              displacement: outcome.displacementDistance
            };
          });

          return {
            targetId: ot.id,
            targetName: ot.name,
            metaDistance: dist,
            alternativeActions: alternatives
          };
        });

        return {
          threadId: t.id,
          threadName: t.name,
          role: t.type,
          position: t.position,
          connections
        };
      });

      res.status(200).json({
        timestamp: Date.now(),
        activeThreadsCount: activeThreads.length,
        distanceMatrix
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API: Get spawning planner queue metadata
  app.get('/api/backoffice/planner', (req, res) => {
    try {
      res.status(200).json({
        plannedSpawnsCount: engine.spawningPlanner.getPlannedEvents().length,
        queue: engine.spawningPlanner.getPlannedEvents()
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // UI Dashboard
  app.get('/', (req, res) => {
    const activeNPCs = engine.threads.filter(t => t.type === 'NPC').length;
    const loadFactor = (activeNPCs * 1.5) + (engine.actionNetwork.length * 2.0);
    const simulatedTemp = 45.0 + Math.min(40.0, loadFactor * 0.8);
    const profile = simulatedTemp > 75 ? 'THERMAL_PROTECTION' : simulatedTemp > 65 ? 'BALANCED' : 'PERFORMANCE';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sovereign Engine Backoffice Telemetry</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-color: #0b0f19;
            --card-bg: rgba(255, 255, 255, 0.03);
            --card-border: rgba(255, 255, 255, 0.08);
            --primary-glow: linear-gradient(135deg, #3b82f6, #8b5cf6);
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
          }

          body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            overflow-x: hidden;
          }

          header {
            width: 100%;
            max-width: 1200px;
            padding: 40px 20px 20px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
          }

          h1 {
            font-weight: 800;
            font-size: 2.2rem;
            margin: 0;
            background: var(--primary-glow);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .status-badge {
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--success);
            color: var(--success);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
          }

          main {
            width: 100%;
            max-width: 1200px;
            padding: 20px;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
          }

          .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(12px);
            transition: transform 0.2s, border-color 0.2s;
          }

          .card:hover {
            transform: translateY(-4px);
            border-color: rgba(255, 255, 255, 0.15);
          }

          .card h2 {
            margin-top: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-muted);
            border-bottom: 1px solid var(--card-border);
            padding-bottom: 12px;
          }

          .metric {
            font-size: 3rem;
            font-weight: 800;
            margin: 20px 0 10px 0;
            letter-spacing: -1px;
          }

          .metric-desc {
            font-size: 0.9rem;
            color: var(--text-muted);
          }

          .temp-normal { color: var(--success); }
          .temp-warning { color: var(--warning); }
          .temp-danger { color: var(--danger); }

          .grid-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 15px;
          }

          .grid-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.95rem;
          }

          .grid-key { color: var(--text-muted); }
          .grid-val { font-weight: 600; }
        </style>
      </head>
      <body>
        <header>
          <h1>Sovereign Engine Monitor</h1>
          <div class="status-badge">OS Governor Balanced: active</div>
        </header>

        <main>
          <!-- Card 1: CPU/GPU Thermal Telemetry -->
          <div class="card">
            <h2>Chipset Temperature</h2>
            <div class="metric ${simulatedTemp > 75 ? 'temp-danger' : simulatedTemp > 65 ? 'temp-warning' : 'temp-normal'}">
              ${simulatedTemp.toFixed(1)}°C
            </div>
            <div class="metric-desc">Dynamic estimation based on active combat threads</div>
          </div>

          <!-- Card 2: Performance Profile -->
          <div class="card">
            <h2>Scaling Profile</h2>
            <div class="metric" style="font-size: 2.2rem; color: #8b5cf6;">
              ${profile}
            </div>
            <div class="metric-desc">Aligned with OS schedutil scaling policy</div>
          </div>

          <!-- Card 3: Game Loop Metrics -->
          <div class="card">
            <h2>Engine Properties</h2>
            <div class="grid-info">
              <div class="grid-item">
                <span class="grid-key">Active Threads</span>
                <span class="grid-val">${engine.threads.length}</span>
              </div>
              <div class="grid-item">
                <span class="grid-key">Global Entropy</span>
                <span class="grid-val">${engine.globalEntropy}</span>
              </div>
              <span class="grid-key" style="margin-top: 10px;">Planned Spawner Queue</span>
              <div class="grid-item">
                <span class="grid-key">Pending Events</span>
                <span class="grid-val">${engine.spawningPlanner.getPlannedEvents().length} items</span>
              </div>
            </div>
          </div>

          <!-- Card 4: Combat Position & Algebraic Alternatives Parser -->
          <div class="card" style="grid-column: span 3;">
            <h2>Combat Position & Algebraic Alternatives Parser</h2>
            <div id="algebraic-parser-container" style="margin-top: 15px; max-height: 400px; overflow-y: auto;">
              <p style="color: var(--text-muted); font-size: 0.95rem;">Parsing live network configurations...</p>
            </div>
          </div>
        </main>

        <script>
          async function fetchAlgebraicMap() {
            try {
              const res = await fetch('/api/backoffice/algebraic-map');
              if (res.ok) {
                const data = await res.json();
                const container = document.getElementById('algebraic-parser-container');
                if (data.distanceMatrix.length === 0) {
                  container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem;">No active threads found in match.</p>';
                  return;
                }
                
                let html = '<div style="display: flex; flex-direction: column; gap: 20px;">';
                data.distanceMatrix.forEach(thread => {
                  html += \`
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 12px; text-align: left;">
                      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 8px; margin-bottom: 12px;">
                        <span style="font-weight: 800; font-size: 1.1rem; color: #3b82f6;">\${thread.threadName} (\${thread.role})</span>
                        <span style="font-family: monospace; background: rgba(0, 255, 204, 0.1); color: #00ffcc; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">
                          Chunk \${thread.position.meta}, Hex \${thread.position.hex}
                        </span>
                      </div>
                  \`;
                  
                  if (thread.connections.length === 0) {
                    html += '<p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">No other targets detected.</p>';
                  } else {
                    html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
                    thread.connections.forEach(conn => {
                      html += \`
                        <div style="font-size: 0.9rem; padding: 8px; border-radius: 8px; background: rgba(255, 255, 255, 0.01);">
                          <div style="display: flex; justify-content: space-between; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">
                            <span>Target: \${conn.targetName}</span>
                            <span style="color: var(--warning);">Distance: \${conn.metaDistance} Chunks</span>
                          </div>
                      \`;
                      
                      if (conn.alternativeActions.length === 0) {
                        html += '<div style="font-size: 0.8rem; color: var(--text-muted); padding-left: 10px;">No algebraic card options in hand buffer.</div>';
                      } else {
                        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; padding-left: 10px; margin-top: 6px;">';
                        conn.alternativeActions.forEach(act => {
                          html += \`
                            <div style="background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.03); padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                              <div style="font-weight: 800; color: #8b5cf6; margin-bottom: 4px;">\${act.cardName}</div>
                              <div style="display: flex; justify-content: space-between; color: var(--text-muted); margin-bottom: 2px;">
                                <span>Est. Damage:</span>
                                <span style="color: #ef4444; font-weight: bold;">\${act.estimatedDamage} HP</span>
                              </div>
                              <div style="display: flex; justify-content: space-between; color: var(--text-muted); margin-bottom: 2px;">
                                <span>Success:</span>
                                <span style="color: #10b981; font-weight: bold;">\${act.successChance}%</span>
                              </div>
                              <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                                <span>Push/Pull:</span>
                                <span style="font-weight: bold;">\${act.displacement}</span>
                              </div>
                            </div>
                          \`;
                        });
                        html += '</div>';
                      }
                      html += '</div>';
                    });
                    html += '</div>';
                  }
                  html += '</div>';
                });
                html += '</div>';
                container.innerHTML = html;
              }
            } catch (e) {
              console.error(e);
            }
          }
          
          fetchAlgebraicMap();
          setInterval(fetchAlgebraicMap, 3000);
        </script>
      </body>
      </html>
    `;
    res.status(200).send(html);
  });

  return app.listen(port, () => {
    console.log(`[BACKOFFICE SERVER] Running on http://localhost:${port}`);
  });
}
