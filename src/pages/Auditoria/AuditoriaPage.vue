<template>
  <q-table :rows="registros" :columns="registrosColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
    ref="registrosTableRef" v-model:pagination="registrosTablePagination" :loading="registrosTableLoading"
    :filter="registrosTableFilter" @request="registrosTableRequest">
    <template v-slot:top-right>
      <q-input dense debounce="300" v-model="registrosTableFilter" placeholder="Buscar...">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th auto-width />
        <q-th
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
        >
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-btn size="sm" color="primary" dense @click="props.expand = !props.expand" :icon="props.expand ? 'remove' : 'add'" />
        </q-td>
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
        >
          {{ col.value }}
        </q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props">
        <q-td colspan="100%">
          <div class="row" stlye="max-width: calc(100vw - 200px)">
            <div class="col-6">
              <div class="row q-col-gutter-md">
                <div class="col-auto">
                  <label class="text-weight-bold">Data anterior:</label>
                </div>
                <div class="col">
                  <pre class="q-my-none" style="white-space: break-spaces;">{{ props.row.data_actual }}</pre>
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="row q-col-gutter-md">
                <div class="col-auto">
                  <label class="text-weight-bold">Data nueva:</label>
                </div>
                <div class="col">
                  <pre class="q-my-none" style="white-space: break-spaces;">{{ props.row.data_nueva }}</pre>
                </div>
              </div>
            </div>
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>

</template>

<script setup>

import { ref, reactive, watch, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { qNotify } from 'src/boot/jardines';
import { useRoute, useRouter } from "vue-router";
import { format } from 'date-fns'

const isLoading = ref(true)
const registros = ref([])
const registrosColumnas = [
  { name: 'accion', label: 'Acción', align: 'left', field: 'accion', sortable: true },
  { name: 'detalles', label: 'Detalles', align: 'left', field: 'detalles', sortable: true },
  { name: 'username', label: 'Responsable', align: 'left', field: 'username', sortable: true },
  { name: 'created_at', label: 'Fecha', align: 'left', field: 'created_at', sortable: true, format: value => format(value, 'dd/MM/yyyy HH:mm') },
]

const route = useRoute()
const router = useRouter()

/**
 * PAGINATION
 */
const registrosTableRef = ref(null)
const registrosTableLoading = ref(true)
const registrosTableFilter = ref(router.currentRoute.value.query.search || '');
const registrosTablePagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'created_at',
  descending: true,
})

const registrosTableRequest = (props) => {

  const { page, rowsPerPage, sortBy, descending } = props.pagination
  registrosTableLoading.value = true;

  let endpoint = 'auditoria';

  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
  );

  if (registrosTableFilter.value) {
    searchParams.append('q', registrosTableFilter.value)
    router.replace({query: { search: registrosTableFilter.value}})
  }

  if (sortBy) {
    searchParams.append('order', descending ? 'DESC' : 'ASC')
  }

  if (searchParams) {
    endpoint += '?' + searchParams.toString();
  }


  api.get(endpoint)
    .then(response => {
      if (response.data) {
        registros.value = response.data.data
        registrosTablePagination.value.page = response.data.pager.currentPage
        registrosTablePagination.value.rowsPerPage = response.data.pager.perPage
        registrosTablePagination.value.rowsNumber = response.data.pager.total
        registrosTablePagination.value.sortBy = response.data.sortBy || null
        registrosTablePagination.value.descending = response.data.order == 'DESC'
      }
    })
    .catch(e => console.log(e))
    .finally(() => registrosTableLoading.value = false)
}
/**
 * END OF PAGINATION
 */

onMounted(() => {
  registrosTableRef.value.requestServerInteraction()
})

</script>
