<script setup lang="ts">
const links = [
  { to: '/dev', label: 'Tableau de bord', icon: 'lucide:layout-dashboard' },
  { to: '/dev/tuning', label: 'Réglages fins', icon: 'lucide:sliders-horizontal' },
  { to: '/dev/logs', label: 'Journaux', icon: 'lucide:scroll-text' }
]
</script>

<template>
  <nav class="flex gap-1 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="tap-target flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 md:w-full"
      active-class="!bg-accent-500/15 !text-accent-300"
    >
      <Icon :name="link.icon" class="h-5 w-5" />
      <span>{{ link.label }}</span>
    </NuxtLink>
  </nav>
</template>
