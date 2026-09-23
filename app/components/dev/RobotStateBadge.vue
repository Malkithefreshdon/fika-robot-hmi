<script setup lang="ts">
import type { RobotState } from '~/types'

const props = defineProps<{ state: RobotState }>()

const styles: Record<RobotState, string> = {
  READY: 'bg-success-500/15 text-success-400 ring-success-500/30',
  BUSY: 'bg-warning-500/15 text-warning-400 ring-warning-500/30 animate-pulse',
  DONE: 'bg-accent-500/15 text-accent-400 ring-accent-500/30',
  FAULT: 'bg-danger-500/15 text-danger-400 ring-danger-500/30 animate-pulse'
}

const labels: Record<RobotState, string> = {
  READY: 'Prêt',
  BUSY: 'Occupé',
  DONE: 'Terminé',
  FAULT: 'Panne'
}
</script>

<template>
  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset" :class="styles[props.state]">
    {{ labels[props.state] }}
  </span>
</template>
