<template>
  <div class="q-gutter-md">
    <q-btn label="Agregar servicio" icon="add" color="primary" @click="guardarServicioDialog.openDialog()" />
  </div>
  <q-separator class="q-my-lg" />

  <q-table :rows="servicios" :columns="serviciosColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
    ref="serviciosTableRef" :loading="serviciosTableLoading" wrap-cells v-model:pagination="tablePagination">
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" style="width: 0px;" class="q-gutter-xs">
        <q-btn outline icon="edit" size="sm" color="blue" dense @click="guardarServicioDialog.openDialog(props.row.id)">
          <q-tooltip>Editar</q-tooltip>
        </q-btn>
        <q-btn outline icon="delete" size="sm" color="red" dense @click="openDialogEliminarServicio(props.row.id)">
          <q-tooltip>Eliminar</q-tooltip>
        </q-btn>
      </q-td>
    </template>
    <template v-slot:body-cell-precio="props">
      <q-td :props="props" style="width: 0px;" class="q-gutter-xs">
        {{ $dinero(props.row.precio_ref) }}
      </q-td>
    </template>
    <template v-slot:body-cell-metodos_permitidos="props">
      <q-td :props="props" style="width: 0px;" class="q-gutter-xs">
        <template v-if="Array.isArray(props.value)">
          <div v-for="metodoId in props.value">
            {{ appStore.metodosDePago.find(item => item.id == metodoId)?.metodo || `No definido (#${metodoId})` }}
          </div>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell="props">
      <q-td :props="props">
        {{ props.value || '-' }}
      </q-td>
    </template>
  </q-table>

  <DialogAgregarServicio ref="guardarServicioDialog" @created="handleAgregarEditarServicio" @updated="handleAgregarEditarServicio" />
</template>

<script setup>

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify, $dinero } from 'src/boot/jardines';
import { useQuasar } from "quasar";

// Dialogs
import DialogAgregarServicio from "src/components/popups/DialogAgregarServicio.vue";
import { useAppStore } from 'src/stores/app.store';

const router = useRouter()
const $q = useQuasar()
const appStore = useAppStore()

const handleAgregarEditarServicio = () => {
  getAllServicios();
}

const servicios = ref([])
const serviciosColumnas = [
  { name: 'nombre_producto', label: 'Nombre del servicio', align: 'left', field: 'nombre_producto', sortable: true },
  { name: 'tipo_producto', label: 'Tipo de servicio', align: 'left', field: 'tipo_producto', sortable: true },
  { name: 'empresa_id', label: 'Empresa', align: 'left', field: 'nombre_empresa', sortable: true },
  { name: 'precio', label: 'Precio', align: 'left', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

/**
 * PAGINATION
 */
const serviciosTableRef = ref(null)
const serviciosTableLoading = ref(true)
const tablePagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'created_at',
  descending: true,
})

const guardarServicioDialog = ref(null)

onMounted(() => {
  serviciosTableRef.value.requestServerInteraction()
  appStore.getMetodosDePago()
  getAllServicios()
})


function getAllServicios() {
  api.get('servicios')
      .then(response => {
        if (response.data) {
          servicios.value = response.data
        }
      })
      .catch(e => console.log(e))
      .finally(() => serviciosTableLoading.value = false)
}

const openDialogEliminarServicio = (id) => {
  $q.dialog({
    title: 'Eliminar servicio',
    message: '¿Estás seguro de que deseas eliminar este servicio?',
    ok: 'Sí',
    cancel: 'No',
  }).onOk(() => {
    api.delete('servicios/' + id)
      .then(response => {
        getAllServicios()
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
      })
      .catch(error => qNotify(error, 'error', { callback: () => openDialogEliminarServicio(id) }))
  })
}


</script>
