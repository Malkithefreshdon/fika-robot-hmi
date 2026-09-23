<script setup lang="ts">
import { COMMANDS, ROBOT_IDS, type Command, type RobotId } from '~/types'

definePageMeta({ layout: 'dev' })

const system = useSystemStore()
const order = useOrderStore()

const robotLabels: Record<RobotId, string> = { robotA: 'Robot A — Tasse', robotB: 'Robot B — Café / Lait' }
const commandIcons: Record<Command, string> = {
  PICK_MUG: 'lucide:coffee',
  POUR_COFFEE: 'lucide:droplets',
  POUR_MILK: 'lucide:milk',
  DELIVER: 'lucide:hand-platter',
  HOME: 'lucide:house'
}
const commandLabels: Record<Command, string> = {
  PICK_MUG: 'PICK_MUG',
  POUR_COFFEE: 'POUR_COFFEE',
  POUR_MILK: 'POUR_MILK',
  DELIVER: 'DELIVER',
  HOME: 'HOME'
}

function canSend(robot: RobotId) {
  return system.robotStates[robot] === 'READY' || system.robotStates[robot] === 'DONE'
}

function send(robot: RobotId, command: Command) {
  system.sendCommand(robot, command)
}

function fault(robot: RobotId) {
  system.triggerFault(robot, `Panne déclenchée manuellement sur ${robot} (test)`)
}

const commModeLabel = computed(() =>
  system.params.communication.mode === 'ethernet' ? 'Ethernet' : 'E/S numériques'
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-50">Tableau de bord</h1>
      <button
        v-if="system.anyFault"
        type="button"
        class="tap-target inline-flex items-center gap-2 rounded-xl bg-success-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-success-600"
        @click="system.clearFault()"
      >
        <Icon name="lucide:rotate-ccw" class="h-4 w-4" /> Réinitialiser après panne
      </button>
    </div>

    <!-- Status grid -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard v-for="id in ROBOT_IDS" :key="id" icon="lucide:bot" :label="robotLabels[id]" :tone="system.robotStates[id] === 'FAULT' ? 'danger' : system.robotStates[id] === 'BUSY' ? 'warning' : 'success'">
        <template #badge><RobotStateBadge :state="system.robotStates[id]" /></template>
        <p class="text-lg font-semibold text-slate-100">{{ system.robotStates[id] }}</p>
      </StatCard>

      <StatCard icon="lucide:scan-eye" label="Vision" tone="success">
        <template #badge><span class="text-xs text-slate-500">{{ system.params.vision.detectionConfidencePct }}% seuil</span></template>
        <p class="text-lg font-semibold text-slate-100">Simulée — OK</p>
      </StatCard>

      <StatCard icon="lucide:cable" label="Communication" tone="success">
        <template #badge><span class="text-xs text-slate-500">{{ system.params.communication.commandTimeoutMs }} ms</span></template>
        <p class="text-lg font-semibold text-slate-100">{{ commModeLabel }}</p>
      </StatCard>
    </div>

    <!-- Current order -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Commande en cours</h2>
      <div v-if="order.current" class="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <p class="text-slate-200"><span class="text-slate-500">Ticket</span> #{{ order.current.ticketNumber }}</p>
        <p class="text-slate-200"><span class="text-slate-500">Étape</span> {{ order.current.stage }}</p>
        <p class="text-slate-200"><span class="text-slate-500">Taille</span> {{ order.current.options.size }}</p>
        <p class="text-slate-200"><span class="text-slate-500">Lait</span> {{ order.current.options.milk ? 'Oui' : 'Non' }}</p>
        <p v-if="order.current.faulted" class="font-medium text-danger-400">En panne — {{ order.current.faultReason }}</p>
      </div>
      <p v-else class="text-sm text-slate-500">Aucune commande active.</p>
    </section>

    <!-- Manual command dispatch -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Commandes manuelles</h2>
      <p class="mb-4 text-xs text-slate-500">Envoie directement une commande à un robot — utile pour tester la séquence pas à pas pendant le réglage.</p>
      <div class="flex flex-col gap-4">
        <div v-for="id in ROBOT_IDS" :key="id">
          <p class="mb-2 text-sm font-medium text-slate-300">{{ robotLabels[id] }}</p>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <CommandButton
              v-for="cmd in COMMANDS"
              :key="cmd"
              :icon="commandIcons[cmd]"
              :label="commandLabels[cmd]"
              :disabled="!canSend(id)"
              @click="send(id, cmd)"
            />
            <CommandButton icon="lucide:alert-triangle" label="Panne test" danger :disabled="system.robotStates[id] === 'FAULT'" @click="fault(id)" />
          </div>
        </div>
      </div>
    </section>

    <!-- Live log feed -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Journal en direct</h2>
        <NuxtLink to="/dev/logs" class="text-xs font-medium text-accent-400 hover:underline">Voir tout →</NuxtLink>
      </div>
      <LogFeed :logs="system.logs.slice(0, 12)" max-height-class="max-h-72" />
    </section>
  </div>
</template>
