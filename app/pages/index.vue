<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })

const system = useSystemStore()
const order = useOrderStore()
const router = useRouter()

const canOrder = computed(() => system.systemReady)

function startOrder() {
  if (!canOrder.value) return
  order.resetDraft()
  router.push('/order')
}

function resumeOrder() {
  router.push('/order/status')
}
</script>

<template>
  <div class="flex flex-col items-center gap-10 text-center">
    <div class="flex flex-col items-center gap-4">
      <span class="text-6xl">☕</span>
      <h1 class="font-[family-name:var(--font-display)] text-4xl font-semibold text-roast-600 sm:text-5xl">
        Bonjour !
      </h1>
      <p class="text-lg text-roast-500 sm:text-xl">Que puis-je vous servir aujourd'hui ?</p>
    </div>

    <div v-if="order.isActive" class="w-full max-w-md rounded-3xl bg-white/80 p-6 shadow-card ring-1 ring-roast-500/5">
      <p class="mb-4 text-roast-600">Vous avez déjà une commande en préparation.</p>
      <button
        type="button"
        class="tap-target w-full rounded-2xl bg-roast-500 px-6 py-4 text-lg font-semibold text-white shadow-card transition hover:bg-roast-600 active:scale-[0.98]"
        @click="resumeOrder"
      >
        Suivre ma commande
      </button>
    </div>

    <template v-else>
      <button
        type="button"
        class="tap-target rounded-full bg-accent-500 px-12 py-6 text-2xl font-semibold text-white shadow-kiosk transition hover:bg-accent-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        :disabled="!canOrder"
        @click="startOrder"
      >
        Commander un café
      </button>

      <p v-if="!canOrder" class="max-w-sm text-sm text-danger-600">
        Le système n'est pas disponible pour le moment. Un membre du personnel a été prévenu — merci de patienter quelques instants.
      </p>
    </template>
  </div>
</template>
