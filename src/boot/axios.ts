import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { AxiosError } from 'axios';

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
// const api = axios.create({ baseURL: 'https://jardines-backend.test/api' })
const api = axios.create({ baseURL: 'http://192.168.0.108/jardines-backend/public/api' })

if (localStorage.getItem('token')) {
  api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
}

/*api.interceptors.response.use((response) => {
  if (response.status === 401) {
    console.log('INTERCEPTED 401 ###: You are not authorized');
  }
  return response;
}, (error) => {
  console.log('Intercepted ERROR ### ', JSON.stringify(error));
  if (error.response && error.response.data) {
    return Promise.reject(error.response.data);
  }
  return Promise.reject(error.message);
});*/

export default boot(({ app, router }) => {

  api.interceptors.response.use((response) => {
    if (response.status === 401) {
      // Unauthorized
    }
    return response;
  }, async (error: AxiosError) => {

    const publicPages = ['/auth/login', '/auth/logout'];
    const authRequired = !publicPages.includes(router.currentRoute.value.path);

    if (authRequired) {
      try {
        let response = await api.get('auth/check')
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
