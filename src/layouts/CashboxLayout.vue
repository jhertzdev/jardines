<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
      <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          {{ route.meta.viewName || 'Jardines Santa Ana' }}
        </q-toolbar-title>

        <q-btn flat dense round icon="search" aria-label="Buscar" @click="searchBar.toggleOpen()" />

        <div v-if="appStore.cajaSeleccionada?.id" class="flex items-center">
          <div v-for="moneda in appStore.monedas?.filter(moneda => !parseInt(moneda.es_principal))" :key="moneda.id" class="flex items-center text-caption q-mr-sm">
            <div>{{ moneda.simbolo }} {{ parseFloat(moneda.tasa).toFixed(2) }}</div>
          </div>
          <div class="text-h6">{{ appStore.cajaSeleccionada.nombre_caja }}</div>
          <div>
            <q-btn class="q-ml-xs" flat dense round icon="logout" aria-label="Cerrar sesión" @click="appStore.seleccionarCaja({})">
              <q-tooltip class="text-center q-pa-xs" style="line-height: 1">
                Regresar a ver todas las cajas
              </q-tooltip>
            </q-btn>
          </div>
        </div>

      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <div class="q-py-lg text-center q-gutter-md">
        <q-avatar size="100px" font-size="82px" color="primary" text-color="white" icon="person" />
        <div class="text-h6">{{ authStore.user.username }}</div>
      </div>
      <q-separator />
      <q-list>
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
        <router-view :leftDrawerOpen="leftDrawerOpen"/>
      </q-page>
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
  width: calc(100% - 80px);
  top: 70px;
  left: 40px;
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

.left-drawer-open:not(.q-body--prevent-scroll) .card-busqueda {
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
import { ref, watch, toRef, onMounted } from 'vue'
import MenuLink from 'src/components/MenuLink.vue'
import { useAuthStore } from 'src/stores/auth.store'
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar'
import { useAppStore } from 'src/stores/app.store';
import SearchBar from 'src/components/SearchBar.vue';

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const searchBar = ref(null)

const showSectionBusqueda = ref(false)
const busqueda = ref('')

const permisos = authStore.user.role_perms;

const linksList = [
  {
    title: 'Volver al inicio',
    to: '/app',
    icon: 'arrow_back',
  },
  {
    title: 'Caja',
    to: '/caja',
    icon: 'point_of_sale',
  },
  {
    title: 'Servicios y productos',
    to: '/caja/servicios',
    icon: 'yard',
  },
  /*{
    title: 'Transacciones',
    children: [
      {
        title: 'Recibos',
        icon: 'receipt',
        to: '/caja/recibos',
      },
      {
        title: 'Contratos',
        icon: 'description',
        to: '/caja/contratos',
      }
    ]
  },*/
  {
    title: 'Reportes',
    children: [
      {
        title: 'Reporte de ingresos',
        icon: 'assessment',
        to: '/caja/reportes/ingresos',
      },
    ]
  },
  {
    title: 'Cuentas y bancos',
    children: [
      {
        title: 'Bancos y cuentas',
        icon: 'account_balance',
        to: '/caja/bancos',
      },
      {
        title: 'Métodos de pago',
        icon: 'account_balance_wallet',
        to: '/caja/metodos',
      },
      {
        title: 'Monedas',
        icon: 'euro_symbol',
        to: '/caja/monedas',
      },
    ]
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

const $q = useQuasar()
const appStore = useAppStore()

// Ejecutar una acción cuando cambie de caja
watch(toRef(appStore, 'cajaSeleccionada'), (newValue) => {
  if (!newValue?.id) {
    router.push('/caja')
  }
})

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

onMounted(() => {
  showSectionBusqueda.value = false;
  document.body.classList.remove('section-busqueda-open');
  if (leftDrawerOpen.value) {
    document.body.classList.add('left-drawer-open');
  }
})

/*watch(showSectionBusqueda, () => {
  if (showSectionBusqueda.value) {
    document.body.classList.add('section-busqueda-open');
  } else {
    document.body.classList.remove('section-busqueda-open');
  }
});*/

</script>
