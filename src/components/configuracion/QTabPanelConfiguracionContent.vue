<template>
  <div class="q-pb-lg text-center" v-if="isLoading">
    <q-spinner size="xl" color="primary" />
  </div>

  <template v-else>
    <q-form @submit.prevent @keydown.enter.prevent="">
      <q-card class="q-pa-md q-mb-lg">
        <q-card-section class="flex justify-between items-center">
          <div class="text-h6">Contraseñas activas ({{ passwords.length }})</div>
          <q-btn color="primary" class="q-ml-sm" label="Gestionar" icon="settings" @click="dialogGestionarContrasenas = true"/>
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

  <q-dialog allow-focus-outside v-model="dialogGestionarContrasenas" class="j-dialog j-dialog-lg" >
    <q-card class="q-pa-md">

      <q-card-section>

        <q-banner v-if="isEditing" class="bg-yellow-3 text-black q-mb-md">
          Estás editando la contraseña para el identificador de "<strong>{{ masterTag }}</strong>".
          <template v-slot:action>
            <q-btn primary color="primary" label="Dejar de editar" icon="close" @click="resetPasswordForm" />
          </template>
        </q-banner>
        
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-6">
            <q-input
              v-model="masterTag"
              label="Nombre o identificador"
              hint="Para identificar la contraseña en auditorías."
              outlined
              dense
              :disable="isEditing"
            />
          </div>
          <div class="col-6">
            <q-input
              type="password"
              v-model="masterPassword"
              ref="masterPasswordRef"
              label="Contraseña"
              outlined
              dense
              hint="Escribe una contraseña segura y única."
            />
          </div>
        </div>
        
        
        <div class="q-mt-md row justify-end">
          <q-btn
            v-if="!isEditing"
            color="primary"
            label="Crear nueva contraseña"
            :loading="isLoadingCreateMasterPassword"
            @click="handleCreateMasterPassword"
            :disable="masterPassword.length < 4 || !masterTag"
          />
          <q-btn
            v-else
            color="secondary"
            class="q-ml-sm"
            :label='`Actualizar contraseña de "${masterTag}"`'
            :loading="isLoadingUpdateMasterPassword"
            @click="handleUpdateMasterPassword"
            :disable="masterPassword.length < 4 || !masterTag"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-h6 q-mb-sm">Contraseñas activas</div>
        <q-table
          :rows="passwords"
          :columns="columns"
          row-key="tag"
          flat
          dense
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-x-xs">
              <q-btn color="primary" class="q-px-sm" dense size="sm" label="Editar" icon="edit" @click="selectMasterPassword(props.row); masterPasswordRef.focus()" />
              <q-btn color="negative" class="q-px-sm" dense size="sm" label="Eliminar" icon="delete" @click="deleteMasterPassword(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
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
import { useQuasar } from 'quasar';

const $q = useQuasar()

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

// Contraseñas maestras múltiples (password + tag)
const masterPassword = ref('')
const masterTag = ref('')
const passwords = ref([])
const isEditing = ref(false)

const masterPasswordRef = ref(null)

const isLoadingCreateMasterPassword = ref(false)
const isLoadingUpdateMasterPassword = ref(false)

const dialogGestionarContrasenas = ref(false)

const columns = [
  { name: 'tag', label: 'Identificador / Etiqueta', field: row => row.tag, align: 'left' },
  { name: 'actions', label: '', field: 'actions' }
]

const resetPasswordForm = () => {
  masterPassword.value = ''
  masterTag.value = ''
  isEditing.value = false
}

const loadMasterPasswords = () => {
  api.get('configuracion/master-password') // espera un array en response.data
    .then(response => {
      if (response.data) {
        passwords.value = response.data
      }
    })
    .catch(error => qNotify(error, 'error'))
}

const handleCreateMasterPassword = () => {
  isLoadingCreateMasterPassword.value = true

  api.post('configuracion/master-password', {
    password: masterPassword.value,
    tag: masterTag.value
  })
    .then(response => {
      if (response.data) {
        qNotify('Contraseña creada exitosamente.')
        masterPassword.value = ''
        masterTag.value = ''
        isEditing.value = false
        loadMasterPasswords()
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingCreateMasterPassword.value = false)
}

const handleUpdateMasterPassword = () => {
  if (!isEditing.value) return

  isLoadingUpdateMasterPassword.value = true

  api.put('configuracion/master-password', {
    password: masterPassword.value,
    tag: masterTag.value
  })
    .then(response => {
      if (response.data) {
        qNotify('Contraseña actualizada exitosamente.')
        masterPassword.value = ''
        masterTag.value = ''
        isEditing.value = false
        loadMasterPasswords()
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingUpdateMasterPassword.value = false)
}

const selectMasterPassword = (row) => {
  masterTag.value = row.tag
  masterPassword.value = ''
  isEditing.value = true
}

const deleteMasterPassword = (row, confirm = false) => {

  if (!confirm) {
    $q.dialog({
      title: 'Eliminar notificación',
      message: '¿Estás seguro de que quieres eliminar esta notificación?',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Eliminar',
        color: 'primary',
        flat: true,
        icon: 'delete'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      deleteMasterPassword(row, true)
    })
  } else {
    api.delete('configuracion/master-password', { data: { tag: row.tag } })
    .then(response => {
      if (response.data) {
        qNotify('Contraseña eliminada exitosamente.')
        if (isEditing.value && masterTag.value === row.tag) {
          resetPasswordForm()
        }
        loadMasterPasswords()
      }
    })
    .catch(error => qNotify(error, 'error', { callback: () => deleteMasterPassword(row) }))
  }


  
} 

onMounted(() => {
  api.get('pages/configuracion')
    .then(response => {
      if (response.data) {
        permissions.value = response.data.permissions;
        for (const group of Object.keys(response.data.permissions.groups)) {
          ticked.value[group] = response.data.permissions.matrix[group] || []
        }

        console.log(response.data)
        passwords.value = response.data.passwords || []
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoading.value = false)
});

</script>
