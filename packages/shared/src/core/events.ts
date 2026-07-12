// packages/shared/src/core/events.ts

export type GameEventType = 'PLAYER_MOVED' | 'ACTION_RESOLVED' | 'THERMAL_PURGE';

export interface BaseGameEvent {
  eventId: string;
  matchId: string;
  timestamp: number;
  stepIndex: number;
  type: GameEventType;
}

export interface PlayerMovedEvent extends BaseGameEvent {
  type: 'PLAYER_MOVED';
  threadId: string;
  from: { meta: number | null; hex: number | null };
  to: { meta: number | null; hex: number | null };
}

export interface ActionResolvedEvent extends BaseGameEvent {
  type: 'ACTION_RESOLVED';
  sourceId: string;
  targetId: string;
  instructionId: string;
  voltage: number;
  resistance: number;
  current: number;
  success: boolean;
  damageInflicted: number;
  heatGenerated: number;
}

export interface ThermalPurgeEvent extends BaseGameEvent {
  type: 'THERMAL_PURGE';
  deallocatedThreadId: string;
  systemHeatBefore: number;
  systemHeatAfter: number;
}

export type GameEvent = PlayerMovedEvent | ActionResolvedEvent | ThermalPurgeEvent;
