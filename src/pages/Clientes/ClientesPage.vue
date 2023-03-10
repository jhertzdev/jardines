<template>
  <div class="row full-width">
    <div class="col-lg-4 col-12">
      <q-card class="q-pa-md" :class="$q.screen.lt.lg ? 'q-mb-sm' : 'q-mr-sm'">
        <table class="info-table">
          <tr>
            <th>Propietarios de parcelas</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Enterrados</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Últimas 24h</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Esta semana</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Este mes</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Este año</th>
            <td>0</td>
          </tr>
        </table>
      </q-card>
    </div>
    <div class="col-lg-8 col-12">
      <div :class="$q.screen.lt.lg ? 'q-mt-sm q-py-md' : 'q-ml-sm q-px-md'">

        <div class="q-gutter-md">
          <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregarCliente" />
        </div>
        <q-separator class="q-my-lg" />

        <div class="q-pb-lg text-center" v-if="isLoadingClientes">
          <q-spinner size="xl" color="primary" />
        </div>

        <q-table :rows="clientes" :columns="clientesColumnas" row-key="name" :class="!$q.screen.lt.lg && 'text-wrap'"
          v-else>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
              <q-btn outline icon="visibility" size="sm" color="blue" dense
                @click="router.push('/clientes/' + props.row.id)" />
              <q-btn outline icon="delete" size="sm" color="negative" dense
                @click="openDialogEliminarCliente(props.row.id)" />
            </q-td>
          </template>
          <template v-slot:body-cell="props">
            <q-td :props="props">
              {{ props.value || '-' }}
            </q-td>
          </template>
        </q-table>

        <!-- Crear cliente -->
        <q-dialog v-model="dialogAgregarCliente" class="j-dialog">
          <q-card class="q-pa-md">
            <q-form @submit="handleAgregarCliente" class="no-bottoms">
              <q-card-section>
                <div class="text-h6">Agregar cliente</div>
              </q-card-section>

              <q-card-section>

                <div class="row q-col-gutter-sm">
                  <div class="col-sm-6 col-12">
                    <q-input outlined v-model="agregarClienteData.nombre" label="Nombre *" lazy-rules
                      :rules="[val => val && val.length > 0 || '']" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input outlined v-model="agregarClienteData.apellido" label="Apellido *" lazy-rules
                      :rules="[val => val && val.length > 0 || '']" />
                  </div>
                  <div class="col-sm-5 col-4">
                    <q-select outlined v-model="agregarClienteData.doc_identidad" :options="tiposDocIdentidad"
                      label="Documento" clearable @clear="agregarClienteData.doc_numero = null" />
                  </div>
                  <div class="col-sm-7 col-8">
                    <q-input outlined v-model="agregarClienteData.doc_numero" label="Núm. identidad" lazy-rules
                      :rules="[val => val && val.length > 0 || '']" :disable="!agregarClienteData.doc_identidad"
                      :class="!agregarClienteData.doc_identidad && 'bg-grey-3'" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input outlined v-model="agregarClienteData.telefono_principal" label="Teléfono principal" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input outlined v-model="agregarClienteData.telefono_secundario" label="Teléfono secundario" />
                  </div>
                  <div class="col-sm-7 col-12">
                    <q-input outlined v-model="agregarClienteData.email" label="Email" />
                  </div>
                  <div class="col-sm-5 col-12">
                    <q-select outlined v-model="agregarClienteData.tipo_cliente" :options="tiposCliente"
                      label="Tipo de cliente" clearable lazy-rules :rules="[val => val && val.length > 0 || '']" />
                  </div>
                </div>

              </q-card-section>

              <q-card-actions class="justify-end">
                <q-btn flat label="Cancelar" v-close-popup />
                <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingAgregarCliente" />
              </q-card-actions>
            </q-form>
          </q-card>
        </q-dialog>

        <!-- Eliminar cliente -->
        <q-dialog v-model="dialogEliminarCliente" class="j-dialog">
          <q-card class="q-pa-md text-center">
            <q-card-section>
              <div class="text-h6">Eliminar cliente</div>
            </q-card-section>
            <q-card-section class="q-py-none">
              <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
            </q-card-section>
            <q-card-section>
              ¿Estás seguro de que quieres eliminar a "<span class="text-weight-bold">{{ selectedCliente.nombre
              }}</span>"? Esta acción no se puede deshacer.
            </q-card-section>
            <q-card-actions class="justify-end">
              <q-btn flat label="Cancelar" v-close-popup />
              <q-btn label="Eliminar" color="negative" @click="handleEliminarCliente(selectedCliente.id)"
                :loading="isLoadingEliminarCliente" />
            </q-card-actions>
          </q-card>
        </q-dialog>

      </div>
    </div>
  </div>
</template>

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

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

const router = useRouter()
const $q = useQuasar()
const tiposDocIdentidad = ['V', 'E', 'P', 'J', 'G']
const tiposCliente = [
  'Propietario',
  'Prospecto',
  'Contacto',
  'Ocupante',
  'Organización',
  'Otro',
]

function qNotifyError(error) {
  let message = !!error?.response?.data?.messages ?
    Object.values(error.response.data.messages).join(' ') :
    'Ha ocurrido un error'
  $q.notify({ message, color: 'negative' })
}

/**
 * CLIENTES
 */

const isLoadingClientes = ref(true)

const clientesColumnas = [
  { name: 'nombre_completo', label: 'Nombre', align: 'left', field: 'nombre_completo', sortable: true },
  { name: 'num_identidad', label: 'Doc. identidad', align: 'left', field: 'num_identidad', sortable: true },
  { name: 'telefono_principal', align: 'left', label: 'Teléfono', field: 'telefono_principal', sortable: true },
  { name: 'fecha_creado', align: 'left', label: 'Creado el', field: 'fecha_creado', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const clientes = ref([])

// Agregar o editar cliente
const dialogAgregarCliente = ref(false)
const isLoadingAgregarCliente = ref(false);

const agregarClienteData = reactive({
  id: null,
  nombre: null,
  apellido: null,
  doc_identidad: null,
  doc_numero: null,
  telefono_principal: null,
  telefono_secundario: null,
  email: null,
  tipo_cliente: null,
})

const handleAgregarCliente = () => {
  isLoadingAgregarCliente.value = true
  let postData = { ...agregarClienteData }

  console.log(postData);

  if (postData.id) {

    $q.notify({ message: 'Editado!! exitosamente.', color: 'positive' })

  } else {

    api.post('clientes', postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarClienteData).forEach((i) => agregarClienteData[i] = null)
          dialogAgregarCliente.value = false
          $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
          clientes.value.push(response.data)
        }
      })
      .catch(error => qNotifyError(error))
      .finally(() => isLoadingAgregarCliente.value = false)

  }

}

const openDialogAgregarCliente = (id) => {
  Object.keys(agregarClienteData).forEach((i) => agregarClienteData[i] = null)
  dialogAgregarCliente.value = true
}

const openDialogEditarCliente = (id) => {
  let clienteData = clientes.value.find(row => row.id == id)
  clienteData.id = id
  Object.keys(clienteData).forEach((i) => {
    if (agregarClienteData.hasOwnProperty(i)) agregarClienteData[i] = clienteData[i]
  })
  dialogAgregarCliente.value = true
}

// Eliminar cliente
const selectedCliente = ref(null)
const dialogEliminarCliente = ref(false)
const isLoadingEliminarCliente = ref(false)

const openDialogEliminarCliente = (id) => {
  selectedCliente.value = clientes.value.find(row => row.id == id)
  dialogEliminarCliente.value = true
}

const handleEliminarCliente = (id) => {
  isLoadingEliminarCliente.value = true
  api.delete('clientes/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminarCliente.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        clientes.value = clientes.value.filter(cliente => cliente.id !== id)
      }
    })
    .catch(error => qNotifyError(error))
    .finally(() => isLoadingEliminarCliente.value = false)
}


onMounted(() => {
  api.get('clientes')
    .then(response => {
      if (response.data) clientes.value = response.data;
    })
    .catch(e => console.log(e))
    .finally(() => isLoadingClientes.value = false)
})
</script>
