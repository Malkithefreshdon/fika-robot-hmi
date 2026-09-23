<script setup lang="ts">
import type { OrderStage, ServingMode } from '~/types'

const props = defineProps<{
  stage: OrderStage
  milk: boolean
  mode: ServingMode
  faulted: boolean
}>()

const { t } = useI18n()

interface Step {
  stage: OrderStage
  labelKey: string
  icon: string
}

const defaultModeSteps: Step[] = [
  { stage: 'queued', labelKey: 'status.steps.queued', icon: 'lucide:clipboard-check' },
  { stage: 'weigh_pot', labelKey: 'status.steps.weighPot', icon: 'lucide:scale' },
  { stage: 'place_glass', labelKey: 'status.steps.placeGlass', icon: 'lucide:package-open' },
  { stage: 'pour_coffee', labelKey: 'status.steps.pourCoffee', icon: 'lucide:droplets' },
  { stage: 'pour_milk', labelKey: 'status.steps.pourMilk', icon: 'lucide:milk' },
  { stage: 'deliver', labelKey: 'status.steps.deliver', icon: 'lucide:hand-platter' },
  { stage: 'ready', labelKey: 'status.steps.ready', icon: 'lucide:party-popper' }
]

const stylishModeSteps: Step[] = [
  { stage: 'queued', labelKey: 'status.steps.queued', icon: 'lucide:clipboard-check' },
  { stage: 'grab_items', labelKey: 'status.steps.grabItems', icon: 'lucide:hand' },
  { stage: 'pour_coffee', labelKey: 'status.steps.pourCoffee', icon: 'lucide:droplets' },
  { stage: 'pour_milk', labelKey: 'status.steps.pourMilk', icon: 'lucide:milk' },
  { stage: 'deliver', labelKey: 'status.steps.deliver', icon: 'lucide:hand-platter' },
  { stage: 'ready', labelKey: 'status.steps.ready', icon: 'lucide:party-popper' }
]

const steps = computed(() => {
  const base = props.mode === 'stylish' ? stylishModeSteps : defaultModeSteps
  return base.filter((s) => s.stage !== 'pour_milk' || props.milk)
})

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
          {{ t(step.labelKey) }}
        </p>
        <p v-if="status(index) === 'active' && !faulted" class="text-sm text-accent-600">{{ t('status.inProgress') }}</p>
        <p v-if="status(index) === 'active' && faulted" class="text-sm text-danger-600">{{ t('status.faultTitle') }}</p>
      </div>
    </li>
  </ol>
</template>
