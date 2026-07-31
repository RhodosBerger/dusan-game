// packages/shared/src/core/SovereignTaskScheduler.ts

export interface ScheduledTask {
  uid: string;
  name: string;
  estimatedDurationMs: number;
  priority: number; // 1 = Low, 2 = Medium, 3 = High
  createdTimestamp: number;
}

export class SovereignTaskScheduler {
  private static taskQueue: ScheduledTask[] = [];

  public static addTask(name: string, estimatedDurationMs: number, priority: number): ScheduledTask {
    const task: ScheduledTask = {
      uid: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      estimatedDurationMs,
      priority,
      createdTimestamp: Date.now()
    };
    this.taskQueue.push(task);
    this.sortQueue();
    return task;
  }

  public static getTasks(): ScheduledTask[] {
    return this.taskQueue;
  }

  public static popNextTask(): ScheduledTask | undefined {
    return this.taskQueue.shift();
  }

  public static removeTask(uid: string): boolean {
    const index = this.taskQueue.findIndex(t => t.uid === uid);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Sorts tasks using Shortest Job First (SJF) scheduling.
   * If durations are equal, sorts by priority descending (highest priority first).
   */
  private static sortQueue() {
    this.taskQueue.sort((a, b) => {
      if (a.estimatedDurationMs !== b.estimatedDurationMs) {
        return a.estimatedDurationMs - b.estimatedDurationMs; // Shortest job first
      }
      return b.priority - a.priority; // Highest priority first
    });
  }
}
