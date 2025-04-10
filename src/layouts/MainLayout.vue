<template>
  <q-layout view="lHh Lpr lFf" :class="{ 'page-dashboard': $route.path == '/app' }">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          {{ route.meta.viewName || 'Jardines Santa Ana' }}
        </q-toolbar-title>

        <q-btn flat dense round icon="calculate" aria-label="Calculadora" @click="calculadoraDialog.openDialog()" />

        <q-btn-dropdown flat dense no-caps class="dropdown-menu-notifications q-mr-sm" auto-close>
          <template v-slot:label>
            <q-badge floating color="red" rounded :label="parseInt(appStore.notifications.length)" v-if="appStore.notifications.length" />
            <q-icon name="notifications" />
          </template>
          <q-list bordered separator wrap>
            <q-item style="width: 300px" class="bg-green-1" v-if="authStore.can('configuracion')">
              <q-item-section>
                <q-item-label caption class="text-center">
                  <q-btn flat dense icon="add" color="primary" label="Agregar alerta" @click="agregarEditarAlertaDialog.openDialog()" />
                </q-item-label>
              </q-item-section>
            </q-item>
            <NotificacionItem v-for="(notification, index) in appStore.notifications" :key="index"
              :id="notification.id"
              :message="notification.message"
              :importance="notification.importance"
              :created_at="notification.created_at"
              @vercontrato="(data) => verContratosDialog.openDialog(data.num_contrato, data.tipo_parcela)"
              @editar="(id) => agregarEditarAlertaDialog.openDialog(id)"
            />
            <q-item v-if="appStore.notifications.length === 0" style="width: 300px">
              <q-item-section>
                <q-item-label caption class="text-center">No hay notificaciones que mostrar.</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <DialogAlerta ref="agregarEditarAlertaDialog" />

        <q-btn flat dense round icon="search" aria-label="Buscar" @click="searchBar.toggleOpen()" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" :show-if-above="false" bordered behavior="mobile">
      <div class="q-py-lg text-center q-gutter-md">
        <q-avatar size="100px" font-size="82px" color="primary" text-color="white" icon="person" />
        <div class="text-h6">{{ authStore.user.username }}</div>
      </div>
      <q-separator />
      <q-list class="drawer-menu-list">
        <MenuLink v-for="link in essentialLinks" :key="link.title" v-bind="link" />
        <q-separator />
        <q-item clickable @click="$q.dark.set(false)" v-if="$q.dark.isActive">
          <q-item-section avatar>
            <q-icon name="light_mode" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Modo claro</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="$q.dark.set(true)" v-else>
          <q-item-section avatar>
            <q-icon name="dark_mode" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Modo oscuro</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <SearchBar ref="searchBar" />
      <q-page class="q-pa-lg">
        <q-breadcrumbs class="q-mb-lg">
          <q-breadcrumbs-el icon="arrow_back_ios" @click="router.go(-1)" label="Volver atrás" class="cursor-pointer" v-if="router.options.history.state.back !== '/auth/login'"/>
          <q-breadcrumbs-el :label="route.meta.viewName" :icon="route.meta.viewIcon" v-if="route.meta.viewName"/>
        </q-breadcrumbs>
        <router-view @toggleDrawer="val => leftDrawerOpen = val"/>
      </q-page>
      <DialogVerContratos ref="verContratosDialog" />
      <DialogCalculadora ref="calculadoraDialog" />
    </q-page-container>
  </q-layout>
</template>

<style>
.j-dialog .q-card {
  width: 480px;
  max-width: calc(100% - 30px);
}

.j-dialog.j-dialog-lg .q-card {
  width: 600px;
  max-width: calc(100% - 30px);
}

.j-dialog.j-dialog-xl .q-card {
  width: 1024px;
  max-width: calc(100% - 30px);
}

.j-dialog.j-dialog-xxl .q-card {
  width: 1200px;
  max-width: calc(100% - 30px);
}

.q-form.no-bottoms .q-field--with-bottom {
  padding-bottom: 0;
}

.form-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.input-num-parcela .q-field__prepend {
  line-height: 24px;
  padding-top: 24px;
  padding-bottom: 8px;
  font-weight: 400;
  font-size: 14px;
  position: relative;
}

.input-num-parcela .q-field__prepend:after {
  position: absolute;
  content: "-";
  right: 4px;
}

.input-num-parcela.q-field--dense .q-field__prepend {
  padding-top: 14px;
  padding-bottom: 2px;
}

.input-num-parcela.q-field--dense .q-field__prepend:after {
  right: 1.5px;
}

.j-table {
  border-spacing: 0;
  border-collapse: collapse;
}

.j-table th, .j-table td {
  padding: 6px 0;
}

.j-table thead {
  color: #fff;
  border-radius: 5px;
}

.j-table thead th {
  background-color: var(--q-primary);
}

.j-table thead th:first-child {
  border-radius: 5px 0 0 5px;
}

.j-table thead th:last-child {
  border-radius: 0 5px 5px 0;
}

.j-table tbody tr td {
  border: 1px solid #ccc;
}

.j-table tbody tr:first-child td {
  border-top: 0;
}

.j-table tbody tr td:first-child {
  border-left: 0;
}

.j-table tbody tr td:last-child {
  border-right: 0;
}

.j-table tbody tr:last-child td {
  border-bottom: 0;
}

.dialog-info-cliente .section-info .row:not(.no-borders) > div {
  outline: 1px solid #ccc;
  outline-offset: -2px;
  padding: 5px;
}

.dialog-info-cliente .section-info .row p {
  margin-bottom: 0;
}

.q-textarea.no-resize .q-field__native {
  resize: none;
}

.q-list .q-list {
  padding-left: 1rem;
  background: #9991;
}

.card-busqueda {
  z-index: 6001;
  transition: 0.2s;
  position: fixed;
  width: calc(100% - 50px);
  top: 70px;
  left: 25px;
  height: 160px;
}

.card-busqueda .q-markup-table th {
  white-space: nowrap;
}

.card-busqueda .q-markup-table .q-badge,
.card-busqueda .q-markup-table .badge-contrato {
  font-size: 0.7rem;
  margin-bottom: 2px;
  margin-right: 2px;
}

.card-busqueda .q-markup-table .q-badge:last-child,
.card-busqueda .q-markup-table .badge-contrato:last-child {
  margin-right: 0;
}

.card-busqueda .q-markup-table .q-badge {
  padding: 2px 3px;
}

.q-menu {
  z-index: 6001;
}

.left-drawer-open .card-busqueda {
  width: calc(100% - 350px);
  left: 325px;
}

.section-busqueda-open .q-page-container {
  padding-top: 230px !important;
}

.section-busqueda-open .q-layout.layout-auth .q-page-container {
  padding-top: inherit !important;
}

.q-body--prevent-scroll .card-busqueda {
  top: 25px;
}

.section-busqueda-open .q-dialog__inner {
  padding-top: 210px;
  align-items: start;
}

.section-busqueda-open .q-dialog .q-dialog__inner--minimized > div {
  max-height: calc(100vh - 230px);
}


.section-busqueda-open .results-wrapper::-webkit-scrollbar {
    width: 6px;
}

.section-busqueda-open .results-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.section-busqueda-open .results-wrapper::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: #888;
}

.section-busqueda-open .results-wrapper {
  height: calc(100% - 64px);
  overflow-y: scroll;
}

@media (min-width: 1024px) {
  .section-busqueda-open .results-wrapper {
    height: 100%;
  }
}

.results-table .q-table thead tr,
.results-table .q-table tbody tr,
.results-table .q-table tbody td {
  height: 24px;
}

.results-table .q-table thead th {
  line-height: 1;
}

.results-table .q-table tbody td,
.results-table .q-table thead th {
  padding: 0px 4px;
  line-height: 1;
}

.results-table .q-badge {
  margin-bottom: 1px;
}

.badge-contrato {
  display: inline-flex;
  margin-bottom: 1px;
}

.badge-contrato > span:first-child {
  border-radius: 5px 0 0 5px;
  background: var(--q-primary);
  border: 1px solid var(--q-primary);
  color: #fff;
  padding-left: 3px;
  padding-right: 2px;
  display: flex;
  align-items: center;
  text-wrap: nowrap;
}

.badge-contrato > span:last-child {
  border: 1px solid var(--q-primary);
  border-radius: 0 5px 5px 0;
  padding-left: 2px;
  padding-right: 3px;
}

.dropdown-menu-notifications .q-btn-dropdown__arrow-container {
  display: none;
}

</style>

<style lang="scss">
table.info-table {
  width: 100%;

  th {
    text-align: left;
  }

  td {
    text-align: right;
  }
}
</style>

<script setup>
import { ref, watch, toRef, onMounted, onUnmounted } from 'vue'
import MenuLink from 'src/components/MenuLink.vue'
import { useAuthStore } from 'src/stores/auth.store'
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar'
import { useAppStore } from 'src/stores/app.store';
import SearchBar from 'src/components/SearchBar.vue';

import DialogVerContratos from "src/components/popups/DialogVerContratos.vue";
import DialogCalculadora from "src/components/popups/DialogCalculadora.vue";
import DialogAlerta from "src/components/popups/DialogAlerta.vue";
import NotificacionItem from "src/components/NotificacionItem.vue";

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const searchBar = ref(null)
const verContratosDialog = ref(null)
const calculadoraDialog = ref(null)
const agregarEditarAlertaDialog = ref(null)

const showSectionBusqueda = ref(false)
const busqueda = ref('')

const permisos = authStore.user.role_perms;

const appStore = useAppStore()

const linksList = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    to: '/app',
  },
  {
    title: 'Clientes',
    icon: 'people',
    to: '/app/clientes',
    perms: 'clientes',
  },
  {
    title: 'Mantenimiento',
    icon: 'handyman',
    to: '/app/mantenimiento/ordenes',
    /*perms: 'mantenimiento',*/
  },
  {
    title: 'Servicios',
    icon: 'fence',
    to: '/app/servicios',
    count: 'servicios',
    /*perms: 'mantenimiento',*/
  },
  {
    title: 'Ubicaciones',
    children: [
      {
        title: 'Parcelas',
        icon: 'yard',
        to: '/app/parcelas',
      },
      {
        title: 'Nichos',
        icon: 'takeout_dining',
        to: '/app/nichos',
      },
      {
        title: 'Columbarios',
        icon: 'inventory',
        to: '/app/columbarios',
      },
    ]
  },
  {
    title: 'Contratos',
    icon: 'description',
    to: '/app/contratos',
    perms: 'contratos',
  },
  {
    title: 'Usuarios',
    icon: 'groups',
    to: '/app/usuarios',
    perms: 'usuarios',
  },
  {
    title: 'Caja',
    icon: 'point_of_sale',
    to: '/caja',
    perms: 'cajas'
  },
  {
    title: 'Configuración',
    icon: 'settings',
    to: '/app/configuracion',
    perms: 'configuracion',
  },
  {
    title: 'Cremación',
    icon: 'local_hospital',
    to: '/app/cremaciones',
  },
  {
    title: 'Auditoría',
    icon: 'manage_history',
    to: '/app/auditoria',
    perms: 'configuracion',
  },
  {
    title: 'Cerrar sesión',
    icon: 'logout',
    to: '/auth/logout',
  }
].filter(link => !link.perms || authStore.can(link.perms))

const leftDrawerOpen = ref(false)
const essentialLinks = linksList
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

watch(leftDrawerOpen, (value) => {
  if (leftDrawerOpen.value) {
    document.body.classList.add('left-drawer-open');
  } else {
    document.body.classList.remove('left-drawer-open');
  }
})

watch(router.currentRoute, () => {
  appStore.getNotificaciones()
  leftDrawerOpen.value = false
  document.body.classList.remove('left-drawer-open');
}, { immediate: true })

const $q = useQuasar();

watch(toRef(appStore, 'modalMessage'), () => {
  if (!appStore.modalIsVisible) {
    appStore.modalIsVisible = true
    $q.dialog({
      title: appStore.modalMessage.title,
      message: appStore.modalMessage.message
    }).onDismiss(() => {
      appStore.modalIsVisible = false
    })
  }
});

const handleTokenExpired = () => {
  if (appStore.modalIsVisible) return;

  appStore.modalIsVisible = true
  $q.dialog({
    title: 'Sesión expirada',
    message: 'Su sesión ha expirado. Por favor, vuelva a iniciar sesión.',
    persistent: false,
    cancel: true,
    ok: {
      label: 'Volver a iniciar sesión',
      color: 'primary',
      flat: true,
      icon: 'login'
    },
    cancel: {
      label: 'Cerrar',
      flat: true,
    }
  }).onOk(() => {
    router.push('/auth/login')
    appStore.modalIsVisible = false
  }).onDismiss(() => {
    appStore.modalIsVisible = false
  })

}

const handleNetworkError = () => {
  if (appStore.modalIsVisible) return;

  appStore.modalIsVisible = true
  $q.dialog({
    title: 'Error de conexión',
    message: 'No se pudo conectar con el servidor. Por favor, vuelva a intentarlo.',
    persistent: false,
    ok: {
      label: 'Cerrar',
      color: 'primary',
      flat: true,
    }
  }).onOk(() => {
    appStore.modalIsVisible = false
  })

}

onMounted(() => {
  window.addEventListener('TokenExpired', handleTokenExpired);
  window.addEventListener('NetworkError', handleNetworkError);

  appStore.getNotificaciones()
  showSectionBusqueda.value = false;
  document.body.classList.remove('section-busqueda-open');
  if (leftDrawerOpen.value) {
    document.body.classList.add('left-drawer-open');
  }
})

onUnmounted(() => {
  window.removeEventListener('TokenExpired', handleTokenExpired);
  window.removeEventListener('NetworkError', handleNetworkError);
})

</script>
