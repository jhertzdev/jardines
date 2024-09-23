<template>
  <div class="row">
    <div class="col q-gutter-xs">
      <q-btn v-for="tipo in ['Parcela', 'Nicho', 'Columbario']" :key="tipo" class="q-mb-sm" color="primary" :outline="tipo != tipoParcela" @click="tipoParcela = tipo">{{ tipo + 's' }}</q-btn>
    </div>
    <div class="col-auto">
      <q-btn label="Nuevo grabado de mármol" icon="table_rows" color="primary" @click="dialogGrabadoMarmol.openDialog({
        tipo_parcela: tipoParcela
      })" />
    </div>
  </div>

  <q-table dense :rows="tableData" flat :columns="tableColumns" row-key="id"
    :class="!$q.screen.lt.md && 'text-wrap'" ref="tableRef"
    v-model:pagination="tablePagination" :loading="tableLoading" :filter="tableFilter"
    @request="tableRequest">
    <template v-slot:top-right>
      <q-input dense debounce="300" v-model="tableFilter" placeholder="Buscar...">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
    <template v-slot:body-cell-created_at="props">
      <q-td :props="props">
        {{ format(props.row.created_at, 'dd/MM/yyyy') }}
      </q-td>
    </template>
    <template v-slot:body-cell-ubicacion_id="props">
      <q-td :props="props">
        <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(props.row.ubicacion_id)">{{ props.row.num_parcela }}</a>
      </q-td>
    </template>
    <template v-slot:body-cell-difuntos="props">
      <q-td :props="props">
        <ol class="q-my-none q-pl-sm" style="font-size: .75rem; letter-spacing: -0.25px;">
          <li v-for="puesto in props.row.difuntos || []" style="white-space: break-spaces;">
            {{ puesto.nombre }}
          </li>
        </ol>
      </q-td>
    </template>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" class="q-gutter-xs">
        <q-btn size="sm" dense color="primary" icon="print" @click="handleImprimirServicioMarmol(props.row.id)" />
        <q-btn size="sm" dense color="blue-9" icon="edit" @click="dialogGrabadoMarmol.openDialog({
          id: props.row.id,
          tipo_parcela: props.row.tipo_parcela_id
        })" />
        <q-btn size="sm" dense color="negative" icon="delete" @click="handleEliminarServicioMarmol(props.row.id)" />
      </q-td>
    </template>
  </q-table>

  <DialogGrabadoMarmol ref="dialogGrabadoMarmol" @updated="getData()" />
  <DialogEditarParcela ref="editarParcelaDialog" />
</template>

<script setup>

import { ref, reactive, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { qNotify } from 'src/boot/jardines';
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { format } from 'date-fns';

import DialogGrabadoMarmol from "src/components/popups/DialogGrabadoMarmol.vue";
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const tipoParcela = ref(route.query.tipo_parcela)

const tableData = ref([])
const editarParcelaDialog = ref(null)
const filterDateClosePopup = ref(false)

watch(tipoParcela, () => {
  getData()
})

const tableColumns = [
  { name: 'created_at', label: 'Creado el', align: 'left', field: 'created_at', sortable: true },
  { name: 'ubicacion_id', label: 'Ubicación', align: 'left', field: 'ubicacion_id', sortable: true },
  { name: 'difuntos', label: 'Difuntos', align: 'left', field: 'difuntos' },
  { name: 'leyenda', label: 'Leyenda', align: 'center', field: 'leyenda' },
  { name: 'actions', label: 'Acciones', align: 'left', field: 'actions' },
]

const tableRef = ref(null)
const tableLoading = ref(false)
const tableFilter = ref('');
const tablePagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'created_at',
  descending: true,
})

const handleImprimirServicioMarmol = (id) => {
  api
    .get('parcelas/marmol/imprimir/' + id, { responseType: "blob" })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async (error) => {
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, "error", {
        callback: () => handleDownloadPdf(contratoId),
      });
    });
}

const handleEliminarServicioMarmol = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Eliminar servicio de grabado de mármol',
      message: '¿Estás seguro de que quieres eliminar este servicio de grabado de mármol?',
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
      handleEliminarServicioMarmol(id, true)
    })
  } else {
    tableLoading.value = true
    api.delete('parcelas/marmol/' + id)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
          tableRef.value.requestServerInteraction()
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEliminarServicioMarmol(id) }))
      .finally(() => tableLoading.value = false)
  }
}

const tableRequest = (props) => {

  console.log('props', props);
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  tableLoading.value = true;

  let endpoint = 'parcelas/marmol';

  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
  );

  if (tableFilter.value) {
    searchParams.append('q', tableFilter.value)
  }

  if (sortBy) {
    searchParams.append('order', descending ? 'DESC' : 'ASC')
  }

  if (searchParams) {
    endpoint += '?' + searchParams.toString();
  }

  if (tipoParcela.value) {
    endpoint += '&f[tipo_parcela]=' + tipoParcela.value
  }

  console.log('endpoint', endpoint);

  api.get(endpoint)
    .then(response => {
      if (response.data) {

        console.log('Response', response.data);
        tableData.value = response.data.data
        tablePagination.value.page = response.data.pager.currentPage
        tablePagination.value.rowsPerPage = response.data.pager.perPage
        tablePagination.value.rowsNumber = response.data.pager.total
        tablePagination.value.sortBy = response.data.sortBy || null
        tablePagination.value.descending = response.data.order == 'DESC'
      }
    })
    .catch(e => console.log(e))
    .finally(() => tableLoading.value = false)
}

const getData = () => {
  tableRef.value.requestServerInteraction()
}

onMounted(() => {
  getData()
})

const dialogGrabadoMarmol = ref(null)

</script>

