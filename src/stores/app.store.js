import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    modalMessage: null,
    modalIsVisible: false,
    notifications: []
  }),
})
