<script setup lang="ts">
import type { LogLevel } from '~/types'

definePageMeta({ layout: 'dev' })

const system = useSystemStore()
const filter = ref<LogLevel | 'all'>('all')

const filtered = computed(() =>
  filter.value === 'all' ? system.logs : system.logs.filter((l) => l.level === filter.value)
)

function exportLogs() {
  const blob = new Blob([JSON.stringify(system.logs, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fika-robot-logs-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-50">Logs</h1>
      <div class="flex items-center gap-2">
        <button type="button" class="tap-target rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" @click="exportLogs">
          <Icon name="lucide:download" class="mr-1.5 inline h-4 w-4" /> Export
        </button>
        <button type="button" class="tap-target rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" @click="system.clearLogs()">
          <Icon name="lucide:trash-2" class="mr-1.5 inline h-4 w-4" /> Clear
        </button>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        v-for="level in (['all', 'info', 'warn', 'error'] as const)"
        :key="level"
        type="button"
        class="tap-target rounded-full px-4 py-2 text-sm font-medium capitalize transition"
        :class="filter === level ? 'bg-accent-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
        @click="filter = level"
      >
        {{ level === 'all' ? 'All' : level }}
      </button>
    </div>

    <section class="rounded-2xl border border-slate-800 bg-slate-850">
      <LogFeed :logs="filtered" max-height-class="max-h-[70vh]" />
    </section>
  </div>
</template>
