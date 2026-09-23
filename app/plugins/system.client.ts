export default defineNuxtPlugin(() => {
  const system = useSystemStore()
  system.init()

  const devAuth = useDevAuth()
  devAuth.restore()
})
