<template>
  <q-page class="flex column flex-center">
    <p>Cerrando sesión...</p>
    <q-btn icon="arrow_back_ios" color="primary" @click="router.push('/auth/login')">Volver a iniciar sesión</q-btn>
  </q-page>
</template>

<script setup>

import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth.store';
const appStore = useAuthStore();
const router = useRouter();
appStore.logout()

</script>
