<template>
  <div class="row full-width">
    <!--<div class="col-md-4 col-12">
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
    </div>-->
    <div class="col-12">
      <div class="q-mb-md">

        <div class="flex justify-end q-mb-md">

          <div class="q-gutter-sm">
            <q-btn color="primary" icon="description" label="Nuevo contrato" @click="openDialogGenerarContratos('Cremacion')" />

            <!--<q-btn color="primary" label="Traspaso" icon="swap_horiz" @click="traspasarContratosDialog.openDialog()"/>-->
          </div>


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

          <template v-slot:body-cell-num_contrato="props">
            <q-td :props="props">
              <a href="javascript:void(0)" @click="(e) => verContratosDialog.openDialog(props.row.num_contrato, props.row.tipo_parcela)" v-if="props.row.id">{{ props.value }}</a>
              <span v-else>-</span>
            </q-td>
          </template>

          <template v-slot:body-cell="props">
            <q-td :props="props">
              {{ props.value || '-' }}
            </q-td>
          </template>

          <template v-slot:body-cell-cliente="props">
            <q-td :props="props">
              <a href="javascript:void(0)" @click="(e) => verClienteDialog.openDialog(props.row.cliente.id, e)" v-if="props.row.cliente?.id">{{ props.value }}</a>
              <span v-else>-</span>
            </q-td>
          </template>

          <template v-slot:body-cell-cremaciones="props">
            <q-td :props="props">
              <ul style="padding-left: 0; line-height: 1.15;">
                <li v-for="cremacion in props.row.cremaciones">
                  <a href="javascript:void(0)" @click="(e) => handleVerCremacionPdf(cremacion.id)">
                    <span class="text-bold text-primary">{{ cremacion.num_cremacion }}</span> -
                    <span class="text-italic">{{ cremacion.difunto_nombre }}</span>
                  </a>
                </li>
              </ul>
            </q-td>

          </template>


          <template v-slot:body-cell-parcelas="props">
            <q-td :props="props" class="q-gutter-xs">
              <!--<q-btn size="sm" dense color="primary" v-for="parcela in props.row.parcelas"
                @click="router.push('/app/parcelas/' + parcela.id)">{{ parcela.codigo_parcela }}</q-btn>-->
              <!--<q-btn size="sm" dense color="primary" v-for="parcela in props.row.parcelas"
                @click="router.push('/app/parcelas?search=' + parcela.codigo_parcela)">{{ parcela.codigo_parcela }}</q-btn>-->
              <q-btn size="sm" dense color="primary" v-for="parcela in props.row.parcelas"
                @click="editarParcelaDialog.openDialog(parcela.id)">{{ parcela.codigo_parcela }}</q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </div>

  <DialogGenerarContratosMultiple ref="generarContratosDialog" @created="handleGenerarContratos" />
  <!--<DialogTraspasoContratos ref="traspasarContratosDialog" />-->
  <DialogVerContratos ref="verContratosDialog" @updated="handleGenerarContratos" />
  <DialogEditarParcela ref="editarParcelaDialog" @done="handleEditarParcela"></DialogEditarParcela>
  <DialogAgregarCliente ref="verClienteDialog" />

</template>

<script setup>

import { ref, reactive, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify } from 'src/boot/jardines';
import { useQuasar } from "quasar";

// Dialogs
import DialogGenerarContratosMultiple from "src/components/popups/DialogGenerarContratosMultiple.vue";
import DialogVerContratos from "src/components/popups/DialogVerContratos.vue";
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import { format } from "date-fns";

const router = useRouter()
const $q = useQuasar()

const generarContratosDialog = ref(null)
const verContratosDialog = ref(null)
const editarParcelaDialog = ref(null)
const verClienteDialog = ref(null);

const openDialogGenerarContratos = (tipo = null) => {
  generarContratosDialog.value.openDialog(tipo)
}

const handleGenerarContratos = (data) => {
  console.log('Contratos Generados', data);
  contratosTableRef.value.requestServerInteraction()

  console.log('Contratos Generados', data, Array.isArray(data), data[0]);

  if (Array.isArray(data)) {
    verContratosDialog.value.openDialog(data[0].num_contrato, data[0].tipo_parcela)
  }
}

const handleEditarParcela = (data) => {
  console.log('Contratos Editados/Renovados', data);
  contratosTableRef.value.requestServerInteraction()
}

const stats = ref({});

const handleVerCremacionPdf = (cremacionId) => {
  api
    .get("cremaciones/" + cremacionId + "/pdf", { responseType: "blob" })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async (error) => {
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, "error", {
        callback: () => handleVerCremacionPdf(cremacionId),
      });
    });
};

const contratos = ref([])
const contratosColumnas = [
  { name: 'num_contrato', label: 'Núm. contrato', align: 'left', field: 'num_contrato', sortable: true },
  { name: 'fecha_emision', label: 'Fecha emisión', align: 'left', field: 'fecha_emision', sortable: false, format: (val) => val ? format(val, 'dd/MM/yyyy') : '-' },
  { name: 'fecha_vencimiento', label: 'Fecha vencimiento', align: 'left', field: 'fecha_vencimiento', sortable: false, format: (val) => val ? format(val, 'dd/MM/yyyy') : '-' },
  { name: 'estatus', label: 'Estatus', align: 'left', field: 'estatus', sortable: true },
  { name: 'cliente', label: 'Cliente', align: 'left', field: 'cliente', sortable: false, format: (val) => `${val.nombre_completo} (${val.num_identidad})` },
  { name: 'cremaciones', label: 'Cremaciones', align: 'left', field: 'cremaciones', sortable: false },
]

/**
 * PAGINATION
 */
const contratosTableRef = ref(null)
const contratosTableLoading = ref(true)
const contratosTableFilter =  ref(router.currentRoute.value.query.search || '');
const contratosTablePagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'num_contrato',
  descending: true,
})

const contratosTableRequest = (props) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  contratosTableLoading.value = true;

  let endpoint = 'numcontratos';

  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
  );

  if (contratosTableFilter.value) {

    if (contratosTableFilter.value.toLocaleUpperCase().includes('OLIVARES')) {
      searchParams.append('f[notas]', 'GRUPO OLIVARES')
    } else {
      searchParams.append('q', contratosTableFilter.value)
    }
    router.replace({ query: { search: contratosTableFilter.value } })
  }

  if (sortBy) {
    searchParams.append('order', descending ? 'DESC' : 'ASC')
  }


  searchParams.append('f[tipo_parcela]', 'Cremacion')

  console.log('searchParams', searchParams);


  if (searchParams) {
    endpoint += '?' + searchParams.toString();
  }

  console.log('sortby', endpoint);

  api.get(endpoint)
    .then(response => {

      console.log('response', response);

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
