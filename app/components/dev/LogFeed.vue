<script setup lang="ts">
import type { LogEntry } from '~/types'

defineProps<{ logs: LogEntry[]; maxHeightClass?: string }>()

const levelStyles: Record<LogEntry['level'], string> = {
  info: 'text-slate-300',
  warn: 'text-warning-400',
  error: 'text-danger-400'
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour12: false })
}
</script>

<template>
  <div class="scrollbar-warm overflow-y-auto font-[family-name:var(--font-mono)] text-xs" :class="maxHeightClass ?? 'max-h-96'">
    <p v-if="logs.length === 0" class="p-4 text-slate-500">No events yet.</p>
    <div v-for="entry in logs" :key="entry.id" class="flex gap-3 border-b border-slate-800/60 px-3 py-2">
      <span class="shrink-0 text-slate-500">{{ formatTime(entry.timestamp) }}</span>
      <span class="shrink-0 w-14 uppercase" :class="levelStyles[entry.level]">{{ entry.level }}</span>
      <span class="shrink-0 w-20 truncate text-slate-500">{{ entry.source }}</span>
      <span class="text-slate-200">{{ entry.message }}</span>
    </div>
  </div>
</template>
