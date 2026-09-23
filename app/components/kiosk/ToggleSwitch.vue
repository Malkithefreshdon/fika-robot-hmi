<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    class="tap-target relative inline-flex h-9 w-16 shrink-0 items-center rounded-full transition-colors"
    :class="modelValue ? 'bg-accent-500' : 'bg-slate-300/60'"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform"
      :class="modelValue ? 'translate-x-8' : 'translate-x-1'"
    />
  </button>
</template>
