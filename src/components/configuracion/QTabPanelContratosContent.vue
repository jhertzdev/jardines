<template>
  <div class="q-gutter-md">
    <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregar" />
  </div>
  <q-separator class="q-my-lg" />

  <div class="q-pb-lg text-center" v-if="isLoading">
    <q-spinner size="xl" color="primary" />
  </div>

  <q-table :rows="contratos" :columns="columnas" row-key="name" :class="!$q.screen.lt.md && 'text-wrap'" v-else>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
        <q-btn outline icon="edit" size="sm" color="blue" dense @click="openDialogEditar(props.row.codigo_contrato)" />
        <q-btn outline icon="delete" size="sm" color="negative" dense @click="openDialogEliminar(props.row.codigo_contrato)" />
      </q-td>
    </template>
  </q-table>

  <!-- Agregar / Editar -->
  <q-dialog allow-focus-outside v-model="dialogAgregarEditar" class="j-dialog">
    <q-card class="q-pa-md">
      <q-form @submit="handleAgregarEditar">
        <q-card-section>
          <div class="text-h6">{{ agregarEditarData.id ? 'Editar' : 'Agregar' }} contrato</div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-input outlined v-model="agregarEditarData.codigo_contrato" label="Código *" lazy-rules
                :rules="[val => val && val.length > 0 || 'Escribe el código de contrato.']" />
            </div>
            <div class="col-12 col-md-7">
              <q-input outlined v-model="agregarEditarData.nombre" label="Nombre del contrato *" lazy-rules
                :rules="[val => val && val.length > 0 || 'Escribe el nombre del contrato.']" />
            </div>
            <div class="col-12">
              <q-input outlined v-model="agregarEditarData.descripcion" label="Descripción" />
            </div>
            <div class="col-12">
              <q-select outlined v-model="agregarEditarData.tipo_actividad" :options="tiposEmpresa"
                label="Tipo de empresa" emit-value map-options clearable hint="El tipo de empresa que puede registrar este contrato."/>
            </div>
            <div class="col-12">
              <q-select :options="['Parcela', 'Columbario', 'Nicho']" outlined v-model="agregarEditarData.tipo_parcela"
                label="Tipo de producto" clearable hint="El tipo de producto que puede asociarse a este contrato." />
            </div>
            <div class="col-12 col-md-6">
              <q-input type="number" outlined v-model="agregarEditarData.valor_venta"
                label="Valor de venta" step="0.01" />
            </div>
            <div class="col-12 col-md-6">
              <q-input type="number" outlined v-model="agregarEditarData.numero_cuotas"
                label="Núm. cuotas" step="1" />
            </div>
            <div class="col-12 col-md-6">
              <q-input type="number" outlined v-model="agregarEditarData.valor_cuota_inicial"
                label="Cuota inicial" step="0.01" />
            </div>
            <div class="col-12 col-md-6">
              <q-input type="number" outlined v-model="agregarEditarData.valor_cuota_mensual"
                label="Cuota mensual" step="0.01" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" :label="agregarEditarData.id ? 'Editar' : 'Agregar'" color="primary" :loading="isLoadingAgregarEditar" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <!-- Eliminar -->
  <q-dialog allow-focus-outside v-model="dialogEliminar" class="j-dialog">
    <q-card class="q-pa-md text-center">
      <q-card-section>
        <div class="text-h6">Eliminar contrato</div>
      </q-card-section>
      <q-card-section class="q-py-none">
        <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
      </q-card-section>
      <q-card-section>
        ¿Estás seguro de que quieres eliminar "<span class="text-weight-bold">{{ selected.nombre }}</span>"? Esta acción no se puede deshacer.
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn label="Eliminar" color="negative" @click="handleEliminar(selected.codigo_contrato)"
          :loading="isLoadingEliminar" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { api } from 'src/boot/axios'
import { qNotify } from 'src/boot/jardines';
import { ref, reactive, onMounted } from 'vue'

const isLoading = ref(true)
const isLoadingAgregarEditar = ref(false)
const isLoadingEliminar = ref(false)

const dialogAgregarEditar = ref(false)
const dialogEliminar = ref(false)

const contratos = ref([])
const selected = ref({})

const columnas = [
  { name: 'codigo_contrato', label: 'Código', align: 'left', field: 'codigo_contrato', sortable: true },
  { name: 'nombre', label: 'Nombre de contrato', align: 'left', field: 'nombre', sortable: true },
  { name: 'descripcion', label: 'Descripción', align: 'left', field: 'descripcion', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const tiposEmpresa = [
  {
    label: "Venta de parcelas",
    value: "venta_parcelas"
  },
  {
    label: "Matenimiento",
    value: "mantenimiento_parcelas"
  },
];

const agregarEditarData = reactive({
  id: null,
  codigo_contrato: null,
  nombre: null,
  descripcion: null,
  tipo_actividad: null,
  tipo_parcela: null,
  valor_venta: 0,
  numero_cuotas: 0,
  valor_cuota_inicial: 0,
  valor_cuota_mensual: 0,
})

const openDialogAgregar = () => {
  Object.keys(agregarEditarData).forEach((i) => agregarEditarData[i] = null)
  dialogAgregarEditar.value = true
}

const openDialogEditar = (id) => {
  let data = contratos.value.find(row => row.codigo_contrato == id)
  data['id'] = data.codigo_contrato
  Object.keys(data).forEach((i) => {
    if (agregarEditarData.hasOwnProperty(i)) agregarEditarData[i] = data[i]
  })
  dialogAgregarEditar.value = true
}

const handleAgregarEditar = () => {

  isLoadingAgregarEditar.value = true
  let postData = { ...agregarEditarData }

  if (postData.id) {

    api.post('contratos/tipos/' + postData.id, postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarEditarData).forEach((i) => agregarEditarData[i] = null)
          dialogAgregarEditar.value = false
          qNotify('Editado exitosamente.')
          let index = contratos.value.findIndex(row => row.id == postData.id)
          if (index > -1) {
            response.data['id'] = response.data.codigo_contrato
            contratos.value[index] = response.data
          }
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoadingAgregarEditar.value = false)

  } else {

    api.post('contratos/tipos', postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarEditarData).forEach((i) => agregarEditarData[i] = null)
          dialogAgregarEditar.value = false
          qNotify('Agregado exitosamente.')
          contratos.value.push(response.data)
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoadingAgregarEditar.value = false)

  }

}

const openDialogEliminar = (id) => {
  selected.value = contratos.value.find(row => row.codigo_contrato == id)
  dialogEliminar.value = true
}

const handleEliminar = (id) => {
  isLoadingEliminar.value = true
  api.delete('contratos/tipos/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminar.value = false
        qNotify('Eliminado exitosamente.')
        contratos.value = contratos.value.filter(row => row.codigo_contrato !== id)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingEliminar.value = false)
}

onMounted(() => {
  api.get('contratos/tipos')
    .then(response => {
      if (response.data) contratos.value = response.data;
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoading.value = false)
});

</script>
