<template>
  <div class="row full-width">
    <div class="col-md-4 col-12">
      <q-card class="q-pa-md" :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mr-sm'">
        <table class="info-table">
          <tr>
            <th colspan="2" style="text-align: right;">CONTRATOS POR ESTATUS</th>
          </tr>
          <tr v-for="contrato in stats?.contratos_por_estatus">
            <th class="text-left">{{ contrato.estatus || 'No definido' }}</th>
            <td class="text-right">{{ contrato.total }}</td>
          </tr>
          <tr>
            <th colspan="2" style="text-align: right;">CONTRATOS POR TIPO</th>
          </tr>
          <tr v-for="contrato in stats?.contratos_por_tipo">
            <th class="text-left">{{ contrato.nombre || 'No definido' }}</th>
            <td class="text-right">{{ contrato.total }}</td>
          </tr>
        </table>
      </q-card>
    </div>
    <div class="col-md-8 col-12">
      <div :class="$q.screen.lt.md ? 'q-mt-sm q-py-md' : 'q-ml-sm q-px-md'">

        <div class="q-gutter-md">
          <q-btn label="Generar contratos" icon="description" color="primary" @click="openDialogGenerarContratos" />
        </div>
        <q-separator class="q-my-lg" />

        <q-table :rows="contratos" :columns="contratosColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
          ref="contratosTableRef" v-model:pagination="contratosTablePagination" :loading="contratosTableLoading"
          :filter="contratosTableFilter" @request="contratosTableRequest" wrap-cells>
          <template v-slot:top-right>
            <q-input dense debounce="300" v-model="contratosTableFilter" placeholder="Buscar...">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" style="width: 0px;" class="q-gutter-xs">
              <q-btn outline icon="edit" size="sm" color="blue" dense
                @click="editarContratoDialog.openDialog(props.row.id)" />
              <q-btn outline icon="rotate_right" size="sm" color="blue" dense
                @click="renovarContratoDialog.openDialog(props.row.id)" />
            </q-td>
          </template>
          <template v-slot:body-cell="props">
            <q-td :props="props">
              {{ props.value || '-' }}
            </q-td>
          </template>
          <template v-slot:body-cell-parcelas="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn size="sm" dense color="primary" v-for="parcela in props.row.parcelas"
                @click="router.push('/parcelas/' + parcela.id)">{{ parcela.codigo_parcela }}</q-btn>

            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </div>

  <DialogGenerarContratosMultiple ref="generarContratosDialog" @created="handleGenerarContratos" />
  <DialogEditarContrato ref="editarContratoDialog" @updated="handleEditarContrato"></DialogEditarContrato>
  <DialogRenovarContrato ref="renovarContratoDialog" @done="handleEditarContrato"></DialogRenovarContrato>
</template>

<script setup>

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

// Dialogs
import DialogGenerarContratosMultiple from "src/components/popups/DialogGenerarContratosMultiple.vue";
import DialogEditarContrato from "src/components/popups/DialogEditarContrato.vue";
import DialogRenovarContrato from "src/components/popups/DialogRenovarContrato.vue";

const router = useRouter()

const generarContratosDialog = ref(null)
const editarContratoDialog = ref(null)
const renovarContratoDialog = ref(null)

const openDialogGenerarContratos = () => {
  generarContratosDialog.value.openDialog()
}

const handleGenerarContratos = (data) => {
  console.log('Contratos Generados', data);
}

const stats = ref({});

const contratos = ref([])
const contratosColumnas = [
  { name: 'codnum_contrato', label: 'Núm. contrato', align: 'left', field: 'codnum_contrato', sortable: true },
  { name: 'estatus', label: 'Estatus', align: 'left', field: 'estatus', sortable: true },
  { name: 'cliente', label: 'Cliente', align: 'left', field: 'cliente', sortable: true, format: (val) => `${val.nombre_completo} (${val.num_identidad})` },
  { name: 'parcelas', label: 'Parcelas', align: 'left', field: 'parcelas', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

/**
 * PAGINATION
 */
const contratosTableRef = ref(null)
const contratosTableLoading = ref(true)
const contratosTableFilter = ref('');
const contratosTablePagination = ref({
  page: 1,
  rowsPerPage: 10,
})

const contratosTableRequest = (props) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  contratosTableLoading.value = true;

  let endpoint = 'contratos';

  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
  );

  if (contratosTableFilter.value) {
    searchParams.append('q', contratosTableFilter.value)
  }

  console.log('sortby', sortBy);

  if (sortBy) {
    searchParams.append('order', descending ? 'DESC' : 'ASC')
  }

  if (searchParams) {
    endpoint += '?' + searchParams.toString();
  }

  api.get(endpoint)
    .then(response => {
      if (response.data) {
        contratos.value = response.data.data
        contratosTablePagination.value.page = response.data.pager.currentPage
        contratosTablePagination.value.rowsPerPage = response.data.pager.perPage
        contratosTablePagination.value.rowsNumber = response.data.pager.total
        contratosTablePagination.value.sortBy = response.data.sortBy || null
        contratosTablePagination.value.descending = response.data.order == 'DESC'
      }
    })
    .catch(e => console.log(e))
    .finally(() => contratosTableLoading.value = false)
}
/**
 * END OF PAGINATION
 */

onMounted(() => {
  contratosTableRef.value.requestServerInteraction()

  api.get('pages/contratos')
    .then(response => {
      if (response.data) {
        stats.value = response.data
      }
    })
})

</script>
