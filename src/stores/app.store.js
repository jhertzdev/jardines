import { defineStore } from 'pinia'
import { api } from 'src/boot/axios';

export const useAppStore = defineStore('app', {
  state: () => ({
    modalMessage: null,
    modalIsVisible: false,
    notifications: [],
    menuNotifications: {
      servicios: 0
    },
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
    },
    getNotificaciones() {
      api.get('notificaciones')
        .then(response => {
          if (response.data) {
            this.menuNotifications = response.data
            this.notifications = response.data?.notificaciones || []
          }
        })
        .catch(e => console.log(e))
    }
  }
})
