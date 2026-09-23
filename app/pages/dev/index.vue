<script setup lang="ts">
import { COMMANDS, ROBOT_IDS, type Command, type RobotId } from '~/types'

definePageMeta({ layout: 'dev' })

const system = useSystemStore()
const order = useOrderStore()

const robotLabels: Record<RobotId, string> = { robotA: 'Robot A — Coffee pot', robotB: 'Robot B — Glass' }
const commandIcons: Record<Command, string> = {
  PICK_GLASS: 'lucide:hand',
  WEIGH_POT: 'lucide:scale',
  PLACE_ON_SCALE: 'lucide:package-open',
  HOLD_GLASS: 'lucide:pause',
  POUR_COFFEE: 'lucide:droplets',
  POUR_MILK: 'lucide:milk',
  DELIVER: 'lucide:hand-platter',
  HOME: 'lucide:house'
}

function canSend(robot: RobotId) {
  return system.robotStates[robot] === 'READY' || system.robotStates[robot] === 'DONE'
}

function send(robot: RobotId, command: Command) {
  system.sendCommand(robot, command)
}

function fault(robot: RobotId) {
  system.triggerFault(robot, `Fault manually triggered on ${robot} (test)`)
}

const commModeLabel = computed(() =>
  system.params.communication.mode === 'ethernet' ? 'Ethernet' : 'Digital I/O'
)

const modeLabel = computed(() => (order.current?.options.mode === 'stylish' ? 'Stylish' : 'Default'))
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-50">Dashboard</h1>
      <button
        v-if="system.anyFault"
        type="button"
        class="tap-target inline-flex items-center gap-2 rounded-xl bg-success-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-success-600"
        @click="system.clearFault()"
      >
        <Icon name="lucide:rotate-ccw" class="h-4 w-4" /> Reset after fault
      </button>
    </div>

    <!-- Status grid -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard v-for="id in ROBOT_IDS" :key="id" icon="lucide:bot" :label="robotLabels[id]" :tone="system.robotStates[id] === 'FAULT' ? 'danger' : system.robotStates[id] === 'BUSY' ? 'warning' : 'success'">
        <template #badge><RobotStateBadge :state="system.robotStates[id]" /></template>
        <p class="text-lg font-semibold text-slate-100">{{ system.robotStates[id] }}</p>
      </StatCard>

      <StatCard icon="lucide:scan-eye" label="Vision" tone="success">
        <template #badge><span class="text-xs text-slate-500">{{ system.params.vision.detectionConfidencePct }}% threshold</span></template>
        <p class="text-lg font-semibold text-slate-100">Simulated — OK</p>
      </StatCard>

      <StatCard icon="lucide:cable" label="Communication" tone="success">
        <template #badge><span class="text-xs text-slate-500">{{ system.params.communication.commandTimeoutMs }} ms</span></template>
        <p class="text-lg font-semibold text-slate-100">{{ commModeLabel }}</p>
      </StatCard>
    </div>

    <!-- Current order -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Current order</h2>
      <div v-if="order.current" class="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <p class="text-slate-200"><span class="text-slate-500">Ticket</span> #{{ order.current.ticketNumber }}</p>
        <p class="text-slate-200"><span class="text-slate-500">Stage</span> {{ order.current.stage }}</p>
        <p class="text-slate-200"><span class="text-slate-500">Mode</span> {{ modeLabel }}</p>
        <p class="text-slate-200"><span class="text-slate-500">Size</span> {{ order.current.options.size }}</p>
        <p class="text-slate-200"><span class="text-slate-500">Milk</span> {{ order.current.options.milk ? 'Yes' : 'No' }}</p>
        <p v-if="order.current.faulted" class="font-medium text-danger-400">Faulted — {{ order.current.faultReason }}</p>
      </div>
      <p v-else class="text-sm text-slate-500">No active order.</p>
    </section>

    <!-- Manual command dispatch -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Manual commands</h2>
      <p class="mb-4 text-xs text-slate-500">Send a command directly to a robot — useful for testing the sequence step by step while tuning. Robot A handles the coffee pot (weigh / pour / home); Robot B handles the customer's glass (pick up / place on scale / hold / deliver).</p>
      <div class="flex flex-col gap-4">
        <div v-for="id in ROBOT_IDS" :key="id">
          <p class="mb-2 text-sm font-medium text-slate-300">{{ robotLabels[id] }}</p>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
            <CommandButton
              v-for="cmd in COMMANDS"
              :key="cmd"
              :icon="commandIcons[cmd]"
              :label="cmd"
              :disabled="!canSend(id)"
              @click="send(id, cmd)"
            />
            <CommandButton icon="lucide:alert-triangle" label="Test fault" danger :disabled="system.robotStates[id] === 'FAULT'" @click="fault(id)" />
          </div>
        </div>
      </div>
    </section>

    <!-- Live log feed -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Live log</h2>
        <NuxtLink to="/dev/logs" class="text-xs font-medium text-accent-400 hover:underline">View all →</NuxtLink>
      </div>
      <LogFeed :logs="system.logs.slice(0, 12)" max-height-class="max-h-72" />
    </section>
  </div>
</template>
