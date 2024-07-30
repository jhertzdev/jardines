import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { AxiosError } from 'axios';

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

//const api = axios.create({ baseURL: 'http://jardines-backend.test/api' })
const api = axios.create({ baseURL: 'http://192.168.94.1/jardines-backend/public/api' })

if (localStorage.getItem('token')) {
  api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
}

export default boot(({ app, router }) => {

  api.interceptors.request.use(function (config) {
    //console.log('Intercepting request...', config);
    return config;
  }, function (error) {
    // Do something with request error
    // console.log('Request error...', error);
    return Promise.reject(error);
  });

  api.interceptors.response.use((response) => {

    // Enviar token en la siguiente petición
    if (response?.statusText === 'OTP-Token') {
      api.defaults.headers.common['OTP-Token'] = response.data.token
    }

    /* if (response.status === 401) { } */

    return response;
  }, async (error: AxiosError) => {

    //+++console.log(error.response);

    // Eliminar token
    if (error?.response?.data?.error === 'OTP_TOKEN_REQUIRED') {
      delete api.defaults.headers.common['OTP-Token']
    }

    const publicPages = ['/auth/login', '/auth/logout'];
    const authRequired = !publicPages.includes(router.currentRoute.value.path);

    if (authRequired) {
      try {
        let response = await api.get('auth/check')
        console.log('Checking auth...', response.data);

        if (!response.data) {
          router.push('/auth/logout')
          return Promise.reject('Unauthorized');
        }
      } catch (error) {
        router.push('/auth/logout')
        return Promise.reject('Unauthorized');
      }
    }

    return Promise.reject(error);
  });


  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
