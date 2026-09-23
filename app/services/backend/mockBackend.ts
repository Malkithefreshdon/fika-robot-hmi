import type { Command, Order, OrderOptions, OrderStage, RobotId, RobotState, SystemParams } from '~/types'
import type { SupervisorBackend, SupervisorHandlers } from './types'

let ticketCounter = 100

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * In-browser stand-in for the Python supervisory controller described in
 * the project plan (WP3). It drives the same command/state vocabulary
 * (PICK_MUG, POUR_COFFEE, POUR_MILK, DELIVER, HOME / READY, BUSY, DONE,
 * FAULT) on a timer instead of real robots, so the HMI is fully demoable
 * and every tunable parameter visibly affects timing.
 */
export function createMockBackend(getParams: () => SystemParams): SupervisorBackend {
  let handlers: SupervisorHandlers | null = null
  let currentOrder: Order | null = null
  let aborted = false
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function log(level: 'info' | 'warn' | 'error', source: string, message: string) {
    handlers?.onLog({ level, source, message })
  }

  function setRobotState(robot: RobotId, state: RobotState) {
    handlers?.onRobotState(robot, state)
  }

  function updateOrder(patch: Partial<Order>) {
    if (!currentOrder) return
    currentOrder = { ...currentOrder, ...patch, updatedAt: Date.now() }
    handlers?.onOrderUpdate(currentOrder)
  }

  function wait(seconds: number) {
    const params = getParams()
    const ms = Math.max(120, (seconds * 1000) / Math.max(0.1, params.simulation.speedMultiplier))
    return new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        timers.delete(t)
        resolve()
      }, ms)
      timers.add(t)
    })
  }

  function maybeRandomFault(stage: OrderStage): boolean {
    const params = getParams()
    if (!params.simulation.randomFaultsEnabled) return false
    return Math.random() * 100 < params.simulation.randomFaultChancePct
  }

  async function runStage(robot: RobotId, command: Command, stage: OrderStage, durationS: number) {
    log('info', 'supervisor', `Envoi de la commande ${command} à ${robot}`)
    setRobotState(robot, 'BUSY')
    updateOrder({ stage })
    await wait(durationS)
    if (aborted) return false

    if (maybeRandomFault(stage)) {
      const reason = `Échec détecté pendant ${command} (${robot})`
      setRobotState(robot, 'FAULT')
      log('error', robot, reason)
      updateOrder({ faulted: true, faultReason: reason })
      aborted = true
      return false
    }

    setRobotState(robot, 'DONE')
    log('info', robot, `${command} terminé`)
    await wait(0.3)
    setRobotState(robot, 'READY')
    return true
  }

  async function runOrder(order: Order) {
    aborted = false
    const params = getParams()

    if (!(await runStage('robotA', 'PICK_MUG', 'pick_mug', 1.8 * (100 / Math.max(10, params.robots.robotA.speedPct))))) return
    await wait(params.sequence.interRobotSafetyDelayS)
    if (aborted) return

    if (!(await runStage('robotB', 'POUR_COFFEE', 'pour_coffee', params.sequence.pourCoffeeDurationS))) return

    if (order.options.milk) {
      if (!(await runStage('robotB', 'POUR_MILK', 'pour_milk', params.sequence.pourMilkDurationS))) return
    }

    if (!(await runStage('robotB', 'DELIVER', 'deliver', 2 * (100 / Math.max(10, params.robots.robotB.speedPct))))) return

    updateOrder({ stage: 'ready' })
    log('info', 'supervisor', `Commande #${order.ticketNumber} prête — en attente de retrait`)
  }

  return {
    connect(h) {
      handlers = h
      handlers.onConnectionChange(true)
      setRobotState('robotA', 'READY')
      setRobotState('robotB', 'READY')
      log('info', 'supervisor', 'Superviseur (simulation) connecté')
    },

    disconnect() {
      timers.forEach(clearTimeout)
      timers.clear()
      handlers?.onConnectionChange(false)
      handlers = null
    },

    submitOrder(options: OrderOptions) {
      const order: Order = {
        id: makeId(),
        ticketNumber: ++ticketCounter,
        options,
        stage: 'queued',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        faulted: false
      }
      currentOrder = order
      handlers?.onOrderUpdate(order)
      log('info', 'supervisor', `Nouvelle commande #${order.ticketNumber} (${options.size}${options.milk ? ' + lait' : ''})`)
      void runOrder(order)
      return order
    },

    sendCommand(robot, command) {
      log('info', 'dev-mode', `Commande manuelle ${command} → ${robot}`)
      setRobotState(robot, 'BUSY')
      const t = setTimeout(() => {
        timers.delete(t)
        setRobotState(robot, command === 'HOME' ? 'READY' : 'DONE')
        if (command !== 'HOME') {
          const t2 = setTimeout(() => {
            timers.delete(t2)
            setRobotState(robot, 'READY')
          }, 400)
          timers.add(t2)
        }
      }, 900)
      timers.add(t)
    },

    markPickedUp(orderId) {
      if (currentOrder?.id !== orderId) return
      updateOrder({ stage: 'completed' })
      log('info', 'kiosk', `Commande #${currentOrder?.ticketNumber} récupérée par le client`)
      currentOrder = null
    },

    triggerFault(robot, reason) {
      aborted = true
      setRobotState(robot, 'FAULT')
      log('error', robot, reason || 'Panne déclenchée manuellement (mode technicien)')
      if (currentOrder) updateOrder({ faulted: true, faultReason: reason })
    },

    clearFault() {
      aborted = false
      setRobotState('robotA', 'READY')
      setRobotState('robotB', 'READY')
      log('warn', 'supervisor', 'Reprise après panne — robots réinitialisés (HOME)')
      if (currentOrder?.faulted) {
        updateOrder({ faulted: false, stage: 'completed' })
        currentOrder = null
      }
    },

    updateParams(params) {
      log('info', 'dev-mode', 'Paramètres système mis à jour')
      void params
    }
  }
}
