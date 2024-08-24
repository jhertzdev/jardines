import { boot } from 'quasar/wrappers'
import { api } from 'boot/axios'
import GridLayout from 'vue3-drr-grid-layout'
import 'vue3-drr-grid-layout/dist/style.css'
import { Notify, Dialog } from 'quasar';

const slugify = str =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const qNotify = (content, type = 'positive', params = {}) => {

  console.log(content)

  if (type == 'error') {
    console.log('error', content?.response);

    let message;

    if (typeof content === 'string') {
      message = content;
    } else if (!!content?.response?.data?.messages) {
      message = Object.values(content.response.data.messages).join(' ')
    } else if (content?.response?.data?.error) {
      message = content?.response?.data?.error
    } else if (content?.response?.data?.message) {
      message = content?.response?.data?.message
    }

    let error = content?.response?.data?.error;

    if (error === 'OTP_TOKEN_REQUIRED') {

      Dialog.create({
        title: 'Contraseña requerida',
        message,
        prompt: {
          model: '',
          type: 'password'
        },
        cancel: true,
        persistent: true
      })
      .onOk(password => {

        api.post('auth/token/generate', {password})
          .then(response => {
            if (params?.callback) params.callback()
          })
          .catch(error => {
            Notify.create(
              {
                message: error?.response?.data?.messages?.error || 'Ha ocurrido un error',
                color: 'negative'
              }
            )
          })

      })

    } else {

      Notify.create({ message: message || error || 'Ha ocurrido un error', color: 'negative' })

    }

  }

  if (type == 'positive') {
    Notify.create({ message: content, color: 'positive' })
  }

}

/*import {
  Notify
} from 'quasar'

function titleCase (string) {
  if (typeof string !== 'string') {
    return new Error('Expected string as a parameter')
  }

  return string
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.substring(1, word.length))
    .join(' ')
}

function notifySuccess (message) {
  Notify.create({
    color: 'green',
    position: 'top',
    icon: 'done',
    message: message || 'Los datos se han cargado, estamos listos!',
  })
}

function notifyFailure (message) {
  Notify.create({
    color: 'negative',
    position: 'top',
    icon: 'report_problem',
    message: message || 'La acción ha fallado, por favor intente de nuevo'
  })
}

function checkRole (role) {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user) {
    // console.log('checkRole', role, user.roles)
    return Boolean(user.roles.indexOf(role) >= 0)
  }
  return false
}

function checkUserRole (user, role) {
  if (user) {
    // console.log('checkRole', role, user.roles)
    return Boolean(user.roles.indexOf(role) >= 0)
  }
  return false
}

function onlyAdmins () {
  return checkRole('developer') || checkRole('admin')
}*/

const $usd = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const $bs = (amount) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const $dinero = (amount) => {
  let formateado = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(amount);

  // Remover el símbolo de la moneda
  return formateado.replace(/[^0-9.,-]+/g,"");
}

const $toFixed = (num) => {
  return parseFloat(num).toFixed(2)
}

const obtenerValoresFaltantes = (arr1, arr2) => {
  const valuesArr2 = arr2.map(obj => obj.value);
  return arr1.filter(val => !valuesArr2.includes(val));
}

function obtenerParcelaExhumableId(parcelas) {
  let maxIndice = -Infinity;
  let idParcelaMasAlta = undefined;

  for (let i = 0; i < parcelas.length; i++) {
    const parcela = parcelas[i];
    if (parseInt(parcela.ocupado) === 1 && parcela.indice > maxIndice) {
      maxIndice = parcela.indice;
      idParcelaMasAlta = parcela.id;
    }
  }

  return idParcelaMasAlta;
}

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app, router }) => {

  app.config.globalProperties.$money = {
    $usd,
    $bs,
    $dinero,
  }

  app.use(GridLayout)

})

export { slugify, qNotify, $usd, $bs, $dinero, $toFixed, obtenerValoresFaltantes, obtenerParcelaExhumableId }
