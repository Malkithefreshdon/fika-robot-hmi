/**
 * Shared types for the Fika Robot HMI.
 *
 * These mirror the vocabulary defined in the project plan (WP3 — HMI and
 * supervisory controller): the supervisor drives two UR10 robots with
 * high-level commands and reads back a small set of states.
 */

export const ROBOT_IDS = ['robotA', 'robotB'] as const
export type RobotId = (typeof ROBOT_IDS)[number]

/** States reported back by each robot controller, per the project plan. */
export const ROBOT_STATES = ['READY', 'BUSY', 'DONE', 'FAULT'] as const
export type RobotState = (typeof ROBOT_STATES)[number]

/** High-level commands the supervisor sends to a robot. */
export const COMMANDS = ['PICK_MUG', 'POUR_COFFEE', 'POUR_MILK', 'DELIVER', 'HOME'] as const
export type Command = (typeof COMMANDS)[number]

export type ConnectionMode = 'digital_io' | 'ethernet'
export type BackendMode = 'mock' | 'live'

export const CUP_SIZES = ['small', 'medium', 'large'] as const
export type CupSize = (typeof CUP_SIZES)[number]

export const CUP_SIZE_LABELS: Record<CupSize, string> = {
  small: 'Petit',
  medium: 'Moyen',
  large: 'Grand'
}

/** Stages of a single order, in sequence. `pour_milk` is skipped when the option isn't requested. */
export const ORDER_STAGES = [
  'queued',
  'pick_mug',
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
 * Tunable parameters for the serving sequence, robot motion, vision, and
 * communication layer. These map to the "Technical Approach" and
 * "Requirements" sections of the project plan and are what the dev/tuning
 * screen exposes. In a `live` backend these would be pushed to the Python
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
    pourCoffeeDurationS: number
    pourMilkDurationS: number
    interRobotSafetyDelayS: number
    cupVolumeMl: Record<CupSize, number>
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
    cupVolumeMl: { small: 180, medium: 240, large: 320 }
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

export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  queued: 'Commande reçue',
  pick_mug: 'Préparation de la tasse',
  pour_coffee: 'Versement du café',
  pour_milk: 'Ajout du lait',
  deliver: 'Livraison',
  ready: 'Prêt à récupérer',
  completed: 'Terminée'
}
