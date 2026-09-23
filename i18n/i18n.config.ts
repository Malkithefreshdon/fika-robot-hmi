// Customer-facing kiosk screens only — the technician (/dev) screens are
// intentionally English-only and don't use these keys. Locale message
// files are lazy-loaded from ./locales via nuxt.config's i18n.locales.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en'
}))
