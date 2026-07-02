import { getIO } from './index.js';

/**
 * Best-effort socket.io broadcast. Centralised so every controller/
 * service emits the same way and a missing/uninitialised socket server
 * never throws into the API path. Use this for fire-and-forget
 * notifications (created/updated/deleted style events).
 *
 * @example
 *   safeEmit('doctor_created', { hospital_id: '1', doctor: { ... } });
 */
export function safeEmit(event: string, payload: unknown) {
  try {
    getIO().emit(event, payload);
  } catch (err) {
    console.warn(`[socket] emit ${event} skipped:`, (err as Error).message);
  }
}
