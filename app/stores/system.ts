import { defineStore } from 'pinia'
import { createBackend, type SupervisorBackend } from '~/services/backend'
import type { BackendMode, Command, LogEntry, RobotId, RobotState, SystemParams } from '~/types'
import { DEFAULT_SYSTEM_PARAMS, ROBOT_IDS } from '~/types'

const MAX_LOGS = 300
const PARAMS_STORAGE_KEY = 'fika-robot:system-params'

function loadPersistedParams(): SystemParams {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_SYSTEM_PARAMS)
  try {
    const raw = window.localStorage.getItem(PARAMS_STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_SYSTEM_PARAMS)
    // Shallow-merge over defaults so new fields added later always exist.
    const parsed = JSON.parse(raw)
    return {
      ...structuredClone(DEFAULT_SYSTEM_PARAMS),
      ...parsed,
      robots: { ...structuredClone(DEFAULT_SYSTEM_PARAMS.robots), ...parsed.robots },
      sequence: { ...structuredClone(DEFAULT_SYSTEM_PARAMS.sequence), ...parsed.sequence },
      vision: { ...structuredClone(DEFAULT_SYSTEM_PARAMS.vision), ...parsed.vision },
      communication: { ...structuredClone(DEFAULT_SYSTEM_PARAMS.communication), ...parsed.communication },
      simulation: { ...structuredClone(DEFAULT_SYSTEM_PARAMS.simulation), ...parsed.simulation }
    }
  } catch {
    return structuredClone(DEFAULT_SYSTEM_PARAMS)
  }
}

export const useSystemStore = defineStore('system', {
  state: () => ({
    connected: false,
    backendMode: 'mock' as BackendMode,
    robotStates: Object.fromEntries(ROBOT_IDS.map((id) => [id, 'READY'])) as Record<RobotId, RobotState>,
    logs: [] as LogEntry[],
    params: loadPersistedParams(),
    _backend: null as SupervisorBackend | null,
    _initialized: false
  }),

  getters: {
    anyFault: (state) => Object.values(state.robotStates).includes('FAULT'),
    systemReady: (state) => state.connected && !Object.values(state.robotStates).includes('FAULT'),
    errorLogs: (state) => state.logs.filter((l) => l.level === 'error')
  },

  actions: {
    init() {
      if (this._initialized) return
      this._initialized = true

      const config = useRuntimeConfig()
      this.backendMode = config.public.backendMode as BackendMode
      this._backend = createBackend(this.backendMode, config.public.backendWsUrl, () => this.params)

      this._backend.connect({
        onRobotState: (robot, state) => {
          this.robotStates[robot] = state
        },
        onOrderUpdate: (order) => {
          useOrderStore().applyOrderUpdate(order)
        },
        onLog: (entry) => this.pushLog(entry),
        onConnectionChange: (connected) => {
          this.connected = connected
        }
      })
    },

    pushLog(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
      this.logs.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        ...entry
      })
      if (this.logs.length > MAX_LOGS) this.logs.length = MAX_LOGS
    },

    clearLogs() {
      this.logs = []
    },

    sendCommand(robot: RobotId, command: Command) {
      this._backend?.sendCommand(robot, command)
    },

    triggerFault(robot: RobotId, reason: string) {
      this._backend?.triggerFault(robot, reason)
    },

    clearFault() {
      this._backend?.clearFault()
    },

    submitOrder(options: Parameters<SupervisorBackend['submitOrder']>[0]) {
      return this._backend?.submitOrder(options) ?? null
    },

    markPickedUp(orderId: string) {
      this._backend?.markPickedUp(orderId)
    },

    updateParams(next: SystemParams) {
      this.params = next
      this.persistParams()
      this._backend?.updateParams(this.params)
    },

    /** Call after mutating `params` in place (e.g. via v-model on the tuning screen). */
    applyParamsChange() {
      this.persistParams()
      this._backend?.updateParams(this.params)
    },

    persistParams() {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(this.params))
    },

    resetParamsToDefault() {
      this.params = structuredClone(DEFAULT_SYSTEM_PARAMS)
      this.persistParams()
      this._backend?.updateParams(this.params)
      this.pushLog({ level: 'warn', source: 'dev-mode', message: 'Paramètres réinitialisés aux valeurs par défaut' })
    }
  }
})
