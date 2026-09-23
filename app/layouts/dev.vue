<script setup lang="ts">
const devAuth = useDevAuth()
const { unlocked } = devAuth
const system = useSystemStore()

const connectionLabel = computed(() =>
  system.backendMode === 'mock' ? 'Supervisor: simulation' : 'Supervisor: connected'
)
</script>

<template>
  <PinPad v-if="!unlocked" />

  <div v-else class="h-dvh overflow-hidden bg-slate-900 text-slate-100">
    <div class="mx-auto flex h-full max-w-[1600px] flex-col md:flex-row">
      <!-- Sidebar (desktop, fixed) / top tab bar (tablet & below, scrolls with page) -->
      <aside class="shrink-0 overflow-y-auto border-b border-slate-800 bg-slate-925 p-3 md:w-64 md:border-b-0 md:border-r md:p-5">
        <div class="mb-4 hidden items-center gap-3 px-2 md:flex">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-roast-500 text-lg">☕</span>
          <div>
            <p class="font-[family-name:var(--font-display)] text-sm font-semibold leading-tight">Fika Robot</p>
            <p class="text-xs text-slate-400">Technician mode</p>
          </div>
        </div>
        <DevNav />
      </aside>

      <div class="flex min-h-0 flex-1 flex-col">
        <header class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset"
              :class="system.connected ? 'bg-success-500/10 text-success-400 ring-success-500/30' : 'bg-danger-500/10 text-danger-400 ring-danger-500/30'"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="system.connected ? 'bg-success-400' : 'bg-danger-400'" />
              {{ connectionLabel }}
            </span>
            <span
              v-if="system.anyFault"
              class="inline-flex items-center gap-2 rounded-full bg-danger-500/10 px-3 py-1 text-xs font-medium text-danger-400 ring-1 ring-inset ring-danger-500/30"
            >
              <Icon name="lucide:alert-triangle" class="h-3.5 w-3.5" /> Fault active
            </span>
          </div>

          <div class="flex items-center gap-2">
            <NuxtLink
              to="/"
              class="tap-target inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              <Icon name="lucide:monitor" class="h-4 w-4" /> Customer screen
            </NuxtLink>
            <button
              type="button"
              class="tap-target inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              @click="devAuth.lock()"
            >
              <Icon name="lucide:lock" class="h-4 w-4" /> Lock
            </button>
          </div>
        </header>

        <main class="min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
