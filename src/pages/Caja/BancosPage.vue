<template>
  <div class="q-gutter-md">
    <q-btn label="Agregar cuenta" icon="add" color="primary" @click="guardarBancoDialog.openDialog()" />
  </div>
  <q-separator class="q-my-lg" />

  <q-table :rows="bancos" :columns="bancosColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
    ref="bancosTableRef" :loading="bancosTableLoading" wrap-cells>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" style="width: 0px;" class="q-gutter-xs">
        <q-btn outline icon="edit" size="sm" color="blue" dense @click="guardarBancoDialog.openDialog(props.row.id)">
          <q-tooltip>Editar</q-tooltip>
        </q-btn>
        <q-btn outline icon="delete" size="sm" color="red" dense @click="openDialogEliminarBanco(props.row.id)">
          <q-tooltip>Eliminar</q-tooltip>
        </q-btn>
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

  <DialogAgregarBanco ref="guardarBancoDialog" @created="handleAgregarEditarBanco" @updated="handleAgregarEditarBanco" />
</template>

<script setup>

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify } from 'src/boot/jardines';
import { useQuasar } from "quasar";

// Dialogs
import DialogAgregarBanco from "src/components/popups/DialogAgregarBanco.vue";
import { useAppStore } from 'src/stores/app.store';

const router = useRouter()
const $q = useQuasar()
const appStore = useAppStore()

const handleAgregarEditarBanco = () => {
  getAllBanks();
}

const bancos = ref([])
const bancosColumnas = [
  { name: 'nombre_cuenta', label: 'Nombre de la cuenta', align: 'left', field: 'nombre_cuenta', sortable: true },
  { name: 'numero_cuenta', label: 'Número de cuenta', align: 'left', field: 'numero_cuenta' },
  { name: 'disponible', label: '¿Disponible?', align: 'left', field: 'disponible', sortable: true, format: (val) => `${parseInt(val) ? 'Sí' : 'No'}` },
  { name: 'metodos_permitidos', label: 'Métodos permitidos', align: 'left', field: 'metodos_permitidos' },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

/**
 * PAGINATION
 */
const bancosTableRef = ref(null)
const bancosTableLoading = ref(true)

const guardarBancoDialog = ref(null)

onMounted(() => {
  bancosTableRef.value.requestServerInteraction()
  appStore.getMetodosDePago()
  getAllBanks()
})


function getAllBanks() {
  api.get('caja/bancos')
      .then(response => {
        if (response.data) {
          console.log(response.data)
          bancos.value = response.data
        }
      })
      .catch(e => console.log(e))
      .finally(() => bancosTableLoading.value = false)
}

const openDialogEliminarBanco = (id) => {
  $q.dialog({
    title: 'Eliminar banco',
    message: '¿Estás seguro de que deseas eliminar este banco?',
    ok: 'Sí',
    cancel: 'No',
  }).onOk(() => {
    api.delete('caja/bancos/' + id)
      .then(response => {
        getAllBanks()
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
      })
      .catch(error => qNotify(error, 'error', { callback: () => openDialogEliminarBanco(id) }))
  })
}


</script>
