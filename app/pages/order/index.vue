<script setup lang="ts">
import { CUP_SIZES, CUP_SIZE_LABELS, type CupSize } from '~/types'

definePageMeta({ layout: 'kiosk' })

const order = useOrderStore()
const system = useSystemStore()
const router = useRouter()

function chooseSize(size: CupSize) {
  order.setDraftSize(size)
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
        Votre café, à votre goût
      </h1>
    </div>

    <section>
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-roast-400">Taille de tasse</h2>
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
          <span class="text-lg font-semibold text-roast-600">{{ CUP_SIZE_LABELS[size] }}</span>
          <span class="text-sm text-roast-400">{{ system.params.sequence.cupVolumeMl[size] }} ml</span>
        </button>
      </div>
    </section>

    <section class="flex items-center justify-between rounded-3xl bg-white/80 p-6 shadow-sm">
      <div class="flex items-center gap-3">
        <Icon name="lucide:milk" class="h-7 w-7 text-roast-400" />
        <div>
          <p class="font-semibold text-roast-600">Ajouter du lait</p>
          <p class="text-sm text-roast-400">Le robot versera une touche de lait après le café</p>
        </div>
      </div>
      <ToggleSwitch :model-value="order.draft.milk" @update:model-value="order.setDraftMilk" />
    </section>

    <button
      type="button"
      class="tap-target w-full rounded-2xl bg-roast-500 px-6 py-5 text-xl font-semibold text-white shadow-kiosk transition hover:bg-roast-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
      :disabled="!system.systemReady"
      @click="confirm"
    >
      Confirmer la commande
    </button>
    <p v-if="!system.systemReady" class="-mt-4 text-center text-sm text-danger-600">
      Le système n'est pas disponible pour le moment.
    </p>
  </div>
</template>
