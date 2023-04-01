<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          {{ route.meta.viewName || 'Jardines Santa Ana' }}
        </q-toolbar-title>

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
      </q-list>
    </q-drawer>

    <q-page-container>
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


</style>

<script setup>
import { ref } from 'vue'
import MenuLink from 'src/components/MenuLink.vue'
import { useAuthStore } from 'src/stores/auth.store'
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const linksList = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    to: '/'
  },
  {
    title: 'Clientes',
    icon: 'people',
    to: '/clientes'
  },
  {
    title: 'Parcelas',
    icon: 'yard',
    to: '/parcelas'
  },
  {
    title: 'Contratos',
    icon: 'description',
    to: '/contratos'
  },
  {
    title: 'Usuarios',
    icon: 'groups',
    to: '/usuarios'
  },
  {
    title: 'Configuración',
    icon: 'settings',
    to: '/configuracion'
  },
  {
    title: 'Cerrar sesión',
    icon: 'logout',
    to: '/auth/logout'
  }
]

const leftDrawerOpen = ref(false)
const essentialLinks = linksList
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

</script>
