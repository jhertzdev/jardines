import { boot } from 'quasar/wrappers'
import GridLayout from 'vue3-drr-grid-layout'
import 'vue3-drr-grid-layout/dist/style.css'
import { Notify } from 'quasar';

const slugify = str =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const qNotify = (content, type = 'positive') => {

  if (type == 'error') {
    console.log('error', content);
    let message = !!content?.response?.data?.messages ?
      Object.values(content.response.data.messages).join(' ') :
      'Ha ocurrido un error.'
    Notify.create({ message, color: 'negative' })
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

const $toFixed = (num) => {
  return parseFloat(num).toFixed(2)
}

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app, router }) => {

  app.config.globalProperties.$money = {
    $usd,
    $bs,
  }

  app.use(GridLayout)

})

export { slugify, qNotify, $usd, $bs, $toFixed }
