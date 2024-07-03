<template>

  <div class="flex justify-between q-mb-md">

    <q-btn-toggle v-model="filtroRecibos" toggle-color="primary" :options="[
      { label: 'Todos', value: ''},
      { label: 'Borradores', value: 'borradores' },
      { label: 'Pendientes', value: 'pendientes' },
      { label: 'Pagados', value: 'pagados' },
    ]" />

    <q-btn label="Agregar recibo" icon="add" color="primary" to="/caja/recibos/nuevo" />
  </div>


  <div class="q-gutter-md">
    
  </div>
  <q-separator class="q-my-lg" />

  <q-table :rows="recibos" :columns="recibosColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
    ref="recibosTableRef" :loading="recibosTableLoading" wrap-cells>
    <template v-slot:body-cell="props">
      <q-td :props="props">
        {{ props.value || '-' }}
      </q-td>
    </template>
  </q-table>

</template>

<script setup>

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify } from 'src/boot/jardines';
import { useQuasar } from "quasar";
import { useAppStore } from 'src/stores/app.store';

const router = useRouter()
const $q = useQuasar()
const appStore = useAppStore()

const filtroRecibos = '';

const recibos = ref([])
const recibosColumnas = [
  { name: 'xx0', label: 'Número', align: 'left', field: 'xx0' },
  { name: 'xx1', label: 'Cliente', align: 'left', field: 'xx1' },
  { name: 'xx2', label: 'Descripción', align: 'left', field: 'xx2' },
  { name: 'xx3', label: 'Fecha emisión', align: 'left', field: 'xx3' },
  { name: 'xx4', label: 'Vence / pagado el', align: 'left', field: 'xx4' },
  { name: 'xx5', label: 'Contrato', align: 'left', field: 'xx5' },
]

/**
 * PAGINATION
 */
const recibosTableRef = ref(null)
const recibosTableLoading = ref(true)

onMounted(() => {
  recibosTableRef.value.requestServerInteraction()
  appStore.getMetodosDePago()  
  getAllRecibos()  
})


function getAllRecibos() {
  api.get('caja/recibos')
      .then(response => {
        if (response.data) {
          recibos.value = response.data
        }
      })
      .catch(e => console.log(e))
      .finally(() => recibosTableLoading.value = false)
}

</script>
