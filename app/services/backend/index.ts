import type { BackendMode, SystemParams } from '~/types'
import type { SupervisorBackend } from './types'
import { createMockBackend } from './mockBackend'
import { createLiveBackend } from './liveBackend'

export type { SupervisorBackend, SupervisorHandlers } from './types'

export function createBackend(mode: BackendMode, wsUrl: string, getParams: () => SystemParams): SupervisorBackend {
  return mode === 'live' ? createLiveBackend(wsUrl) : createMockBackend(getParams)
}
