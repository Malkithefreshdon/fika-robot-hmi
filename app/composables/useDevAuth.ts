const SESSION_KEY = 'fika-robot:dev-unlocked'

/**
 * Lightweight gate to keep customers from wandering into the tuning screens.
 * This is NOT real authentication — a real deployment should also lock the
 * kiosk browser chrome / OS session. It just prevents accidental taps.
 */
export function useDevAuth() {
  const unlocked = useState('fika-dev-unlocked', () => false)

  function restore() {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
      unlocked.value = true
    }
  }

  function tryUnlock(pin: string): boolean {
    const config = useRuntimeConfig()
    const ok = pin.length > 0 && pin === config.public.devPin
    if (ok) {
      unlocked.value = true
      window.sessionStorage.setItem(SESSION_KEY, '1')
    }
    return ok
  }

  function lock() {
    unlocked.value = false
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(SESSION_KEY)
  }

  return { unlocked, restore, tryUnlock, lock }
}
