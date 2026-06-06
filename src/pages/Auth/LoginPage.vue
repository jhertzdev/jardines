<template>
  <q-page class="flex column flex-center bg-green">
    <q-card elevated square class="login-card q-pa-md q-mt-xl">


      <q-card-section class="section-header" style="border: 1px solid var(--q-primary)">
        <img src="img/logo-cementerio.png" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">

          <q-banner dense rounded class="bg-red text-white" v-if="!isAvailableConnection">
            <template v-slot:avatar>
              <q-icon name="warning" color="white" />
            </template>
            <span>No se pudo establecer conexión con el servidor.</span>
          </q-banner>

          <q-banner dense rounded class="bg-positive text-white text-left" v-if="updateAvailable">
            <template v-slot:avatar>
              <q-icon name="system_update" color="white" />
            </template>
            <span>Actualización disponible: {{ updateOutput }}</span>
            <template v-slot:action>
              <q-btn flat dense label="Actualizar" text-color="white" @click="handleUpdate" :loading="isUpdating" />
            </template>
          </q-banner>

          <q-input square outlined v-model="loginData.email" label="Nombre de usuario" lazy-rules
            :rules="[val => val && val.length > 0 || 'Escribe un nombre de usuario']">
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>
          <q-input square outlined v-model="loginData.password" label="Contraseña" lazy-rules
            :rules="[val => val && val.length > 0 || 'Escribe una contraseña']" type="password">
            <template v-slot:prepend>
              <q-icon name="password" />
            </template>
          </q-input>
          <q-separator inset />
          <q-btn class="q-mt-lg" type="submit" square color="primary" unelevated label="Iniciar sesión"
            :loading="isLoading" :disabled="!isAvailableConnection" />
        </q-form>

        <div class="text-caption text-grey-6 q-mt-md" v-if="appVersion">v{{ appVersion }}</div>
      </q-card-section>

    </q-card>
  </q-page>
</template>

<style lang="scss">
.login-card {
  width: 400px;
  max-width: calc(100% - 30px);
  text-align: center;
  padding-top: 80px;

  .section-header {
    position: absolute;
    width: 150px;
    height: 150px;
    top: -75px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fff;
    box-shadow: 0 0 5px #000c;
    border-radius: 50% !important;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

@media (min-width: 1280px) {
  .login-card {
    padding-top: 130px;
  }

  .login-card .section-header {
    width: 240px;
    height: 240px;
    top: -120px;
  }
}
</style>

<script setup>

import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { api } from 'src/boot/axios';
import axios from 'axios';
import { is, useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth.store'

const authStore = useAuthStore()

const isLoading = ref(false)

const $q = useQuasar()

const loginData = reactive({
  email: "",
  password: "",
})

const isAvailableConnection = ref(true)

const checkConnectionInterval = ref(null)

const checkConnection = (params = {}) => {
  axios.get(api.defaults.baseURL + '/auth/check', { timeout: 3000 })
    .then(response => {
      isAvailableConnection.value = true
    })
    .catch(error => {
      if (params.error) {
        params.error()
      }
      isAvailableConnection.value = false
      isLoading.value = false
      console.log('Error connecting to server...', error);
    })
}

const initializeConnection = () => {
  checkConnectionInterval.value = setInterval(() => {
    checkConnection()
  }, 5000);
}

const appVersion = ref(null)
const updateAvailable = ref(false)
const updateOutput = ref('')
const isUpdating = ref(false)

const getAppVersion = async () => {
  if (window.electronAPI) {
    try {
      appVersion.value = await window.electronAPI.getAppVersion()
    } catch (e) {
      console.log('Error getting app version:', e)
    }
  }
}

const parseVersion = (filename) => {
  const match = filename.match(/v?(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

const compareVersions = (a, b) => {
  const aParts = a.split('.').map(Number)
  const bParts = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (aParts[i] > bParts[i]) return 1
    if (aParts[i] < bParts[i]) return -1
  }
  return 0
}

const checkForUpdates = () => {
  if (!appVersion.value) return
  axios.get(api.defaults.baseURL + '/configuracion/version', { timeout: 10000 })
    .then(response => {
      if (response.data && response.data.filename) {
        const latestVersion = parseVersion(response.data.filename)
        if (latestVersion && compareVersions(latestVersion, appVersion.value) > 0) {
          updateAvailable.value = true
          updateOutput.value = response.data.filename
        }
      }
    })
    .catch(e => {
      console.log('Error checking updates:', e)
      // Retry after a delay
      setTimeout(checkForUpdates, 10000)
    })
}

const handleUpdate = async () => {
  isUpdating.value = true
  if (window.electronAPI) {
    try {
      await window.electronAPI.runUpdater()
    } catch (e) {
      console.log('Error running updater:', e)
    }
  }
  isUpdating.value = false
}

onMounted(async () => {
  await getAppVersion()
  checkForUpdates()
  checkConnection()
  initializeConnection()
})

onBeforeUnmount(() => {
  console.log('Unmounting...');
  clearInterval(checkConnectionInterval.value)
})

const handleLogin = async () => {
  isLoading.value = true
  await authStore.login(loginData)
  isLoading.value = false
}

</script>
