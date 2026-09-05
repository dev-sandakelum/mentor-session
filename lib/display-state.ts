/**
 * In-memory display state store.
 * Shared across requests in the same server process via module-level singleton.
 * For multi-instance deployments, swap this for a Redis pub/sub channel.
 */

export type DisplayScene =
  | { type: "idle" }
  | { type: "allocation"; count: number; total: number }
  | { type: "results"; assigned: number; unmatched: number; satisfaction: number }
  | { type: "custom"; text: string; sub?: string };

export type DisplayState = {
  scene: DisplayScene;
  updatedAt: number;
};

// Module-level singleton
let current: DisplayState = { scene: { type: "idle" }, updatedAt: Date.now() };

// SSE subscriber registry
const subscribers = new Set<(state: DisplayState) => void>();

export function getDisplayState(): DisplayState {
  return current;
}

export function setDisplayState(scene: DisplayScene): DisplayState {
  current = { scene, updatedAt: Date.now() };
  // Notify all connected SSE clients
  subscribers.forEach((fn) => fn(current));
  return current;
}

export function subscribeDisplay(fn: (state: DisplayState) => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
