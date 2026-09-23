import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // This HMI runs as a kiosk app on a tablet mounted next to the robots —
  // there's no SEO need, and dropping SSR avoids hydration mismatches with
  // the WebSocket/localStorage-backed robot & order state.
  ssr: false,

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxtjs/i18n'
  ],

  // Customer-facing kiosk screens are translated; the technician (/dev)
  // screens are intentionally English-only, so they don't use $t() at all.
  i18n: {
    defaultLocale: 'sv',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    langDir: 'locales',
    locales: [
      { code: 'sv', name: 'Svenska', file: 'sv.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' }
    ]
  },

  css: ['~/assets/css/main.css'],

  components: [
    { path: '~/components/kiosk', pathPrefix: false },
    { path: '~/components/dev', pathPrefix: false }
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  fonts: {
    families: [
      { name: 'Fredoka', provider: 'google', weights: [500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600] }
    ]
  },

  icon: {
    mode: 'svg',
    // Force the local Nitro-served provider so icons resolve from the
    // installed @iconify-json/lucide package without needing internet
    // access — important since this runs as an offline kiosk app.
    provider: 'server',
    collections: ['lucide']
  },

  app: {
    head: {
      title: 'Fika Robot — Coffee Serving System',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1' },
        { name: 'theme-color', content: '#6F4E37' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      // 'mock' simulates the Python supervisory controller in-browser.
      // 'live' connects to the real supervisor via WebSocket (see app/services/backend).
      backendMode: 'mock',
      backendWsUrl: 'ws://localhost:8765',
      // Lightweight PIN to keep customers out of the tuning/dev screens.
      // Not real security — the real deployment should gate this at the OS/kiosk level.
      devPin: '1234'
    }
  }
})
