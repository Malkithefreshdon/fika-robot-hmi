import type { Command, OrderOptions, RobotId, SystemParams } from '~/types'
import type { SupervisorBackend, SupervisorHandlers } from './types'

const RECONNECT_DELAY_MS = 3000

/**
 * WebSocket bridge to the real Python supervisory controller (WP3).
 *
 * Wire protocol (JSON messages, one per line):
 *
 * Supervisor → HMI
 *   { "type": "robot_state", "robot": "robotA" | "robotB", "state": "READY"|"BUSY"|"DONE"|"FAULT" }
 *   { "type": "order_update", "order": Order }
 *   { "type": "log", "level": "info"|"warn"|"error", "source": string, "message": string }
 *
 * HMI → Supervisor
 *   { "type": "submit_order", "options": OrderOptions, "requestId": string }
 *   { "type": "command", "robot": RobotId, "command": Command }
 *   { "type": "mark_picked_up", "orderId": string }
 *   { "type": "trigger_fault", "robot": RobotId, "reason": string }
 *   { "type": "clear_fault" }
 *   { "type": "update_params", "params": SystemParams }
 *
 * See docs/backend-integration-guide.docx for the full field-by-field
 * reference. This file is intentionally thin: it only translates transport
 * <-> the same `SupervisorBackend` contract the mock implements, so pages
 * and stores never need to know which backend is active.
 */
export function createLiveBackend(url: string): SupervisorBackend {
  let socket: WebSocket | null = null
  let handlers: SupervisorHandlers | null = null
  let manuallyDisconnected = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function send(payload: Record<string, unknown>) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload))
    } else {
      handlers?.onLog({ level: 'error', source: 'ws', message: 'Command ignored — supervisor not connected' })
    }
  }

  function openSocket() {
    socket = new WebSocket(url)

    socket.addEventListener('open', () => {
      handlers?.onLog({ level: 'info', source: 'ws', message: `Connected to supervisor (${url})` })
      handlers?.onConnectionChange(true)
    })

    socket.addEventListener('close', () => {
      handlers?.onConnectionChange(false)
      if (!manuallyDisconnected) {
        handlers?.onLog({ level: 'warn', source: 'ws', message: `Supervisor connection lost — retrying in ${RECONNECT_DELAY_MS / 1000}s` })
        reconnectTimer = setTimeout(openSocket, RECONNECT_DELAY_MS)
      }
    })

    socket.addEventListener('error', () => {
      handlers?.onLog({ level: 'error', source: 'ws', message: `Could not reach supervisor (${url})` })
    })

    socket.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data)
        switch (msg.type) {
          case 'robot_state':
            handlers?.onRobotState(msg.robot, msg.state)
            break
          case 'order_update':
            handlers?.onOrderUpdate(msg.order)
            break
          case 'log':
            handlers?.onLog({ level: msg.level, source: msg.source, message: msg.message })
            break
          default:
            handlers?.onLog({ level: 'warn', source: 'ws', message: `Unknown message type from supervisor: "${msg.type}"` })
        }
      } catch {
        handlers?.onLog({ level: 'warn', source: 'ws', message: 'Unreadable supervisor message ignored (not valid JSON)' })
      }
    })
  }

  return {
    connect(h) {
      handlers = h
      manuallyDisconnected = false
      openSocket()
    },

    disconnect() {
      manuallyDisconnected = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close()
      socket = null
    },

    submitOrder(options: OrderOptions) {
      const id = Math.random().toString(36).slice(2, 10)
      send({ type: 'submit_order', options, requestId: id })
      // The authoritative Order (with server-assigned ticket number) arrives
      // via the next `order_update` message; this optimistic placeholder
      // just satisfies the synchronous return type.
      return {
        id,
        ticketNumber: 0,
        options,
        stage: 'queued' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        faulted: false
      }
    },

    sendCommand(robot: RobotId, command: Command) {
      send({ type: 'command', robot, command })
    },

    markPickedUp(orderId: string) {
      send({ type: 'mark_picked_up', orderId })
    },

    triggerFault(robot: RobotId, reason: string) {
      send({ type: 'trigger_fault', robot, reason })
    },

    clearFault() {
      send({ type: 'clear_fault' })
    },

    updateParams(params: SystemParams) {
      send({ type: 'update_params', params })
    }
  }
}
