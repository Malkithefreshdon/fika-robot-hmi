<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name?: string }>).map((l) => ({ code: l.code, name: l.name ?? l.code }))
)

function onChange(e: Event) {
  setLocale((e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="relative">
    <label class="sr-only" for="language-switcher">{{ $t('language.label') }}</label>
    <select
      id="language-switcher"
      class="tap-target appearance-none rounded-full bg-white/70 pl-4 pr-9 text-sm font-medium text-roast-600 shadow-sm ring-1 ring-roast-500/10 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500"
      :value="locale"
      @change="onChange"
    >
      <option v-for="l in availableLocales" :key="l.code" :value="l.code">{{ l.name }}</option>
    </select>
    <Icon name="lucide:chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-roast-500/60" />
  </div>
</template>
