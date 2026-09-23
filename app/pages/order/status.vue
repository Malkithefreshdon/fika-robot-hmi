<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })

const order = useOrderStore()
const router = useRouter()

onMounted(() => {
  if (!order.current) router.replace('/')
})

watch(
  () => order.current?.stage,
  (stage) => {
    if (stage === 'completed') {
      setTimeout(() => {
        order.clearCurrent()
        router.replace('/')
      }, 2600)
    }
  }
)

function pickup() {
  order.confirmPickup()
}

function backToStart() {
  order.clearCurrent()
  router.replace('/')
}
</script>

<template>
  <div v-if="order.current" class="flex flex-col items-center gap-8 text-center">
    <!-- Fault state -->
    <template v-if="order.current.faulted">
      <span class="flex h-20 w-20 items-center justify-center rounded-full bg-danger-500/10">
        <Icon name="lucide:heart-handshake" class="h-10 w-10 text-danger-600" />
      </span>
      <div>
        <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-roast-600">
          Un imprévu est survenu
        </h1>
        <p class="mt-2 max-w-md text-roast-500">
          Toutes nos excuses — un membre du personnel a été automatiquement averti et va s'occuper de votre commande.
        </p>
      </div>
      <button
        type="button"
        class="tap-target rounded-2xl bg-roast-500 px-8 py-4 text-lg font-semibold text-white shadow-card transition hover:bg-roast-600"
        @click="backToStart"
      >
        Retour à l'accueil
      </button>
    </template>

    <!-- Completed -->
    <template v-else-if="order.current.stage === 'completed'">
      <span class="text-6xl">🎉</span>
      <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-roast-600">
        Bonne dégustation !
      </h1>
    </template>

    <!-- In progress / ready -->
    <template v-else>
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-roast-400">Commande</p>
        <p class="font-[family-name:var(--font-display)] text-3xl font-semibold text-roast-600">
          #{{ order.current.ticketNumber }}
        </p>
      </div>

      <div class="w-full max-w-md rounded-3xl bg-white/80 p-6 text-left shadow-card">
        <ProgressTracker :stage="order.current.stage" :milk="order.current.options.milk" :faulted="false" />
      </div>

      <button
        v-if="order.current.stage === 'ready'"
        type="button"
        class="tap-target w-full max-w-md rounded-2xl bg-success-500 px-8 py-5 text-xl font-semibold text-white shadow-kiosk transition hover:bg-success-600 active:scale-[0.98]"
        @click="pickup"
      >
        ✓ J'ai récupéré ma commande
      </button>
      <p v-else class="text-roast-400">Merci de patienter, votre café arrive…</p>
    </template>
  </div>
</template>
