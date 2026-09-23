<script setup lang="ts">
const system = useSystemStore()

const statusTone = computed<'ready' | 'busy' | 'fault' | 'offline'>(() => {
  if (!system.connected) return 'offline'
  if (system.anyFault) return 'fault'
  const busy = Object.values(system.robotStates).some((s) => s === 'BUSY')
  return busy ? 'busy' : 'ready'
})

const statusLabel = computed(() => ({
  ready: 'Système prêt',
  busy: 'Préparation en cours',
  fault: 'Assistance requise',
  offline: 'Connexion…'
}[statusTone.value]))
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-cream-100">
    <!-- Warm ambient background -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-latte-300/40 blur-3xl" />
      <div class="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent-300/25 blur-3xl" />
    </div>

    <div class="relative flex min-h-screen flex-col" style="padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px);">
      <header class="flex items-center justify-between px-6 py-5 sm:px-10">
        <NuxtLink to="/" class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-roast-500 text-2xl shadow-card">☕</span>
          <span class="font-[family-name:var(--font-display)] text-xl font-semibold text-roast-600">Fika Robot</span>
        </NuxtLink>
        <StatusPill :tone="statusTone" :label="statusLabel" />
      </header>

      <main class="flex flex-1 flex-col items-center justify-center px-4 pb-24 sm:px-8">
        <div class="w-full max-w-3xl">
          <slot />
        </div>
      </main>

      <NuxtLink
        to="/dev"
        class="tap-target group fixed bottom-4 right-4 flex items-center justify-center rounded-full bg-white/60 p-3 text-roast-500/50 shadow-sm ring-1 ring-roast-500/10 transition hover:bg-white hover:text-roast-600 hover:opacity-100 sm:bottom-6 sm:right-6"
        style="margin-bottom: env(safe-area-inset-bottom, 0px);"
        aria-label="Mode technicien"
      >
        <Icon name="lucide:settings" class="h-5 w-5" />
      </NuxtLink>
    </div>
  </div>
</template>
