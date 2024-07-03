<template>
  <div class="q-gutter-md">
    <q-btn label="Agregar método de pago" icon="add" color="primary" @click="guardarMetodoPagoDialog.openDialog()" />
  </div>
  <q-separator class="q-my-lg" />

  <q-table :rows="metodos" :columns="metodosColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
    ref="metodosTableRef" :loading="metodosTableLoading" wrap-cells>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" style="width: 0px;" class="q-gutter-xs">
        <q-btn outline icon="edit" size="sm" color="blue" dense @click="guardarMetodoPagoDialog.openDialog(props.row.id)">
          <q-tooltip>Editar</q-tooltip>
        </q-btn>
        <q-btn outline icon="delete" size="sm" color="red" dense @click="openDialogEliminarMetodoPago(props.row.id)">
          <q-tooltip>Eliminar</q-tooltip>
        </q-btn>
      </q-td>
    </template>
    <template v-slot:body-cell="props">
      <q-td :props="props">
        {{ props.value || '-' }}
      </q-td>
    </template>
  </q-table>

  <DialogAgregarMetodoPago ref="guardarMetodoPagoDialog" @created="handleAgregarEditarMetodoPago" @updated="handleAgregarEditarMetodoPago" />
</template>

<script setup>

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify } from 'src/boot/jardines';
import { useQuasar } from "quasar";

// Dialogs
import DialogAgregarMetodoPago from "src/components/popups/DialogAgregarMetodoPago.vue";

const router = useRouter()
const $q = useQuasar()

const handleAgregarEditarMetodoPago = () => {
  getAllPaymentMethods();
}

const metodos = ref([])
const metodosColumnas = [
  { name: 'tipo_metodo', label: 'Tipo', align: 'left', field: 'tipo_metodo', sortable: true },
  { name: 'metodo', label: 'Método de pago', align: 'left', field: 'metodo', sortable: true },
  { name: 'descripcion', label: 'Descripción', align: 'left', field: 'descripcion' },
  { name: 'moneda', label: 'Moneda', align: 'left', field: 'moneda', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

/**
 * PAGINATION
 */
const metodosTableRef = ref(null)
const metodosTableLoading = ref(true)

const guardarMetodoPagoDialog = ref(null)

onMounted(() => {
  metodosTableRef.value.requestServerInteraction()
  getAllPaymentMethods()
})

function getAllPaymentMethods() {
  api.get('caja/metodos')
    .then(response => {

      console.log(response)

      if (response.data) {
        metodos.value = response.data
      }
    })
    .catch(e => console.log(e))
    .finally(() => metodosTableLoading.value = false)
}

const openDialogEliminarMetodoPago = (id) => {
  $q.dialog({
    title: 'Eliminar método de pago',
    message: '¿Estás seguro de que deseas eliminar este método de pago?',
    ok: 'Sí',
    cancel: 'No',
  }).onOk(() => {
    api.delete('caja/metodos/' + id)
      .then(response => {
        if (response.data) {
          getAllPaymentMethods()
          $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => openDialogEliminarMetodoPago(id) }))
  })
}
</script>
