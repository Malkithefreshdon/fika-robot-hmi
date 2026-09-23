import type { Command, LogEntry, Order, OrderOptions, RobotId, RobotState, SystemParams } from '~/types'

export interface SupervisorHandlers {
  onRobotState: (robot: RobotId, state: RobotState) => void
  onOrderUpdate: (order: Order) => void
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  onConnectionChange: (connected: boolean) => void
}

/**
 * Contract between the HMI and the process that actually runs the coffee
 * sequence. `mockBackend` implements this fully in-browser so the interface
 * can be demoed before the Python supervisor exists. `liveBackend` speaks
 * the same shape over WebSocket to the real supervisor (WP3) — swapping
 * `NUXT_PUBLIC_BACKEND_MODE=live` is the only change needed once that
 * service exists.
 */
export interface SupervisorBackend {
  connect(handlers: SupervisorHandlers): void
  disconnect(): void
  submitOrder(options: OrderOptions): Order
  /** Manual command dispatch — used by the dev/tuning screen to test the sequence step by step. */
  sendCommand(robot: RobotId, command: Command): void
  markPickedUp(orderId: string): void
  triggerFault(robot: RobotId, reason: string): void
  clearFault(): void
  updateParams(params: SystemParams): void
}
