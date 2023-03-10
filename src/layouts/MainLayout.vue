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
        <router-view />
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
