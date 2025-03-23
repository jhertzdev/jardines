<template>
  <q-table :rows="registros" :columns="registrosColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
    ref="registrosTableRef" v-model:pagination="registrosTablePagination" :loading="registrosTableLoading"
    :filter="registrosTableFilter" @request="registrosTableRequest">
    <template v-slot:top-right>
      <q-btn icon="print" label="Ver reporte" color="primary" @click="showDialogImprimirReporte = true" class="q-mr-sm" />
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

  <q-dialog allow-focus-outside class="j-dialog j-dialog-lg" v-model="showDialogImprimirReporte" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">Imprimir reporte</div>
      </q-card-section>
      <q-card-section>
        <QSelectUsuario v-model="imprimirReporteData.usuario_id" label="Usuario" outlined dense />
        <div class="row q-col-gutter-x-sm">
          <div class="col">
            <q-input type="date" v-model="imprimirReporteData.desde" label="Desde" dense />
          </div>
          <div class="col">
            <q-input type="date" v-model="imprimirReporteData.hasta" label="Hasta" dense />
          </div>
          <div class="col">
            <q-checkbox v-model="imprimirReporteData.reporte_completo" label="Todas las acciones" />
          </div>
        </div>
        <div class="q-my-md text-right q-gutter-x-sm">
          <q-btn label="Marcar todas" @click="imprimirReporteData.acciones = accionesDisponibles" color="primary" icon="check" dense />
          <q-btn label="Desmarcar todas" @click="imprimirReporteData.acciones = []" color="primary" icon="close" dense />
        </div>
        <q-option-group
          v-if="!imprimirReporteData.reporte_completo"
          v-model="imprimirReporteData.acciones"
          :options="accionesDisponibles.map(accion => { return { label: accion, value: accion } })"
          type="checkbox"
          inline
          dense
        />
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn label="Imprimir" color="primary" @click="() => imprimirReporte(false)" :loading="registrosTableLoading" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup>

import { ref, reactive, watch, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { qNotify } from 'src/boot/jardines';
import QSelectUsuario from "src/components/selects/QSelectUsuario.vue";
import { useRoute, useRouter } from "vue-router";
import { format } from 'date-fns'

const isLoading = ref(true)
const $q = useQuasar()
const registros = ref([])
const registrosColumnas = [
  { name: 'accion', label: 'Acción', align: 'left', field: 'accion', sortable: true, style: 'width: 100px;' },
  { name: 'detalles', label: 'Detalles', align: 'left', field: 'detalles', sortable: true, style: 'white-space: break-spaces;' },
  { name: 'username', label: 'Responsable', align: 'left', field: 'username', sortable: true, style: 'width: 100px;' },
  { name: 'created_at', label: 'Fecha', align: 'left', field: 'created_at', sortable: true, format: value => format(value, 'dd/MM/yyyy HH:mm'), style: 'width: 100px;' },
]

const showDialogImprimirReporte = ref(false)

const imprimirReporteData = ref({
  usuario_id: null,
  reporte_completo: true,
  acciones: [],
  desde: '',
  hasta: '',
})

const imprimirReporte = (ignoreCount = false) => {


  let endpoint = 'auditoria/reporte?user=' + imprimirReporteData.value.usuario_id;

  if (imprimirReporteData.value.acciones.length > 0 && !imprimirReporteData.value.reporte_completo) {
    endpoint += '&acciones=' + imprimirReporteData.value.acciones.join(',');
  }

  if (imprimirReporteData.value.desde) {
    endpoint += '&from=' + imprimirReporteData.value.desde;
  }

  if (imprimirReporteData.value.hasta) {
    endpoint += '&to=' + imprimirReporteData.value.hasta;
  }

  api.get(endpoint + '&count=1')
    .then(response => {
      if (response.data) {
        let count = response.data.count;

        if (count > 200 && !ignoreCount) {

          $q.dialog({
            title: 'Generar reporte',
            message: `El reporte contiene más de 100 registros (${response.data.count} en total). Esto puede tardar un tiempo (aprox. ${ parseInt(response.data.count / 20) } segundos) ¿deseas continuar o elegir un período más corto?`,
            cancel: true,
            persistent: true,
            ok: {
              label: 'Generar',
              color: 'primary',
            },
            cancel: {
              label: 'Cancelar',
              color: 'primary',
              flat: true,
            }
          }).onOk(() => {
            imprimirReporte(true)
          })

        } else {

          registrosTableLoading.value = true

          api
            .get(endpoint, { timeout: 600000, responseType: "blob" })
            .then((response) => {
              console.log(response);
              window.open(URL.createObjectURL(response.data));
            })
            .catch(async (error) => {
              console.log(error)
            })
            .finally(() => registrosTableLoading.value = false)

        }

      }
    })

};

const route = useRoute()
const router = useRouter()

const accionesDisponibles = ref([])

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

  api.get('auditoria/acciones')
    .then(response => {
      if (response.data) accionesDisponibles.value = response.data;
      imprimirReporteData.value.acciones = accionesDisponibles.value
    })
})

</script>
