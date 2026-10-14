export type RealtimeEventType =
  | "TRANSACTION_CREATED"
  | "TRANSACTION_UPDATED"
  | "TRANSACTION_DELETED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_RESOLVED"
  | "THEME_CHANGED"
  | "DATE_POLICY_CHANGED"
  | "BUDGET_UPDATED"
  | "WALLET_UPDATED";

export interface RealtimeEvent {
  type: RealtimeEventType;
  workspaceId: string;
  actorId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export class RealtimeService {
  private subscribers: Map<string, Set<(event: RealtimeEvent) => void>> =
    new Map();

  /**
   * Subscribe a listener function to events for a specific workspace.
   * Returns an unsubscribe function.
   */
  subscribe(
    workspaceId: string,
    listener: (event: RealtimeEvent) => void,
  ): () => void {
    let listeners = this.subscribers.get(workspaceId);
    if (!listeners) {
      listeners = new Set();
      this.subscribers.set(workspaceId, listeners);
    }
    listeners.add(listener);

    return () => {
      const current = this.subscribers.get(workspaceId);
      if (current) {
        current.delete(listener);
        if (current.size === 0) {
          this.subscribers.delete(workspaceId);
        }
      }
    };
  }

  /**
   * Broadcast an event to all connected clients in the workspace.
   */
  emit(
    workspaceId: string,
    payload: {
      type: RealtimeEventType;
      actorId?: string;
      data?: Record<string, unknown>;
    },
  ): void {
    const listeners = this.subscribers.get(workspaceId);
    if (!listeners || listeners.size === 0) return;

    const fullEvent: RealtimeEvent = {
      ...payload,
      workspaceId,
      timestamp: new Date().toISOString(),
    };

    for (const listener of listeners) {
      try {
        listener(fullEvent);
      } catch {
        // Safe execution, ignore broken listener
      }
    }
  }

  /**
   * Get active connection count for a workspace (useful for monitoring/testing).
   */
  getActiveSubscriberCount(workspaceId: string): number {
    return this.subscribers.get(workspaceId)?.size ?? 0;
  }
}

export const realtimeService = new RealtimeService();

