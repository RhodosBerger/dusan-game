/**
 * Admin Balance Controller - Live Operations Dashboard Backend
 * 
 * Provides real-time game balance adjustments via WebSocket
 * Implements safety limits to prevent economy-breaking values
 * Supports temporary "Happy Hour" events with auto-revert
 */

import { Server } from 'socket.io';
import { EventEmitter } from 'events';

export interface BalanceConfig {
  // Combat modifiers
  playerDamageMultiplier: number;
  enemyDamageMultiplier: number;
  playerHealthMultiplier: number;
  enemyHealthMultiplier: number;
  criticalChanceBonus: number;
  
  // Economy modifiers
  dropRateMultiplier: number;
  goldFindMultiplier: number;
  xpBonusMultiplier: number;
  craftingCostReduction: number;
  
  // Spawn & AI modifiers
  enemySpawnRate: number;
  enemyAggression: number;
  legendaryDropChance: number;
  
  // Event modifiers
  eventActive: boolean;
  eventEndTime?: number;
  eventName?: string;
}

export interface SafetyLimits {
  min: number;
  max: number;
  warningThreshold: number;
}

export class AdminBalanceController extends EventEmitter {
  private io: Server;
  private currentConfig: BalanceConfig;
  private readonly defaultConfig: BalanceConfig;
  private readonly safetyLimits: Record<keyof BalanceConfig, SafetyLimits>;
  private auditLog: Array<{
    timestamp: number;
    adminId: string;
    parameter: string;
    oldValue: number | boolean;
    newValue: number | boolean;
    reason?: string;
  }>;

  constructor(io: Server) {
    super();
    this.io = io;
    this.defaultConfig = {
      playerDamageMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
      playerHealthMultiplier: 1.0,
      enemyHealthMultiplier: 1.0,
      criticalChanceBonus: 0.0,
      dropRateMultiplier: 1.0,
      goldFindMultiplier: 1.0,
      xpBonusMultiplier: 1.0,
      craftingCostReduction: 0.0,
      enemySpawnRate: 1.0,
      enemyAggression: 0.5,
      legendaryDropChance: 0.02,
      eventActive: false,
    };
    this.currentConfig = { ...this.defaultConfig };
    this.auditLog = [];
    
    // Define safety limits for each parameter
    this.safetyLimits = {
      playerDamageMultiplier: { min: 0.1, max: 5.0, warningThreshold: 3.0 },
      enemyDamageMultiplier: { min: 0.1, max: 5.0, warningThreshold: 3.0 },
      playerHealthMultiplier: { min: 0.1, max: 5.0, warningThreshold: 3.0 },
      enemyHealthMultiplier: { min: 0.1, max: 5.0, warningThreshold: 3.0 },
      criticalChanceBonus: { min: 0.0, max: 0.5, warningThreshold: 0.3 },
      dropRateMultiplier: { min: 0.1, max: 10.0, warningThreshold: 5.0 },
      goldFindMultiplier: { min: 0.1, max: 10.0, warningThreshold: 5.0 },
      xpBonusMultiplier: { min: 0.1, max: 10.0, warningThreshold: 5.0 },
      craftingCostReduction: { min: 0.0, max: 0.9, warningThreshold: 0.7 },
      enemySpawnRate: { min: 0.1, max: 5.0, warningThreshold: 3.0 },
      enemyAggression: { min: 0.0, max: 1.0, warningThreshold: 0.8 },
      legendaryDropChance: { min: 0.0, max: 0.5, warningThreshold: 0.1 },
      eventActive: { min: 0, max: 1, warningThreshold: 1 },
    };

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      // Admin authentication would go here in production
      socket.on('admin:getBalanceConfig', () => {
        socket.emit('admin:balanceConfig', this.currentConfig);
      });

      socket.on('admin:updateParameter', (data: {
        adminId: string;
        parameter: keyof BalanceConfig;
        value: number | boolean;
        duration?: number; // ms, for temporary changes
        reason?: string;
      }) => {
        const result = this.updateParameter(
          data.adminId,
          data.parameter,
          data.value,
          data.reason
        );
        
        if (result.success) {
          socket.emit('admin:updateSuccess', {
            parameter: data.parameter,
            newValue: result.newValue,
            revertedAt: data.duration ? Date.now() + data.duration : null
          });

          // Schedule auto-revert for temporary changes
          if (data.duration) {
            setTimeout(() => {
              this.revertParameter(data.adminId, data.parameter, 'Temporary event expired');
            }, data.duration);
          }
        } else {
          socket.emit('admin:updateError', {
            parameter: data.parameter,
            reason: result.error
          });
        }
      });

      socket.on('admin:startEvent', (data: {
        adminId: string;
        eventName: string;
        modifiers: Partial<BalanceConfig>;
        duration: number;
      }) => {
        this.startEvent(data.adminId, data.eventName, data.modifiers, data.duration);
      });

      socket.on('admin:endEvent', (data: { adminId: string }) => {
        this.endEvent(data.adminId);
      });

      socket.on('admin:getAuditLog', () => {
        socket.emit('admin:auditLog', this.auditLog.slice(-100));
      });

      socket.on('admin:resetToDefaults', (data: { adminId: string }) => {
        this.resetToDefaults(data.adminId);
      });
    });
  }

  public updateParameter(
    adminId: string,
    parameter: keyof BalanceConfig,
    value: number | boolean,
    reason?: string
  ): { success: boolean; newValue?: number | boolean; error?: string } {
    const limits = this.safetyLimits[parameter];
    
    if (!limits) {
      return { success: false, error: 'Unknown parameter' };
    }

    // Validate against safety limits
    if (typeof value === 'number') {
      if (value < limits.min || value > limits.max) {
        return { 
          success: false, 
          error: `Value ${value} outside safe range [${limits.min}, ${limits.max}]` 
        };
      }
    }

    const oldValue = this.currentConfig[parameter];
    this.currentConfig[parameter] = value;

    // Log the change
    this.auditLog.push({
      timestamp: Date.now(),
      adminId,
      parameter,
      oldValue,
      newValue: value,
      reason
    });

    // Emit to all connected clients
    this.io.emit('game:balanceUpdate', {
      parameter,
      value,
      timestamp: Date.now()
    });

    // Emit warning if threshold exceeded
    if (typeof value === 'number' && value >= limits.warningThreshold) {
      this.io.emit('admin:warning', {
        parameter,
        value,
        message: `Parameter ${parameter} exceeds warning threshold (${limits.warningThreshold})`
      });
    }

    this.emit('parameterChanged', { parameter, oldValue, newValue: value, adminId });

    return { success: true, newValue: value };
  }

  public revertParameter(
    adminId: string,
    parameter: keyof BalanceConfig,
    reason?: string
  ): void {
    const defaultValue = this.defaultConfig[parameter];
    this.updateParameter(adminId, parameter, defaultValue, reason);
  }

  public startEvent(
    adminId: string,
    eventName: string,
    modifiers: Partial<BalanceConfig>,
    duration: number
  ): void {
    // Apply all modifiers
    Object.entries(modifiers).forEach(([param, value]) => {
      this.updateParameter(adminId, param as keyof BalanceConfig, value, `Event: ${eventName}`);
    });

    // Mark event as active
    this.currentConfig.eventActive = true;
    this.currentConfig.eventEndTime = Date.now() + duration;
    this.currentConfig.eventName = eventName;

    this.io.emit('game:eventStarted', {
      eventName,
      endTime: this.currentConfig.eventEndTime,
      modifiers
    });

    // Schedule auto-end
    setTimeout(() => {
      this.endEvent(adminId);
    }, duration);

    this.auditLog.push({
      timestamp: Date.now(),
      adminId,
      parameter: 'eventActive',
      oldValue: false,
      newValue: true,
      reason: `Started event: ${eventName}`
    });
  }

  public endEvent(adminId: string): void {
    if (!this.currentConfig.eventActive) return;

    const eventName = this.currentConfig.eventName;
    
    // Reset event flag
    this.currentConfig.eventActive = false;
    this.currentConfig.eventEndTime = undefined;
    this.currentConfig.eventName = undefined;

    // Revert all event-related parameters to defaults
    Object.keys(this.defaultConfig).forEach((param) => {
      if (param !== 'eventActive' && param !== 'eventEndTime' && param !== 'eventName') {
        this.revertParameter(adminId, param as keyof BalanceConfig, `Event ended: ${eventName}`);
      }
    });

    this.io.emit('game:eventEnded', { eventName });

    this.auditLog.push({
      timestamp: Date.now(),
      adminId,
      parameter: 'eventActive',
      oldValue: true,
      newValue: false,
      reason: `Ended event: ${eventName}`
    });
  }

  public resetToDefaults(adminId: string): void {
    Object.keys(this.defaultConfig).forEach((param) => {
      this.revertParameter(adminId, param as keyof BalanceConfig, 'Reset to defaults');
    });

    this.io.emit('game:balanceReset', { timestamp: Date.now() });
  }

  public getCurrentConfig(): BalanceConfig {
    return { ...this.currentConfig };
  }

  public getAuditLog(limit: number = 100): Array<typeof this.auditLog[0]> {
    return this.auditLog.slice(-limit);
  }

  public simulateImpact(parameter: keyof BalanceConfig, newValue: number | boolean): {
    predictedEconomyHealth: number;
    predictedPlayerWinRate: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    // Simplified simulation - in production this would use ML models
    const currentValue = this.currentConfig[parameter];
    const change = typeof newValue === 'number' && typeof currentValue === 'number' 
      ? (newValue - currentValue) / currentValue 
      : 0;

    let predictedWinRate = 0.65; // Base 65% player win rate
    let economyHealth = 1.0;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Adjust predictions based on parameter type
    if (parameter.includes('Damage') || parameter.includes('Health')) {
      predictedWinRate += change * 0.1;
    } else if (parameter.includes('drop') || parameter.includes('gold') || parameter.includes('xp')) {
      economyHealth -= Math.abs(change) * 0.2;
      if (change > 0) predictedWinRate += change * 0.05;
    }

    // Clamp values
    predictedWinRate = Math.max(0.3, Math.min(0.9, predictedWinRate));
    economyHealth = Math.max(0.1, Math.min(1.0, economyHealth));

    // Determine risk level
    if (economyHealth < 0.5 || Math.abs(predictedWinRate - 0.65) > 0.2) {
      riskLevel = 'high';
    } else if (economyHealth < 0.7 || Math.abs(predictedWinRate - 0.65) > 0.1) {
      riskLevel = 'medium';
    }

    return {
      predictedEconomyHealth: economyHealth,
      predictedPlayerWinRate: predictedWinRate,
      riskLevel
    };
  }
}

export default AdminBalanceController;
