<script setup lang="ts">
const props = withDefaults(defineProps<{
  tone: 'ready' | 'busy' | 'fault' | 'offline'
  label: string
}>(), {})

const toneClasses: Record<typeof props.tone, string> = {
  ready: 'bg-success-500/10 text-success-600 ring-success-500/30',
  busy: 'bg-warning-500/10 text-warning-600 ring-warning-500/30',
  fault: 'bg-danger-500/10 text-danger-600 ring-danger-500/30',
  offline: 'bg-slate-500/10 text-slate-500 ring-slate-500/30'
}

const dotClasses: Record<typeof props.tone, string> = {
  ready: 'bg-success-500',
  busy: 'bg-warning-500 animate-pulse',
  fault: 'bg-danger-500 animate-pulse',
  offline: 'bg-slate-500'
}
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset"
    :class="toneClasses[tone]"
  >
    <span class="h-2 w-2 rounded-full" :class="dotClasses[tone]" />
    {{ label }}
  </span>
</template>
