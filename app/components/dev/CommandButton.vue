<script setup lang="ts">
defineProps<{ icon: string; label: string; disabled?: boolean; danger?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="tap-target flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
    :class="danger
      ? 'border-danger-500/30 bg-danger-500/10 text-danger-300 hover:bg-danger-500/20'
      : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <Icon :name="icon" class="h-5 w-5" />
    {{ label }}
  </button>
</template>
