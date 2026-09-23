<script setup lang="ts">
import { CUP_SIZES, SERVING_MODES, type CupSize, type ServingMode } from '~/types'

definePageMeta({ layout: 'kiosk' })

const order = useOrderStore()
const system = useSystemStore()
const router = useRouter()
const { t } = useI18n()

const sizeLabelKeys: Record<CupSize, string> = {
  small: 'order.sizeSmall',
  medium: 'order.sizeMedium',
  large: 'order.sizeLarge'
}

const modeCopy = computed<Record<ServingMode, { icon: string; name: string; tagline: string; description: string; disclaimer?: string }>>(() => ({
  default: {
    icon: 'lucide:scale',
    name: t('order.modeDefaultName'),
    tagline: t('order.modeDefaultTagline'),
    description: t('order.modeDefaultDescription')
  },
  stylish: {
    icon: 'lucide:sparkles',
    name: t('order.modeStylishName'),
    tagline: t('order.modeStylishTagline'),
    description: t('order.modeStylishDescription'),
    disclaimer: t('order.modeStylishDisclaimer')
  }
}))

function chooseSize(size: CupSize) {
  order.setDraftSize(size)
}

function chooseMode(mode: ServingMode) {
  order.setDraftMode(mode)
}

function confirm() {
  if (!system.systemReady) return
  order.confirmOrder()
  router.push('/order/status')
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center gap-3">
      <NuxtLink to="/" class="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-roast-600 shadow-sm hover:bg-white">
        <Icon name="lucide:arrow-left" class="h-5 w-5" />
      </NuxtLink>
      <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-roast-600 sm:text-3xl">
        {{ $t('order.title') }}
      </h1>
    </div>

    <section>
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-roast-400">{{ $t('order.glassSizeLabel') }}</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          v-for="size in CUP_SIZES"
          :key="size"
          type="button"
          class="tap-target flex flex-col items-center gap-2 rounded-3xl border-2 bg-white/80 p-6 text-center shadow-sm transition active:scale-[0.98]"
          :class="order.draft.size === size ? 'border-accent-500 bg-accent-500/5' : 'border-transparent hover:border-accent-500/30'"
          @click="chooseSize(size)"
        >
          <Icon name="lucide:coffee" class="h-8 w-8" :class="order.draft.size === size ? 'text-accent-600' : 'text-roast-400'" />
          <span class="text-lg font-semibold text-roast-600">{{ $t(sizeLabelKeys[size]) }}</span>
          <span class="text-sm text-roast-400">{{ system.params.sequence.cupVolumeMl[size] }} ml</span>
        </button>
      </div>
    </section>

    <section class="flex items-center justify-between rounded-3xl bg-white/80 p-6 shadow-sm">
      <div class="flex items-center gap-3">
        <Icon name="lucide:milk" class="h-7 w-7 text-roast-400" />
        <div>
          <p class="font-semibold text-roast-600">{{ $t('order.milkTitle') }}</p>
          <p class="text-sm text-roast-400">{{ $t('order.milkDescription') }}</p>
        </div>
      </div>
      <ToggleSwitch :model-value="order.draft.milk" @update:model-value="order.setDraftMilk" />
    </section>

    <section>
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-roast-400">{{ $t('order.modeSectionTitle') }}</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          v-for="mode in SERVING_MODES"
          :key="mode"
          type="button"
          class="tap-target flex flex-col gap-3 rounded-3xl border-2 bg-white/80 p-6 text-left shadow-sm transition active:scale-[0.98]"
          :class="order.draft.mode === mode ? 'border-accent-500 bg-accent-500/5' : 'border-transparent hover:border-accent-500/30'"
          @click="chooseMode(mode)"
        >
          <div class="flex items-center justify-between">
            <Icon :name="modeCopy[mode].icon" class="h-7 w-7" :class="order.draft.mode === mode ? 'text-accent-600' : 'text-roast-400'" />
            <span
              class="rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="mode === 'default' ? 'bg-success-500/10 text-success-600' : 'bg-accent-500/10 text-accent-600'"
            >
              {{ modeCopy[mode].tagline }}
            </span>
          </div>
          <p class="text-lg font-semibold text-roast-600">{{ modeCopy[mode].name }}</p>
          <p class="text-sm text-roast-500">{{ modeCopy[mode].description }}</p>
          <p v-if="modeCopy[mode].disclaimer" class="flex items-start gap-1.5 rounded-xl bg-warning-500/10 p-2.5 text-xs text-warning-600">
            <Icon name="lucide:info" class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {{ modeCopy[mode].disclaimer }}
          </p>
        </button>
      </div>
    </section>

    <button
      type="button"
      class="tap-target w-full rounded-2xl bg-roast-500 px-6 py-5 text-xl font-semibold text-white shadow-kiosk transition hover:bg-roast-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
      :disabled="!system.systemReady"
      @click="confirm"
    >
      {{ $t('order.confirmCta') }}
    </button>
    <p v-if="!system.systemReady" class="-mt-4 text-center text-sm text-danger-600">
      {{ $t('order.unavailable') }}
    </p>
  </div>
</template>
