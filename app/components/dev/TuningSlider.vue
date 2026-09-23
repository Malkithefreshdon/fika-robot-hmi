<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  label: string
  description?: string
  min: number
  max: number
  step?: number
  unit?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()

function onInput(e: Event) {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value))
}

function onNumberInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isNaN(val)) emit('update:modelValue', Math.min(props.max, Math.max(props.min, val)))
}
</script>

<template>
  <div :class="{ 'opacity-40': disabled }">
    <div class="mb-1.5 flex items-baseline justify-between gap-3">
      <label class="text-sm font-medium text-slate-200">{{ label }}</label>
      <div class="flex items-center gap-1">
        <input
          type="number"
          :value="modelValue"
          :min="min"
          :max="max"
          :step="step ?? 1"
          :disabled="disabled"
          class="w-20 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm text-slate-100 focus:border-accent-500 focus:outline-none disabled:cursor-not-allowed"
          @input="onNumberInput"
        >
        <span v-if="unit" class="text-xs text-slate-500">{{ unit }}</span>
      </div>
    </div>
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step ?? 1"
      :disabled="disabled"
      class="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-accent-500 disabled:cursor-not-allowed"
      @input="onInput"
    >
    <p v-if="description" class="mt-1 text-xs text-slate-500">{{ description }}</p>
  </div>
</template>
