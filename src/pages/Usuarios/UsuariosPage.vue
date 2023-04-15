<template>
  
  <div class="q-gutter-md">
    <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregarUsuario" />
  </div>
  
  <q-separator class="q-my-lg" />

  <div class="q-pb-lg text-center" v-if="isLoadingUsuarios">
    <q-spinner size="xl" color="primary" />
  </div>

  <q-table :rows="usuarios" :columns="usuariosColumnas" row-key="name" :class="!$q.screen.lt.lg && 'text-wrap'" v-else>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
        <q-btn outline icon="edit" size="sm" color="blue" dense @click="openDialogEditarUsuario(props.row.id)" />
        <q-btn outline icon="delete" size="sm" color="negative" dense
          @click="openDialogEliminarUsuario(props.row.id)" />
      </q-td>
    </template>
  </q-table>

  <!-- Crear / Editar usuario -->
  <q-dialog v-model="dialogAgregarEditarUsuario" class="j-dialog">
    <q-card class="q-pa-md">
      <q-form @submit="handleAgregarEditarUsuario">
        <q-card-section>
          <div class="text-h6">{{ agregarEditarUsuarioData.id ? 'Editar' : 'Agregar' }} usuario</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input outlined v-model="agregarEditarUsuarioData.username" label="Nombre de usuario *" lazy-rules
            :rules="[val => val && val.length > 0 || 'Escribe el nombre de usuario.']" clearable />
          <q-select outlined v-model="agregarEditarUsuarioData.group" :options="groupOptions"
            label="Selecciona un rol de usuario *" lazy-rules
            :rules="[val => val && val.length > 0 || 'Selecciona un rol de usuario.']" emit-value map-options clearable />
          <q-input outlined v-model="agregarEditarUsuarioData.password"
            :label="agregarEditarUsuarioData.id ? 'Cambiar contraseña' : 'Contraseña'"
            :hint="agregarEditarUsuarioData.id && 'Dejar en blanco para mantener la anterior'" type="password" clearable
            :rules="[val => agregarEditarUsuarioData.id || (val && val.length > 0) || 'Escribe una contraseña.']" />
        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingAgregarEditarUsuario" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <!-- Eliminar usuario -->
  <q-dialog v-model="dialogEliminarUsuario" class="j-dialog">
    <q-card class="q-pa-md text-center">
      <q-card-section>
        <div class="text-h6">Eliminar usuario</div>
      </q-card-section>
      <q-card-section class="q-py-none">
        <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
      </q-card-section>
      <q-card-section>
        ¿Estás seguro de que quieres eliminar a "<span class="text-weight-bold">{{ selectedUsuario.username }}</span>"? Esta acción no se puede deshacer.
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn label="Eliminar" color="negative" @click="handleEliminarUsuario(selectedUsuario.id)"
          :loading="isLoadingEliminarUsuario" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { ref, reactive, onMounted } from 'vue'
import { api } from "src/boot/axios";
import { qNotify } from 'src/boot/jardines';
import { useQuasar } from "quasar";

const $q = useQuasar()

// Agregar o editar usuario
const dialogAgregarEditarUsuario = ref(false)
const isLoadingUsuarios = ref(true)
const usuarios = ref([])
const usuariosColumnas = [
  { name: 'username', label: 'Nombre de usuario', align: 'left', field: 'username', sortable: true },
  { name: 'group', label: 'Rol', align: 'left', field: 'group', sortable: true },
  { name: 'fecha_creado', align: 'left', label: 'Creado el', field: 'fecha_creado', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const openDialogEditarUsuario = (id) => {
  let usuarioData = usuarios.value.find(row => row.id == id)
  Object.keys(usuarioData).forEach((i) => {
    console.log(i, ':', usuarioData[i]);
    if (agregarEditarUsuarioData.hasOwnProperty(i)) agregarEditarUsuarioData[i] = usuarioData[i]
  })
  dialogAgregarEditarUsuario.value = true
}

const openDialogAgregarUsuario = () => {
  Object.keys(agregarEditarUsuarioData).forEach((i) => agregarEditarUsuarioData[i] = null)
  dialogAgregarEditarUsuario.value = true
}

// Eliminar usuario
const selectedUsuario = ref(null)
const dialogEliminarUsuario = ref(false)
const openDialogEliminarUsuario = (id) => {
  selectedUsuario.value = usuarios.value.find(row => row.id == id)
  dialogEliminarUsuario.value = true
}

const isLoadingEliminarUsuario = ref(false)
const handleEliminarUsuario = (id) => {
  isLoadingEliminarUsuario.value = true
  api.delete('usuarios/' + id)
  .then(response => {
    if (response.data) {
      dialogEliminarUsuario.value = false
      $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
      usuarios.value = usuarios.value.filter(usuario => usuario.id !== id)
    }
  })
  .catch(error => qNotify(error, 'error', { callback: () => handleEliminarUsuario(id) }))
  .finally(() => isLoadingEliminarUsuario.value = false)
}

const groupOptions = [
  {
    label: "Administrador",
    value: "admin"
  },
  {
    label: "Asesor",
    value: "asesor"
  },
]

const isLoadingAgregarEditarUsuario = ref(false)
const agregarEditarUsuarioData = reactive({
  id: null,
  username: null,
  password: null,
  group: null,
})

const handleAgregarEditarUsuario = () => {
  isLoadingAgregarEditarUsuario.value = true
  let postData = { ...agregarEditarUsuarioData }

  if (postData.id) {

    $q.notify({ message: 'Editado!! exitosamente.', color: 'positive' })

  } else {

    api.post('auth/register', postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarEditarUsuarioData).forEach((i) => agregarEditarUsuarioData[i] = null)
          dialogAgregarEditarUsuario.value = false
          $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
          usuarios.value.push(response.data)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleAgregarEditarUsuario }))
      .finally(() => isLoadingAgregarEditarUsuario.value = false)

  }

}

onMounted(() => {
  api.get('usuarios')
    .then(response => {
      if (response.data) usuarios.value = response.data;
    })
    .catch(e => console.log(e))
    .finally(() => isLoadingUsuarios.value = false)
})

</script>