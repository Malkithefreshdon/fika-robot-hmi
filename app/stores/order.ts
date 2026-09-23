import { defineStore } from 'pinia'
import { DEFAULT_SERVING_MODE, type CupSize, type Order, type OrderOptions, type ServingMode } from '~/types'

function freshDraft(): OrderOptions {
  return { size: 'medium', milk: false, mode: DEFAULT_SERVING_MODE }
}

export const useOrderStore = defineStore('order', {
  state: () => ({
    draft: freshDraft(),
    current: null as Order | null,
    history: [] as Order[]
  }),

  getters: {
    isActive: (state) => !!state.current && state.current.stage !== 'completed'
  },

  actions: {
    setDraftSize(size: CupSize) {
      this.draft = { ...this.draft, size }
    },

    setDraftMilk(milk: boolean) {
      this.draft = { ...this.draft, milk }
    },

    setDraftMode(mode: ServingMode) {
      this.draft = { ...this.draft, mode }
    },

    resetDraft() {
      this.draft = freshDraft()
    },

    confirmOrder() {
      const order = useSystemStore().submitOrder(this.draft)
      if (order) this.current = order
      return order
    },

    applyOrderUpdate(order: Order) {
      // The mock/live backend always knows the real ticket + timestamps; trust it.
      this.current = order
    },

    archiveIfCompleted() {
      if (this.current && (this.current.stage === 'completed' || this.current.faulted)) {
        this.history.unshift(this.current)
        if (this.history.length > 20) this.history.length = 20
      }
    },

    confirmPickup() {
      if (!this.current) return
      useSystemStore().markPickedUp(this.current.id)
    },

    clearCurrent() {
      this.archiveIfCompleted()
      this.current = null
      this.resetDraft()
    }
  }
})
