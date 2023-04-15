<template>
  <div class="q-pb-lg text-center" v-if="isLoading">
    <q-spinner size="xl" color="primary" />
  </div>

  <template v-else>
    <q-form @submit="handleSubmitMasterPassword">
      <q-card class="q-pa-md q-mb-lg">
        <q-card-section>
          <div class="text-h6">Contraseña maestra</div>
        </q-card-section>
    
        <q-card-section>
          <q-input type="password" v-model="masterPassword" label="Contraseña" hint="Escribe una contraseña segura, de 8 caracteres como mínimo.">
            <template v-slot:append>
              <q-btn color="primary" label="Guardar contraseña" :loading="isLoadingSubmitMasterPassword" @click="handleSubmitMasterPassword" :disable="masterPassword.length < 8"/>
            </template>
          </q-input>
        </q-card-section>
    
      </q-card>
    </q-form>

    <q-form @submit="handleSubmitPermisos">
      <q-card class="q-pa-md q-mb-lg">
        <q-card-section>
          <div class="text-h6">Permisos de usuarios</div>
        </q-card-section>
    
        <q-card-section>
          <div class="row">
            <div class="col-12 col-sm-6" v-for="(grupo, key) in permissions?.groups || []">
              <div class="text-weight-bold text-center">{{ grupo.title }}</div>
              <q-tree class="col-12 col-sm-6" :nodes="options[key]" tick-strategy="strict" v-model:ticked="ticked[key]" node-key="key" default-expand-all/>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn color="primary" type="submit" label="Guardar permisos" :loading="isLoadingSubmitPermisos"/>
        </q-card-actions>
    
      </q-card>
    </q-form>
  </template>
</template>

<style>
  .q-tree__node--parent > .q-tree__node-header {
    text-transform: capitalize;
  }
</style>

<script setup>

import { api } from 'src/boot/axios'
import { qNotify } from 'src/boot/jardines';
import { ref, onMounted, computed } from 'vue'

const isLoading = ref(true)
const isLoadingSubmitPermisos = ref(false)
const isLoadingSubmitMasterPassword = ref(false)

const permissions = ref(null);
const ticked = ref({})

const options = computed(() => {
  const treeOptions = {};

  for (const group of Object.keys(permissions?.value?.groups || {})) {
    treeOptions[group] = convertirPermisosAOpciones(permissions?.value?.permissions || {}, group)
  }

  return treeOptions;
})

function convertirPermisosAOpciones(permisos, grupo) {
  const opciones = [];

  for (const [clave, subarbol] of Object.entries(permisos)) {
    const raiz = clave.split('.')[0];
    const subopciones = [];

    for (const [subclave, descripcion] of Object.entries(subarbol)) {
      subopciones.push({
        key: subclave,
        label: descripcion,
        disabled: ticked.value[grupo].includes(clave)
      });
    }

    opciones.push({
      key: clave,
      label: raiz,
      children: subopciones,
    });
  }

  return opciones;
}

const handleSubmitPermisos = () => {
  isLoadingSubmitPermisos.value = true;

  api.post('configuracion/permisos', ticked.value)
    .then(response => {
      if (response.data) {
        console.log(response.data);
        qNotify('Permisos editados exitosamente.');
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingSubmitPermisos.value = false)

}

// Contraseña maestra
const masterPassword = ref('')
const handleSubmitMasterPassword = () => {

  isLoadingSubmitMasterPassword.value = true;

  api.post('configuracion/master-password', {password: masterPassword.value})
    .then(response => {
      if (response.data) {
        console.log(response.data);
        qNotify('Contraseña maestra editada exitosamente.');
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingSubmitMasterPassword.value = false)

}

onMounted(() => {
  api.get('pages/configuracion')
    .then(response => {
      if (response.data) {
        permissions.value = response.data.permissions;
        for (const group of Object.keys(response.data.permissions.groups)) {
          ticked.value[group] = response.data.permissions.matrix[group] || []
        }
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoading.value = false)
});

</script>