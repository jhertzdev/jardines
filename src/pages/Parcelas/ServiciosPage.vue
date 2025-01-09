<style>
/*.card-busqueda {
  display: none !important;
}

body.section-busqueda-open .q-page-container {
  padding-top: 50px !important;
}
*/
</style>
<template>
  <q-table dense :rows="tableData" flat :columns="tableColumns" row-key="id"
    :class="!$q.screen.lt.md && 'text-wrap'" ref="tableRef"
    v-model:pagination="tablePagination" :loading="tableLoading" :filter="tableFilter"
    @request="tableRequest" style="max-height: 75vh;">
    <template v-slot:top-left>
      <div class="flex q-gutter-sm">
        <q-input label="Mes asignado" dense outlined v-model="filterDate.mes" mask="####-##" :hide-bottom-space="true" readonly clearable>
          <template v-slot:append>
            <q-icon v-if="filterDate.mes" name="close" class="cursor-pointer" @click="filterDate.mes = ''"></q-icon>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="filterDate.mes" :default-year-month="(filterDate.mes || new Date().toISOString().substr(0, 7)).replace('-', '/')" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                  @update:model-value="filterDateClosePopup = true" @navigation="filterDateClosePopup = false" years-in-month-view>
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn label="Agregar servicio" icon="add" color="primary" @click="agregarEditarServicioDialog.openDialog(null)" />
        <q-btn label="Imprimir resumen" icon="print" color="primary" @click="handlePrintResumen()" />
      </div>
    </template>
    <template v-slot:top-right>
      <q-input dense debounce="300" v-model="tableFilter" placeholder="Buscar...">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
    <template v-slot:body-cell-acciones="props">
      <q-td :props="props">
        <div class="q-gutter-xs">
          <q-btn color="primary" dense flat size="sm" icon="edit" @click="agregarEditarServicioDialog.openDialog(props.row.id)" />
          <q-btn color="negative" dense flat size="sm" icon="delete" @click="handleEliminarServicio(props.row.id)" />
        </div>
      </q-td>
    </template>
    <template v-slot:body-cell-ubicacion="props">
      <q-td :props="props" style="width: 1px">
        <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(props.row.ubicacion_id, props.row)">{{ props.row.ubicacion }}</a>
      </q-td>
    </template>
    <template v-slot:body-cell-clase_servicio="props">
      <q-td class="text-center" :props="props">
        <q-badge :label="props.row.clase_servicio" />
        <template v-if="props.row.tipo_servicio">
          <div style="font-size: .6rem; letter-spacing: -0.25px;">{{ props.row.tipo_servicio }}</div>
        </template>

      </q-td>
    </template>
    <template v-slot:body-cell-num_contrato="props">
      <q-td :props="props" style="max-width: 150px;">
        <a href="javascript:void(0)" @click="verContratosDialog.openDialog(props.row.num_contrato, props.row.tipo_contrato || props.row.clase_servicio)" v-if="props.row.num_contrato">
          {{ props.row.num_contrato }}
        </a>
      </q-td>
    </template>
    <template v-slot:body-cell-difuntos="props">
      <q-td :props="props" style="max-width: 150px; white-space: break-spaces;">
        <ol class="q-my-none q-pl-sm" style="font-size: .75rem; letter-spacing: -0.25px;">
          <li v-for="puesto in props.row.ubicacion?.puestos?.filter(p => !!parseInt(p.ocupado))" style="white-space: break-spaces;">
            {{ puesto.ocupante_nombre }}
          </li>
        </ol>
      </q-td>
    </template>
    <template v-slot:body-cell-fecha_vencimiento="props">
      <q-td :props="props">
        <template v-if="props.row.fecha_vencimiento && new Date(props.row.fecha_vencimiento) != 'Invalid Date'">
          {{ format(props.row.fecha_vencimiento, 'yyyy-MM') }}
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell-fecha_completado="props">
      <q-td :props="props">
        <template v-if="props.row.fecha_completado && new Date(props.row.fecha_completado) != 'Invalid Date'">
          {{ format(props.row.fecha_completado, 'dd/MM/yyyy') }}
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell-fecha_asignado="props">
      <q-td :props="props">
        <template v-if="props.row.fecha_asignado && new Date(props.row.fecha_asignado) != 'Invalid Date'">
          {{ format(props.row.fecha_asignado, 'dd/MM/yyyy') }}
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell-hora_asignado="props">
      <q-td :props="props">
        <template v-if="props.row.fecha_asignado && new Date(props.row.fecha_asignado) != 'Invalid Date'">
          <template v-if="props.row.fecha_asignado.substr(11, 5) == '00:00'">
            -
          </template>
          <template v-else>
            {{ format(props.row.fecha_asignado, 'hh:mm a') }}
          </template>
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell-vigente_hasta="props">
      <q-td :props="props" style="" :class="props.row.vigente_hasta ? new Date(props.row.vigente_hasta) < startOfMonth(new Date(props.row.fecha_servicio)) ? 'text-red-4 bg-red-1' : '' : ''">
        <template v-if="props.row.vigente_hasta && new Date(props.row.vigente_hasta) != 'Invalid Date'">
          {{ format(props.row.vigente_hasta, 'dd/MM/yyyy') }}
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell-fecha_ultimo_recibo="props">
      <q-td :props="props">
        <template v-if="props.row.fecha_ultimo_recibo && new Date(props.row.fecha_ultimo_recibo) != 'Invalid Date'">
          {{ format(props.row.fecha_ultimo_recibo, 'dd/MM/yyyy') }}
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell-estatus="props">
      <q-td :props="props">
        <q-badge :color="classEstatus[props.row.estatus]" :label="props.row.estatus" />
      </q-td>
    </template>
    <template v-slot:body-cell-notas="props">
      <q-td :props="props" style="width: 100px; max-width: 100px; font-size: .65rem; letter-spacing: -0.25px;">
        {{ props.row.notas }}
      </q-td>
    </template>
  </q-table>

  <DialogEditarParcela ref="editarParcelaDialog" />
  <DialogVerContratos ref="verContratosDialog" />
  <DialogAgregarEditarServicio ref="agregarEditarServicioDialog" @updated="handleAgregarEditarServicioSubmit" />

</template>

<script setup>

  import { ref, reactive, onMounted, watch } from 'vue';
  import { api } from 'src/boot/axios';
  import { useRoute } from 'vue-router';
  import { useQuasar } from 'quasar';
  import { qNotify } from 'src/boot/jardines';

  import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";
  import DialogVerContratos from "src/components/popups/DialogVerContratos.vue";
  import DialogAgregarEditarServicio from "src/components/popups/DialogAgregarEditarServicio.vue";

  import { format, lastDayOfMonth, startOfMonth } from 'date-fns'

  const verContratosDialog = ref(null)
  const editarParcelaDialog = ref(null)
  const agregarEditarServicioDialog = ref(null)

  const handlePrintResumen = () => {
    let mes = filterDate.value?.mes || '';

    api.get('parque/servicios/resumen?mes=' + mes, { responseType: "blob" })
      .then(response => {
        if (response.data) {
          window.open(URL.createObjectURL(response.data));
        }
      })
      .catch(async (error) => {
        console.log('error', error)
        error.response.data = JSON.parse(await error.response.data.text());
        qNotify(error, "error", {
          callback: () => handlePrintResumen(),
        });
      });

  }

  const filterDateClosePopup = ref(false)

  const handleAgregarEditarServicioSubmit = (data) => {
    tableRef.value.requestServerInteraction()
  }

  const classEstatus = {
    'Pendiente': 'yellow-9',
    'Completado': 'primary',
  }

  const $q = useQuasar()

  const filterDate = ref({
    field: '',
    desde: '',
    hasta: ''
  })

  watch(filterDate, () => {
    tableRef.value.requestServerInteraction()
  }, { deep: true })

  const tableData = ref([])

  const tableColumns = [
    { name: 'acciones', label: '', field: 'actions', align: 'center', headerStyle: 'width: 100px' },
    { name: 'clase_servicio', label: 'Tipo de servicio', align: 'center', field: 'clase_servicio', headerStyle: 'width: 110px' },
    { name: 'ubicacion', label: 'Ubicación', field: 'ubicacion', align: 'left', sortable: true, headerStyle: 'width: 90px'},
    { name: 'fecha_asignado', label: 'Fecha', align: 'left', sortable: true, headerStyle: 'width: 80px'},
    { name: 'hora_asignado', label: 'Hora', align: 'left', sortable: false, headerStyle: 'width: 70px'},
    { name: 'difunto', label: 'Difunto', align: 'left', field: 'difunto' },
    { name: 'estatus', label: 'Estatus', align: 'center', field: 'estatus', headerStyle: 'width: 100px' },
    { name: 'num_contrato', label: 'Contrato', align: 'left', field: 'num_contrato' },
    { name: 'vigente_hasta', label: 'Fecha venc.', align: 'left', field: 'vigente_hasta' },
    { name: 'observaciones', label: 'Observaciones', align: 'left', field: 'observaciones' },
  ]

  const tableRef = ref(null)
  const tableLoading = ref(false)
  const tableFilter = ref('');
  const tablePagination = ref({
    page: 1,
    rowsPerPage: 50,
    sortBy: 'fecha_asignado',
    descending: true,
  })

  const handleEliminarServicio = (id, confirm = false) => {
    if (!confirm) {
      $q.dialog({
        title: 'Eliminar servicio',
        message: '¿Estás seguro de que quieres eliminar este servicio?',
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
        handleEliminarServicio(id, true)
      })
    } else {
      tableLoading.value = true

      api.delete('parque/servicios/' + id)
        .then(() => {
          qNotify('Servicio eliminado')
        })
        .catch(error => qNotify(error, 'error'))
        .finally(() => {
          tableRef.value.requestServerInteraction()
        })

    }

  }

  const tableRequest = (props) => {

    const { page, rowsPerPage, sortBy, descending } = props.pagination ? props.pagination : props

    tableLoading.value = true;

    let endpoint = 'parque/servicios';

    const searchParams = new URLSearchParams(
      Object.fromEntries(Object.entries(props.pagination ? props.pagination : props).filter(([k, v]) => v != null && k != 'descending'))
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

    if (filterDate.value.field?.value) {
      endpoint += '&datefield=' + filterDate.value.field.value;
      endpoint += filterDate.value.desde ? `&from=${filterDate.value.desde}` : '';
      endpoint += filterDate.value.hasta ? `&to=${filterDate.value.hasta}` : '';
    }

    if (filterDate.value.mes) {
      endpoint += '&mes=' + filterDate.value.mes.substr(0, 7);
    }

    api.get(endpoint)
      .then(response => {
        console.log('response', response.data.data);
        if (response.data) {
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

  onMounted(() => {
    tableRequest(tablePagination.value)
  })

</script>
