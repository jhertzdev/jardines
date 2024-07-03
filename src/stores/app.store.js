import { defineStore } from 'pinia'
import { api } from 'src/boot/axios';

export const useAppStore = defineStore('app', {
  state: () => ({
    modalMessage: null,
    modalIsVisible: false,
    notifications: [],
    metodosDePago: [],
    monedas: [],
    cajaSeleccionada: JSON.parse(localStorage.getItem("cajaSeleccionada")) || {},
  }),
  actions: {
    getMetodosDePago() {
      api.get('/caja/metodos')
        .then(response => this.metodosDePago = response.data)
    },
    getMonedas() {
      api.get('/caja/monedas')
        .then(response => this.monedas = response.data)
    },
    seleccionarCaja(caja) {
      this.cajaSeleccionada = caja
      localStorage.setItem("cajaSeleccionada", JSON.stringify(caja))
    }
  }
})
