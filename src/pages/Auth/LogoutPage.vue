<template>
  <q-page class="flex column flex-center">Cerrando sesión...</q-page>
</template>

<script setup>

import { useAuthStore } from 'stores/auth.store';
const appStore = useAuthStore();
appStore.logout()

</script>
