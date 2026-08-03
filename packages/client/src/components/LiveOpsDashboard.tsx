/**
 * LiveOpsDashboard - Admin Panel pre riadenie herného balansu
 * 
 * Poskytuje interaktívne slidery pre úpravu parametrov v reálnom čase
 * Vizualizuje aktuálny stav a predikciu dopadu zmien
 */

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface BalanceConfig {
  playerDamageMultiplier: number;
  enemyDamageMultiplier: number;
  playerHealthMultiplier: number;
  enemyHealthMultiplier: number;
  criticalChanceBonus: number;
  dropRateMultiplier: number;
  goldFindMultiplier: number;
  xpBonusMultiplier: number;
  craftingCostReduction: number;
  enemySpawnRate: number;
  enemyAggression: number;
  legendaryDropChance: number;
  eventActive: boolean;
  eventEndTime?: number;
  eventName?: string;
}

interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  detectedAt: number;
  funFactorScore?: number;
}

interface SliderConfig {
  key: keyof BalanceConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  warningThreshold?: number;
}

const SLIDER_CONFIGS: SliderConfig[] = [
  { key: 'playerDamageMultiplier', label: 'Poškodenie hráča', min: 0.1, max: 5.0, step: 0.1, unit: 'x' },
  { key: 'enemyDamageMultiplier', label: 'Poškodenie nepriateľa', min: 0.1, max: 5.0, step: 0.1, unit: 'x' },
  { key: 'playerHealthMultiplier', label: 'Zdravie hráča', min: 0.1, max: 5.0, step: 0.1, unit: 'x' },
  { key: 'enemyHealthMultiplier', label: 'Zdravie nepriateľa', min: 0.1, max: 5.0, step: 0.1, unit: 'x' },
  { key: 'criticalChanceBonus', label: 'Šanca na krit', min: 0.0, max: 0.5, step: 0.01, unit: '', warningThreshold: 0.3 },
  { key: 'dropRateMultiplier', label: 'Miera dropu', min: 0.1, max: 10.0, step: 0.1, unit: 'x', warningThreshold: 5.0 },
  { key: 'goldFindMultiplier', label: 'Nájdené zlato', min: 0.1, max: 10.0, step: 0.1, unit: 'x', warningThreshold: 5.0 },
  { key: 'xpBonusMultiplier', label: 'XP bonus', min: 0.1, max: 10.0, step: 0.1, unit: 'x', warningThreshold: 5.0 },
  { key: 'craftingCostReduction', label: 'Zľava craftingu', min: 0.0, max: 0.9, step: 0.05, unit: '', warningThreshold: 0.7 },
  { key: 'enemySpawnRate', label: 'Rýchlosť spawnu', min: 0.1, max: 5.0, step: 0.1, unit: 'x' },
  { key: 'enemyAggression', label: 'Agresivita NPC', min: 0.0, max: 1.0, step: 0.05, unit: '' },
  { key: 'legendaryDropChance', label: 'Legendárny drop', min: 0.0, max: 0.5, step: 0.01, unit: '', warningThreshold: 0.1 },
];

const LiveOpsDashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [config, setConfig] = useState<BalanceConfig | null>(null);
  const [localValues, setLocalValues] = useState<Partial<BalanceConfig>>({});
  const [anomalies, setAnomalies] = useState<AnomalyPattern[]>([]);
  const [eventDuration, setEventDuration] = useState<number>(3600000); // 1 hour default
  const [eventName, setEventName] = useState<string>('');
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<{
    totalAnomalies: number;
    funAnomalies: number;
    averageFunScore: number;
    playerEngagementScore: number;
  } | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to admin server');
      newSocket.emit('admin:getBalanceConfig');
    });

    newSocket.on('admin:balanceConfig', (data: BalanceConfig) => {
      setConfig(data);
      setLocalValues({});
    });

    newSocket.on('game:balanceUpdate', (data: any) => {
      setConfig(prev => prev ? { ...prev, [data.parameter]: data.value } : null);
    });

    newSocket.on('admin:updateSuccess', (data: any) => {
      console.log('Update success:', data);
      if (data.revertedAt) {
        console.log(`Will revert at ${new Date(data.revertedAt).toLocaleString()}`);
      }
    });

    newSocket.on('admin:warning', (data: any) => {
      alert(`⚠️ Warning: ${data.message}`);
    });

    newSocket.on('admin:auditLog', (log: any[]) => {
      setAuditLog(log);
    });

    newSocket.on('anomalyDetected', (anomaly: AnomalyPattern) => {
      setAnomalies(prev => [anomaly, ...prev].slice(0, 50));
    });

    newSocket.on('funAnomalyDetected', (anomaly: AnomalyPattern) => {
      // Special notification for fun anomalies
      console.log('🎉 Fun anomaly detected!', anomaly);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch metrics periodically
  useEffect(() => {
    if (!socket) return;

    const fetchMetrics = () => {
      // In production, this would be an API call
      // For now, we'll simulate it
      setMetrics({
        totalAnomalies: anomalies.length,
        funAnomalies: anomalies.filter(a => (a.funFactorScore || 0) > 70).length,
        averageFunScore: anomalies.reduce((sum, a) => sum + (a.funFactorScore || 0), 0) / (anomalies.length || 1),
        playerEngagementScore: Math.min(100, anomalies.length * 2),
      });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [socket, anomalies]);

  const handleSliderChange = useCallback((key: keyof BalanceConfig, value: number) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const commitChange = useCallback((key: keyof BalanceConfig) => {
    if (!socket || localValues[key] === undefined) return;

    const value = localValues[key]!;
    socket.emit('admin:updateParameter', {
      adminId: 'admin-001', // In production, use real auth
      parameter: key,
      value,
      reason: 'Manual adjustment via dashboard',
    });
  }, [socket, localValues]);

  const startEvent = useCallback(() => {
    if (!socket || !eventName) return;

    const modifiers: Partial<BalanceConfig> = {};
    Object.entries(localValues).forEach(([key, value]) => {
      if (value !== undefined) {
        modifiers[key as keyof BalanceConfig] = value;
      }
    });

    socket.emit('admin:startEvent', {
      adminId: 'admin-001',
      eventName,
      modifiers,
      duration: eventDuration,
    });

    setEventName('');
    setLocalValues({});
  }, [socket, eventName, localValues, eventDuration]);

  const endEvent = useCallback(() => {
    if (!socket) return;
    socket.emit('admin:endEvent', { adminId: 'admin-001' });
  }, [socket]);

  const resetToDefaults = useCallback(() => {
    if (!socket) return;
    if (window.confirm('Are you sure you want to reset all parameters to defaults?')) {
      socket.emit('admin:resetToDefaults', { adminId: 'admin-001' });
    }
  }, [socket]);

  if (!config) {
    return <div className="loading">Connecting to server...</div>;
  }

  return (
    <div className="live-ops-dashboard">
      <header className="dashboard-header">
        <h1>🎮 Live Operations Dashboard</h1>
        <div className="status-indicators">
          <span className={`status ${socket?.connected ? 'online' : 'offline'}`}>
            {socket?.connected ? '🟢 Online' : '🔴 Offline'}
          </span>
          {config.eventActive && (
            <span className="event-active">
              🎉 Event: {config.eventName} (ends {new Date(config.eventEndTime!).toLocaleString()})
            </span>
          )}
        </div>
      </header>

      {/* Metrics Overview */}
      {metrics && (
        <section className="metrics-overview">
          <h2>📊 Real-time Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{metrics.totalAnomalies}</div>
              <div className="metric-label">Active Anomalies</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.funAnomalies}</div>
              <div className="metric-label">Fun Anomalies</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.averageFunScore.toFixed(1)}</div>
              <div className="metric-label">Avg Fun Score</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.playerEngagementScore}</div>
              <div className="metric-label">Engagement Score</div>
            </div>
          </div>
        </section>
      )}

      {/* Balance Sliders */}
      <section className="balance-controls">
        <h2>⚖️ Game Balance Controls</h2>
        <div className="sliders-grid">
          {SLIDER_CONFIGS.map(({ key, label, min, max, step, unit, warningThreshold }) => {
            const currentValue = localValues[key] ?? config[key] ?? 0;
            const isWarning = warningThreshold && currentValue >= warningThreshold;
            const hasChanges = localValues[key] !== undefined;

            return (
              <div key={key} className={`slider-container ${isWarning ? 'warning' : ''}`}>
                <label>
                  <span className="slider-label">{label}</span>
                  <span className="slider-value">
                    {typeof currentValue === 'number' ? currentValue.toFixed(step < 0.1 ? 2 : 1) : currentValue}
                    {unit}
                  </span>
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={typeof currentValue === 'number' ? currentValue : 0}
                  onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                  onMouseUp={() => commitChange(key)}
                  onTouchEnd={() => commitChange(key)}
                />
                {hasChanges && <span className="unsaved-indicator">● Unsaved</span>}
                {isWarning && <span className="warning-text">⚠️ Exceeds recommended threshold</span>}
              </div>
            );
          })}
        </div>

        {/* Event Controls */}
        <div className="event-controls">
          <h3>🎪 Start Special Event</h3>
          <div className="event-form">
            <input
              type="text"
              placeholder="Event Name (e.g., Happy Hour)"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            <select value={eventDuration} onChange={(e) => setEventDuration(Number(e.target.value))}>
              <option value={1800000}>30 minutes</option>
              <option value={3600000}>1 hour</option>
              <option value={7200000}>2 hours</option>
              <option value={14400000}>4 hours</option>
              <option value={86400000}>24 hours</option>
            </select>
            <button onClick={startEvent} disabled={!eventName}>
              🚀 Start Event
            </button>
            {config.eventActive && (
              <button onClick={endEvent} className="danger">
                ⏹️ End Event
              </button>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <button onClick={resetToDefaults} className="danger reset-button">
          🔄 Reset All to Defaults
        </button>
      </section>

      {/* Anomaly Feed */}
      <section className="anomaly-feed">
        <h2>🔍 Live Anomaly Detection</h2>
        <div className="anomaly-list">
          {anomalies.slice(0, 20).map(anomaly => (
            <div key={anomaly.id} className={`anomaly-item severity-${anomaly.severity}`}>
              <div className="anomaly-header">
                <span className="anomaly-name">{anomaly.name}</span>
                <span className="anomaly-category">{anomaly.category}</span>
                <span className="anomaly-confidence">{(anomaly.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="anomaly-description">{anomaly.description}</div>
              <div className="anomaly-meta">
                <span className="anomaly-time">
                  {new Date(anomaly.detectedAt).toLocaleTimeString()}
                </span>
                {anomaly.funFactorScore && (
                  <span className={`fun-score ${anomaly.funFactorScore > 70 ? 'high' : ''}`}>
                    🎯 Fun: {anomaly.funFactorScore}/100
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Audit Log */}
      <section className="audit-log">
        <h2>📜 Recent Changes</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Parameter</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.slice(-10).reverse().map((log, i) => (
              <tr key={i}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.parameter}</td>
                <td>{typeof log.oldValue === 'number' ? log.oldValue.toFixed(2) : String(log.oldValue)}</td>
                <td>{typeof log.newValue === 'number' ? log.newValue.toFixed(2) : String(log.newValue)}</td>
                <td>{log.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <style jsx>{`
        .live-ops-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }
        .status-indicators {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .status.online { color: #22c55e; }
        .status.offline { color: #ef4444; }
        .event-active {
          background: #fbbf24;
          color: #000;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
        }
        .metrics-overview {
          margin-bottom: 30px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }
        .metric-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .metric-value {
          font-size: 2.5em;
          font-weight: bold;
        }
        .metric-label {
          opacity: 0.9;
          margin-top: 5px;
        }
        .balance-controls {
          background: #f9fafb;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .sliders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .slider-container {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .slider-container.warning {
          border: 2px solid #f59e0b;
        }
        .slider-container label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .slider-value {
          color: #667eea;
          font-weight: bold;
        }
        input[type="range"] {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: #e0e0e0;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
        }
        .unsaved-indicator {
          color: #ef4444;
          font-size: 0.8em;
          margin-left: 10px;
        }
        .warning-text {
          color: #f59e0b;
          font-size: 0.85em;
          display: block;
          margin-top: 5px;
        }
        .event-controls {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
        }
        .event-form {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 15px;
        }
        .event-form input,
        .event-form select {
          padding: 10px 15px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1em;
        }
        .event-form button {
          padding: 10px 25px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
        }
        .event-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .danger {
          background: #ef4444 !important;
        }
        .reset-button {
          margin-top: 20px;
          width: 100%;
        }
        .anomaly-feed {
          margin-bottom: 30px;
        }
        .anomaly-list {
          display: grid;
          gap: 15px;
        }
        .anomaly-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .anomaly-item.severity-low { border-left-color: #22c55e; }
        .anomaly-item.severity-medium { border-left-color: #f59e0b; }
        .anomaly-item.severity-high { border-left-color: #ef4444; }
        .anomaly-item.severity-critical { border-left-color: #7c3aed; }
        .anomaly-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .anomaly-name {
          font-weight: bold;
          font-size: 1.1em;
        }
        .anomaly-category {
          background: #e0e7ff;
          color: #4f46e5;
          padding: 3px 10px;
          border-radius: 15px;
          font-size: 0.85em;
        }
        .anomaly-confidence {
          font-weight: bold;
          color: #6b7280;
        }
        .anomaly-description {
          color: #4b5563;
          margin-bottom: 10px;
        }
        .anomaly-meta {
          display: flex;
          gap: 15px;
          font-size: 0.85em;
          color: #9ca3af;
        }
        .fun-score.high {
          color: #22c55e;
          font-weight: bold;
        }
        .audit-log table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
        .audit-log th,
        .audit-log td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .audit-log th {
          background: #f9fafb;
          font-weight: 600;
        }
        .loading {
          text-align: center;
          padding: 50px;
          font-size: 1.2em;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default LiveOpsDashboard;
