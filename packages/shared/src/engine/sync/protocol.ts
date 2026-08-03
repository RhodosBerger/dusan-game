/**
 * AXIOM Engine - Real-Time Synchronization Protocol
 * Final Phase: Conflict Resolution & State Management
 */

export interface SyncMessage {
  type: 'STATE_UPDATE' | 'ACTION_CONFIRM' | 'ROLLBACK' | 'SNAPSHOT';
  sequence: number;
  timestamp: number;
  payload: any;
  checksum: string;
}

export interface StateSnapshot {
  gameId: string;
  version: number;
  state: GameState;
  merkleRoot: string;
  createdAt: number;
}

export interface GameState {
  version: number;
  players: PlayerState[];
  board: BoardState;
  turn: number;
  timestamp: number;
}

export interface PlayerState {
  id: string;
  position: Position;
  health: number;
  mana: number;
  cards: string[];
  actions: Action[];
}

export interface Position {
  x: number;
  y: number;
}

export interface BoardState {
  cells: CellState[];
  width: number;
  height: number;
}

export interface CellState {
  x: number;
  y: number;
  terrain: string;
  units: string[];
  effects: Effect[];
}

export interface Effect {
  id: string;
  type: string;
  duration: number;
  value: number;
}

export interface Action {
  id: string;
  type: string;
  playerId: string;
  targetId?: string;
  parameters: Record<string, any>;
  sequence: number;
}

export interface PendingAction {
  action: Action;
  sequence: number;
  submittedAt: number;
  confirmed: boolean;
}

export interface ActionResult {
  success: boolean;
  actionId: string;
  newState?: GameState;
  error?: string;
}

export class SyncEngine {
  private pendingActions: Map<number, PendingAction>;
  private confirmedSequence: number;
  private snapshotInterval: number;
  private localState: GameState | null;
  private snapshots: Map<number, StateSnapshot>;

  constructor(snapshotIntervalMs: number = 5000) {
    this.pendingActions = new Map();
    this.confirmedSequence = 0;
    this.snapshotInterval = snapshotIntervalMs;
    this.localState = null;
    this.snapshots = new Map();
  }

  /**
   * Submit an action to the server
   */
  async submitAction(action: Action): Promise<void> {
    const sequence = this.confirmedSequence + this.pendingActions.size + 1;
    action.sequence = sequence;

    const pending: PendingAction = {
      action,
      sequence,
      submittedAt: Date.now(),
      confirmed: false
    };

    this.pendingActions.set(sequence, pending);

    // Optimistic update
    this.applyActionOptimistically(action);

    // Send to server (implementation depends on transport layer)
    await this.sendToServer({
      type: 'STATE_UPDATE',
      sequence,
      timestamp: Date.now(),
      payload: action,
      checksum: this.calculateChecksum(action)
    });
  }

  /**
   * Receive update from server
   */
  async receiveUpdate(update: SyncMessage): Promise<void> {
    switch (update.type) {
      case 'ACTION_CONFIRM':
        this.handleActionConfirm(update);
        break;
      case 'ROLLBACK':
        this.handleRollback(update);
        break;
      case 'SNAPSHOT':
        this.handleSnapshot(update);
        break;
      case 'STATE_UPDATE':
        this.handleStateUpdate(update);
        break;
    }
  }

  /**
   * Request a specific state snapshot
   */
  async requestSnapshot(version: number): Promise<StateSnapshot> {
    if (this.snapshots.has(version)) {
      return this.snapshots.get(version)!;
    }

    // Request from server
    const snapshot = await this.fetchSnapshotFromServer(version);
    this.snapshots.set(version, snapshot);
    return snapshot;
  }

  /**
   * Handle conflicting states
   */
  handleConflict(local: GameState, remote: GameState): GameState {
    // Server authority: remote state wins
    // But preserve unconfirmed local actions
    const unconfirmedActions = Array.from(this.pendingActions.values())
      .filter(p => !p.confirmed)
      .map(p => p.action);

    // Restore to remote state
    this.localState = { ...remote };

    // Re-apply unconfirmed actions
    unconfirmedActions.forEach(action => {
      this.applyActionOptimistically(action);
    });

    return this.localState;
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const json = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Apply action optimistically (before confirmation)
   */
  private applyActionOptimistically(action: Action): void {
    if (!this.localState) return;

    // Simplified optimistic application
    // Actual implementation depends on action types
    console.log(`Optimistically applying action ${action.id}`);
  }

  /**
   * Handle action confirmation from server
   */
  private handleActionConfirm(update: SyncMessage): void {
    const { sequence, payload } = update;
    const pending = this.pendingActions.get(sequence);
    
    if (pending) {
      pending.confirmed = true;
      this.pendingActions.delete(sequence);
      this.confirmedSequence = Math.max(this.confirmedSequence, sequence);
    }
  }

  /**
   * Handle rollback from server
   */
  private handleRollback(update: SyncMessage): void {
    const { payload } = update;
    const rollbackToVersion = payload.version;

    // Find snapshot at or before rollback version
    const snapshot = this.findSnapshotAtOrBefore(rollbackToVersion);
    if (snapshot) {
      this.localState = { ...snapshot.state };
      
      // Clear pending actions before rollback point
      Array.from(this.pendingActions.keys()).forEach(seq => {
        if (seq <= rollbackToVersion) {
          this.pendingActions.delete(seq);
        }
      });
    }
  }

  /**
   * Handle snapshot from server
   */
  private handleSnapshot(update: SyncMessage): void {
    const snapshot: StateSnapshot = update.payload;
    this.snapshots.set(snapshot.version, snapshot);
    
    // Update local state if newer
    if (!this.localState || snapshot.version > this.localState.version) {
      this.localState = { ...snapshot.state };
    }
  }

  /**
   * Handle state update from server
   */
  private handleStateUpdate(update: SyncMessage): void {
    const newState: GameState = update.payload;
    
    if (!this.localState || newState.version > this.localState.version) {
      this.localState = newState;
    }
  }

  /**
   * Find snapshot at or before specific version
   */
  private findSnapshotAtOrBefore(version: number): StateSnapshot | null {
    let best: StateSnapshot | null = null;
    
    this.snapshots.forEach(snapshot => {
      if (snapshot.version <= version) {
        if (!best || snapshot.version > best.version) {
          best = snapshot;
        }
      }
    });

    return best;
  }

  /**
   * Send message to server (placeholder)
   */
  private async sendToServer(message: SyncMessage): Promise<void> {
    // Implementation depends on transport (WebSocket, HTTP, etc.)
    console.log('Sending to server:', message);
  }

  /**
   * Fetch snapshot from server (placeholder)
   */
  private async fetchSnapshotFromServer(version: number): Promise<StateSnapshot> {
    // Implementation depends on API
    throw new Error('Not implemented');
  }

  /**
   * Get current local state
   */
  getLocalState(): GameState | null {
    return this.localState ? { ...this.localState } : null;
  }

  /**
   * Get pending actions count
   */
  getPendingActionsCount(): number {
    return this.pendingActions.size;
  }

  /**
   * Get confirmed sequence number
   */
  getConfirmedSequence(): number {
    return this.confirmedSequence;
  }
}
