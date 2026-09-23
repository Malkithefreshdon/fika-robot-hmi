/**
 * Shared types for the Fika Robot HMI.
 *
 * Vocabulary for the two serving scenarios (see README): "default" mode
 * doses coffee in a closed loop against a precision scale, while "stylish"
 * mode performs a faster, synchronized mid-air pour timed rather than
 * weighed. Robot A always handles the coffee pot (weighing + pouring),
 * Robot B always handles the customer's glass (pick up / place on the
 * scale / serve).
 */

export const ROBOT_IDS = ['robotA', 'robotB'] as const
export type RobotId = (typeof ROBOT_IDS)[number]

/** States reported back by each robot controller. */
export const ROBOT_STATES = ['READY', 'BUSY', 'DONE', 'FAULT'] as const
export type RobotState = (typeof ROBOT_STATES)[number]

/** High-level commands the supervisor sends to a robot. */
export const COMMANDS = ['PICK_GLASS', 'WEIGH_POT', 'PLACE_ON_SCALE', 'HOLD_GLASS', 'POUR_COFFEE', 'POUR_MILK', 'DELIVER', 'HOME'] as const
export type Command = (typeof COMMANDS)[number]

export type ConnectionMode = 'digital_io' | 'ethernet'
export type BackendMode = 'mock' | 'live'

export const CUP_SIZES = ['small', 'medium', 'large'] as const
export type CupSize = (typeof CUP_SIZES)[number]

/** English labels — only used on the technician (/dev) screens, which are not translated. */
export const CUP_SIZE_LABELS: Record<CupSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large'
}

/**
 * The two operational scenarios offered to the customer.
 * - `default`: closed-loop dosing on a precision scale (accurate, a bit slower).
 * - `stylish`: synchronized mid-air pour timed rather than weighed (faster, more of a show, slightly less precise).
 */
export const SERVING_MODES = ['default', 'stylish'] as const
export type ServingMode = (typeof SERVING_MODES)[number]
export const DEFAULT_SERVING_MODE: ServingMode = 'default'

/**
 * Stages across both scenarios. `weigh_pot` / `place_glass` only occur in
 * `default` mode; `grab_items` only occurs in `stylish` mode; `pour_milk`
 * is skipped whenever milk wasn't requested.
 */
export const ORDER_STAGES = [
  'queued',
  'weigh_pot',
  'place_glass',
  'grab_items',
  'pour_coffee',
  'pour_milk',
  'deliver',
  'ready',
  'completed'
] as const
export type OrderStage = (typeof ORDER_STAGES)[number]

export interface OrderOptions {
  size: CupSize
  milk: boolean
  mode: ServingMode
}

export interface Order {
  id: string
  ticketNumber: number
  options: OrderOptions
  stage: OrderStage
  createdAt: number
  updatedAt: number
  faulted: boolean
  faultReason?: string
}

export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  source: string
  message: string
}

/**
 * Tunable parameters for the serving sequence, robot motion, vision, scale
 * dosing, and communication layer. These are what the /dev/tuning screen
 * exposes. In a `live` backend these would be pushed to the Python
 * supervisor's configuration endpoint.
 */
export interface RobotMotionParams {
  speedPct: number
  accelerationPct: number
  pickupOffsetMm: { x: number; y: number; z: number }
  pourOffsetMm: { x: number; y: number; z: number }
}

export interface SystemParams {
  robots: Record<RobotId, RobotMotionParams>
  sequence: {
    /** Fixed pour duration used by Stylish mode (timed, not weighed). */
    pourCoffeeDurationS: number
    pourMilkDurationS: number
    interRobotSafetyDelayS: number
    /** Customer-facing volume label per glass size. */
    cupVolumeMl: Record<CupSize, number>
    /** Robot A weighing the pot (default mode) / grabbing pot+glass together (stylish mode). */
    weighingTimeS: number
    /** Robot B placing the glass on the scale (default) or picking it up (stylish). */
    placingTimeS: number
    /** Serving the glass + returning the pot home. */
    deliveryTimeS: number
  }
  /** Closed-loop dosing — only used in Default mode. */
  dosing: {
    targetMassG: Record<CupSize, number>
    flowRateGPerS: number
    scaleToleranceG: number
  }
  vision: {
    detectionConfidencePct: number
    detectionTimeoutS: number
    expectedLuxLevel: number
  }
  communication: {
    mode: ConnectionMode
    commandTimeoutMs: number
    retryAttempts: number
  }
  simulation: {
    speedMultiplier: number
    randomFaultsEnabled: boolean
    randomFaultChancePct: number
  }
}

export const DEFAULT_SYSTEM_PARAMS: SystemParams = {
  robots: {
    robotA: {
      speedPct: 60,
      accelerationPct: 50,
      pickupOffsetMm: { x: 0, y: 0, z: 0 },
      pourOffsetMm: { x: 0, y: 0, z: 0 }
    },
    robotB: {
      speedPct: 60,
      accelerationPct: 50,
      pickupOffsetMm: { x: 0, y: 0, z: 0 },
      pourOffsetMm: { x: 0, y: 0, z: 0 }
    }
  },
  sequence: {
    pourCoffeeDurationS: 6,
    pourMilkDurationS: 3,
    interRobotSafetyDelayS: 1.5,
    cupVolumeMl: { small: 180, medium: 240, large: 320 },
    weighingTimeS: 2,
    placingTimeS: 1.5,
    deliveryTimeS: 2
  },
  dosing: {
    targetMassG: { small: 170, medium: 230, large: 310 },
    flowRateGPerS: 25,
    scaleToleranceG: 3
  },
  vision: {
    detectionConfidencePct: 85,
    detectionTimeoutS: 4,
    expectedLuxLevel: 400
  },
  communication: {
    mode: 'digital_io',
    commandTimeoutMs: 2000,
    retryAttempts: 3
  },
  simulation: {
    speedMultiplier: 1,
    randomFaultsEnabled: false,
    randomFaultChancePct: 5
  }
}
