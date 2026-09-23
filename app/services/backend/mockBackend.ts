import type { Command, Order, OrderOptions, OrderStage, RobotId, RobotState, SystemParams } from '~/types'
import type { SupervisorBackend, SupervisorHandlers } from './types'

let ticketCounter = 100

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * In-browser stand-in for the Python supervisory controller. Robot A always
 * handles the coffee pot (weighing + pouring); Robot B always handles the
 * customer's glass (pick up / place on the scale / serve).
 *
 * Default mode: closed-loop dosing — Robot A weighs the pot then clears it,
 * Robot B sets the glass on the scale, Robot A pours until the target mass
 * (accurate, glass sits unattended on the scale).
 *
 * Stylish mode: suspended synchronized pour — both robots grab their item
 * together, Robot B holds the glass mid-air while Robot A pours for a fixed
 * (timed, not weighed) duration — faster and more theatrical, but a little
 * less precise.
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

  function maybeRandomFault(): boolean {
    const params = getParams()
    if (!params.simulation.randomFaultsEnabled) return false
    return Math.random() * 100 < params.simulation.randomFaultChancePct
  }

  function speedScale(robot: RobotId) {
    const params = getParams()
    return 100 / Math.max(10, params.robots[robot].speedPct)
  }

  /** One robot performs one command; gates order-stage progression. Returns false on fault/abort. */
  async function runStage(robot: RobotId, command: Command, stage: OrderStage, durationS: number) {
    log('info', 'supervisor', `Sending ${command} to ${robot}`)
    setRobotState(robot, 'BUSY')
    updateOrder({ stage })
    await wait(durationS)
    if (aborted) return false

    if (maybeRandomFault()) {
      const reason = `Fault detected during ${command} (${robot})`
      setRobotState(robot, 'FAULT')
      log('error', robot, reason)
      updateOrder({ faulted: true, faultReason: reason })
      aborted = true
      return false
    }

    setRobotState(robot, 'DONE')
    log('info', robot, `${command} complete`)
    await wait(0.3)
    setRobotState(robot, 'READY')
    return true
  }

  /** Both robots act at once for the same order stage (e.g. grabbing pot + glass together). */
  async function runParallelStage(
    actions: Array<{ robot: RobotId; command: Command }>,
    stage: OrderStage,
    durationS: number
  ) {
    actions.forEach(({ robot, command }) => {
      log('info', 'supervisor', `Sending ${command} to ${robot}`)
      setRobotState(robot, 'BUSY')
    })
    updateOrder({ stage })
    await wait(durationS)
    if (aborted) return false

    if (maybeRandomFault()) {
      const { robot, command } = actions[Math.floor(Math.random() * actions.length)]!
      const reason = `Fault detected during ${command} (${robot})`
      actions.forEach((a) => setRobotState(a.robot, 'FAULT'))
      log('error', robot, reason)
      updateOrder({ faulted: true, faultReason: reason })
      aborted = true
      return false
    }

    actions.forEach(({ robot, command }) => {
      setRobotState(robot, 'DONE')
      log('info', robot, `${command} complete`)
    })
    await wait(0.3)
    actions.forEach(({ robot }) => setRobotState(robot, 'READY'))
    return true
  }

  /** Fire-and-forget HOME return — doesn't gate order-stage progression. */
  function sendHomeInBackground(robot: RobotId, durationS: number) {
    setRobotState(robot, 'BUSY')
    void wait(durationS).then(() => {
      if (aborted) return
      setRobotState(robot, 'DONE')
      log('info', robot, 'HOME complete')
      void wait(0.3).then(() => {
        if (!aborted) setRobotState(robot, 'READY')
      })
    })
  }

  async function runOrder(order: Order) {
    aborted = false
    const params = getParams()

    if (order.options.mode === 'default') {
      // 1. Robot A weighs the pot, then Robot B sets the glass on the scale.
      if (!(await runStage('robotA', 'WEIGH_POT', 'weigh_pot', params.sequence.weighingTimeS * speedScale('robotA')))) return
      await wait(params.sequence.interRobotSafetyDelayS)
      if (aborted) return
      if (!(await runStage('robotB', 'PLACE_ON_SCALE', 'place_glass', params.sequence.placingTimeS * speedScale('robotB')))) return

      // 2. Robot A pours, servoing off the scale reading until the target mass.
      const pourDurationS = params.dosing.targetMassG[order.options.size] / Math.max(1, params.dosing.flowRateGPerS)
      if (!(await runStage('robotA', 'POUR_COFFEE', 'pour_coffee', pourDurationS * speedScale('robotA')))) return

      if (order.options.milk) {
        if (!(await runStage('robotA', 'POUR_MILK', 'pour_milk', params.sequence.pourMilkDurationS * speedScale('robotA')))) return
      }

      // 3. Robot B removes the glass and serves it; Robot A returns the pot home in the background.
      sendHomeInBackground('robotA', params.sequence.deliveryTimeS)
      if (!(await runStage('robotB', 'DELIVER', 'deliver', params.sequence.deliveryTimeS * speedScale('robotB')))) return
    } else {
      // Stylish mode: both robots grab their item together.
      if (
        !(await runParallelStage(
          [
            { robot: 'robotA', command: 'WEIGH_POT' },
            { robot: 'robotB', command: 'PICK_GLASS' }
          ],
          'grab_items',
          params.sequence.weighingTimeS * Math.max(speedScale('robotA'), speedScale('robotB'))
        ))
      ) return

      // Robot B holds the glass stationary while Robot A pours a timed (not weighed) amount.
      if (
        !(await runParallelStage(
          [
            { robot: 'robotA', command: 'POUR_COFFEE' },
            { robot: 'robotB', command: 'HOLD_GLASS' }
          ],
          'pour_coffee',
          params.sequence.pourCoffeeDurationS * speedScale('robotA')
        ))
      ) return

      if (order.options.milk) {
        if (
          !(await runParallelStage(
            [
              { robot: 'robotA', command: 'POUR_MILK' },
              { robot: 'robotB', command: 'HOLD_GLASS' }
            ],
            'pour_milk',
            params.sequence.pourMilkDurationS * speedScale('robotA')
          ))
        ) return
      }

      // Robot A returns the pot home in the background; Robot B serves the glass.
      sendHomeInBackground('robotA', params.sequence.deliveryTimeS)
      if (!(await runStage('robotB', 'DELIVER', 'deliver', params.sequence.deliveryTimeS * speedScale('robotB')))) return
    }

    updateOrder({ stage: 'ready' })
    log('info', 'supervisor', `Order #${order.ticketNumber} ready — awaiting pickup`)
  }

  return {
    connect(h) {
      handlers = h
      handlers.onConnectionChange(true)
      setRobotState('robotA', 'READY')
      setRobotState('robotB', 'READY')
      log('info', 'supervisor', 'Supervisor (simulation) connected')
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
      log('info', 'supervisor', `New order #${order.ticketNumber} (${options.size}${options.milk ? ' + milk' : ''}, ${options.mode} mode)`)
      void runOrder(order)
      return order
    },

    sendCommand(robot, command) {
      log('info', 'dev-mode', `Manual command ${command} → ${robot}`)
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
      log('info', 'kiosk', `Order #${currentOrder?.ticketNumber} picked up by the customer`)
      currentOrder = null
    },

    triggerFault(robot, reason) {
      aborted = true
      setRobotState(robot, 'FAULT')
      log('error', robot, reason || 'Fault triggered manually (technician mode)')
      if (currentOrder) updateOrder({ faulted: true, faultReason: reason })
    },

    clearFault() {
      aborted = false
      setRobotState('robotA', 'READY')
      setRobotState('robotB', 'READY')
      log('warn', 'supervisor', 'Recovered from fault — robots reset (HOME)')
      if (currentOrder?.faulted) {
        updateOrder({ faulted: false, stage: 'completed' })
        currentOrder = null
      }
    },

    updateParams(params) {
      log('info', 'dev-mode', 'System parameters updated')
      void params
    }
  }
}
