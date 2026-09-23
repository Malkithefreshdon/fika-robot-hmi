<script setup lang="ts">
const emit = defineEmits<{ unlock: [] }>()

const devAuth = useDevAuth()
const pin = ref('')
const error = ref(false)

function press(digit: string) {
  if (pin.value.length >= 6) return
  pin.value += digit
  error.value = false
}

function backspace() {
  pin.value = pin.value.slice(0, -1)
}

function submit() {
  if (devAuth.tryUnlock(pin.value)) {
    emit('unlock')
  } else {
    error.value = true
    pin.value = ''
  }
}

watch(pin, (val) => {
  if (val.length >= 4) submit()
})

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back']
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-slate-925 px-6 text-slate-100">
    <div class="mb-8 flex flex-col items-center gap-3 text-center">
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
        <Icon name="lucide:lock" class="h-6 w-6 text-accent-400" />
      </span>
      <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold">Technician mode</h1>
      <p class="max-w-xs text-sm text-slate-300">Staff only — enter the access code to tune and supervise the system.</p>
    </div>

    <div class="mb-6 flex gap-3" :class="{ 'animate-[shake_.3s]': error }">
      <span
        v-for="i in 4"
        :key="i"
        class="h-3.5 w-3.5 rounded-full border-2 transition-colors"
        :class="pin.length >= i ? 'border-accent-400 bg-accent-400' : 'border-slate-700'"
      />
    </div>
    <p v-if="error" class="mb-4 text-sm font-medium text-danger-400">Incorrect code, try again.</p>

    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="d in digits"
        :key="d"
        type="button"
        class="tap-target flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-medium transition active:scale-95"
        :class="d === '' ? 'invisible' : 'bg-slate-850 text-slate-100 hover:bg-slate-800'"
        :disabled="d === ''"
        @click="d === 'back' ? backspace() : press(d)"
      >
        <Icon v-if="d === 'back'" name="lucide:delete" class="h-5 w-5" />
        <span v-else>{{ d }}</span>
      </button>
    </div>

    <NuxtLink to="/" class="mt-10 text-sm text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline">
      ← Back to customer screen
    </NuxtLink>
  </div>
</template>
