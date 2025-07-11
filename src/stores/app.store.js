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
    iva: 0.16,
    igtf: 0.03,
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
    getPrecioConIva(precio) {
      precio = parseFloat(precio)
      return precio + precio * this.iva
    },
    getPrecioCompleto(precio) {
      precio = this.getPrecioConIva(precio)
      return precio + precio * this.igtf
    },
    getPrecioBase(precio) {
      precio = precio / (1 + this.igtf)
      return precio / (1 + this.iva)
    },
    getPrecioProducto(producto) {
      if (producto.requiere_impuestos == 'R') {
        return this.getPrecioCompleto(producto.precio_ref)
      } else {
        return parseFloat(producto.precio_ref)
      }
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
