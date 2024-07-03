import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { useAppStore } from './app.store';

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    // initialize state from local storage to enable user to stay logged in
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem('token'),
    returnUrl: null,
  }),
  actions: {
    async login(credentials) {

      const appStore = useAppStore()

      try {

        const response = await api.post('/auth/login', credentials)

        if (response.data) {

          this.user = response.data.user;
          this.token = response.data.token;

          localStorage.setItem('user', JSON.stringify(this.user))
          localStorage.setItem('token', this.token)

          api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

          // redirect to previous url or default to Dashboard
          this.router.push(this.returnUrl || '/');
          return true

        } else {

          appStore.modalMessage = {
            title: 'Error',
            message: 'Ha ocurrido un error. Vuelve a intentarlo.'
          }

        }


      } catch (error) {

        let message = !!error?.response?.data?.messages ?
          Object.values(error.response.data.messages).join(' ') :
          'Ha ocurrido un error.'

        appStore.modalMessage = {
            title: 'Error',
            message
        }
      }

    },
    /*async register(userData) {
        const appStore = useAppStore()
        console.log(userData);
        if (!userData.name || !userData.email || !userData.password || !userData.role_id) {
            appStore.modalMessage = {
                title: 'Error',
                message: 'Todos los campos son requeridos.'
            }
            return;
        }

        userData.active = 1

        try {
            const response = await api.post('/register', userData)
            this.login(userData.email, userData.password, true)
        } catch (error) {
            console.log('Error', error);
            appStore.modalMessage = {
                title: 'Error',
                message: 'Ha ocurrido un error. Vuelve a intentarlo.'
            }
        }

    },*/
    logout() {
      this.user = null;
      this.returnUrl = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.router.push('/auth/login')
    },
    can(permiso) {

      let matriz = this.user?.role_perms || []

      for (let i = 0; i < matriz.length; i++) {
        const valor = matriz[i];

        // Si "permiso" no contiene punto, cualquiera de su tipo en la matriz lo validará como verdadero
        if (!permiso.includes('.') && valor.includes(permiso + '.') || valor === permiso) {
          return true;
        } else if (valor.includes('*')) {
          // Reemplazamos wildcard con .* para hacer coincidir con cualquier subpermiso de ese permiso.
          const patron = new RegExp('^' + valor.replace('*', '.*') + '$');
          if (patron.test(permiso)) {
            return true;
          }
        }
      }
      return false;
    }
  }
});
