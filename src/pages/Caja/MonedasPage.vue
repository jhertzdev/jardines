<template>
  <div class="q-gutter-md">
    <q-btn label="Agregar moneda" icon="add" color="primary" @click="guardarMonedaDialog.openDialog()" />
  </div>
  <q-separator class="q-my-lg" />

  <q-table :rows="monedas" :columns="monedasColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
    ref="monedasTableRef" :loading="monedasTableLoading" wrap-cells>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" style="width: 0px;" class="q-gutter-xs">
        <q-btn outline icon="edit" size="sm" color="blue" dense @click="guardarMonedaDialog.openDialog(props.row.id)">
          <q-tooltip>Editar</q-tooltip>
        </q-btn>
        <q-btn outline icon="delete" size="sm" color="red" dense @click="openDialogEliminarMoneda(props.row.id)">
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

  <DialogAgregarMoneda ref="guardarMonedaDialog" @created="handleAgregarEditarMoneda" @updated="handleAgregarEditarMoneda" />
</template>

<script setup>

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify } from 'src/boot/jardines';
import { useQuasar } from "quasar";

// Dialogs
import DialogAgregarMoneda from "src/components/popups/DialogAgregarMoneda.vue";

const router = useRouter()
const $q = useQuasar()

const handleAgregarEditarMoneda = () => {
  api.get('caja/monedas')
    .then(response => {
      if (response.data) {
        monedas.value = response.data
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => monedasTableLoading.value = false)
}

const openDialogEliminarMoneda = (id) => {

  $q.dialog({
    title: 'Eliminar moneda',
    message: '¿Estás seguro de que quieres eliminar la moneda seleccionada?',
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
    api.delete('caja/monedas/' + id)
      .then(response => {
        monedasTableLoading.value = true
        api.get('caja/monedas')
          .then(response => {
            if (response.data) {
              monedas.value = response.data
            }
          })
          .catch(error => qNotify(error, 'error'))
          .finally(() => monedasTableLoading.value = false)
      })
      .catch(error => qNotify(error, 'error'))
  })


}

const monedas = ref([])
const monedasColumnas = [
  { name: 'moneda', label: 'Moneda', align: 'left', field: 'moneda', sortable: true },
  { name: 'simbolo', label: 'Descripción', align: 'left', field: 'simbolo', sortable: true },
  { name: 'tasa', label: 'Tasa', align: 'left', field: 'tasa', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

/**
 * PAGINATION
 */
const monedasTableRef = ref(null)
const monedasTableLoading = ref(true)

const guardarMonedaDialog = ref(null)

onMounted(() => {
  monedasTableRef.value.requestServerInteraction()

  api.get('caja/monedas')
    .then(response => {
      if (response.data) {
        monedas.value = response.data
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => monedasTableLoading.value = false)
})
</script>
