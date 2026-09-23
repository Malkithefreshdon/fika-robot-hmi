<script setup lang="ts">
import type { OrderStage } from '~/types'

const props = defineProps<{
  stage: OrderStage
  milk: boolean
  faulted: boolean
}>()

interface Step {
  stage: OrderStage
  label: string
  icon: string
}

const allSteps: Step[] = [
  { stage: 'queued', label: 'Commande reçue', icon: 'lucide:clipboard-check' },
  { stage: 'pick_mug', label: 'Préparation de la tasse', icon: 'lucide:coffee' },
  { stage: 'pour_coffee', label: 'Versement du café', icon: 'lucide:droplets' },
  { stage: 'pour_milk', label: 'Ajout du lait', icon: 'lucide:milk' },
  { stage: 'deliver', label: 'Livraison', icon: 'lucide:hand-platter' },
  { stage: 'ready', label: 'Prêt à récupérer', icon: 'lucide:party-popper' }
]

const steps = computed(() => allSteps.filter((s) => s.stage !== 'pour_milk' || props.milk))

const currentIndex = computed(() => steps.value.findIndex((s) => s.stage === props.stage))

function status(index: number): 'done' | 'active' | 'upcoming' {
  if (index < currentIndex.value) return 'done'
  if (index === currentIndex.value) return 'active'
  return 'upcoming'
}
</script>

<template>
  <ol class="flex flex-col gap-1">
    <li v-for="(step, index) in steps" :key="step.stage" class="flex gap-4">
      <div class="flex flex-col items-center">
        <span
          class="tap-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors"
          :class="{
            'bg-success-500 text-white': status(index) === 'done',
            'bg-danger-500 text-white': status(index) === 'active' && faulted,
            'bg-accent-500 text-white animate-pulse': status(index) === 'active' && !faulted,
            'bg-cream-200 text-roast-400/50': status(index) === 'upcoming'
          }"
        >
          <Icon v-if="status(index) === 'done'" name="lucide:check" class="h-5 w-5" />
          <Icon v-else-if="status(index) === 'active' && faulted" name="lucide:alert-triangle" class="h-5 w-5" />
          <Icon v-else :name="step.icon" class="h-5 w-5" />
        </span>
        <span
          v-if="index < steps.length - 1"
          class="my-1 w-0.5 flex-1 rounded-full"
          :class="status(index) === 'done' ? 'bg-success-500' : 'bg-cream-200'"
          style="min-height: 1.5rem"
        />
      </div>
      <div class="pb-6 pt-2">
        <p
          class="font-medium"
          :class="status(index) === 'upcoming' ? 'text-roast-400/50' : 'text-ink-900'"
        >
          {{ step.label }}
        </p>
        <p v-if="status(index) === 'active' && !faulted" class="text-sm text-accent-600">En cours…</p>
        <p v-if="status(index) === 'active' && faulted" class="text-sm text-danger-600">Un imprévu est survenu</p>
      </div>
    </li>
  </ol>
</template>
