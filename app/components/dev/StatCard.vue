<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}>()
</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-850 p-4">
    <div class="mb-3 flex items-center justify-between">
      <span
        class="flex h-9 w-9 items-center justify-center rounded-lg"
        :class="{
          'bg-slate-700 text-slate-300': !tone || tone === 'neutral',
          'bg-success-500/15 text-success-400': tone === 'success',
          'bg-warning-500/15 text-warning-400': tone === 'warning',
          'bg-danger-500/15 text-danger-400': tone === 'danger'
        }"
      >
        <Icon :name="icon" class="h-[18px] w-[18px]" />
      </span>
      <slot name="badge" />
    </div>
    <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ label }}</p>
    <div class="mt-1">
      <slot />
    </div>
  </div>
</template>
