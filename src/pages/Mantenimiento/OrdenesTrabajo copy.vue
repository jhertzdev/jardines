<template>
  <div class="text-right q-mb-sm q-gutter-xs">
    <q-btn size="sm" class="q-px-sm" :label="`Imprimir (${selectedRows.length})`" icon="print" color="primary" v-if="selectedRows.length" @click="imprimirMantenimientoDialog.openDialog();" />
    <q-btn size="sm" class="q-px-sm" :label="`Editar (${selectedRows.length})`" icon="edit" color="primary" v-if="selectedRows.length" @click="editarLoteOrdenesTrabajoDialog.openDialog(selectedRows.map(r => r.id));" />
    <q-btn size="sm" class="q-px-sm" :label="`Borrar (${selectedRows.length})`" icon="delete" color="negative" v-if="selectedRows.length" @click="handleEliminarOrdenesMantenimientoLote(selectedRows.map(r => r.id));" />
    <q-btn size="sm" class="q-px-sm" label="Asignar mantenimientos" icon="handyman" color="primary" @click="agregarUbicacionesMantenimientoDialog.openDialog();" />
    <q-btn size="sm" class="q-px-sm" label="Control trimestral" icon="event" color="primary" to="/app/mantenimiento/control-trimestral" />
  </div>

  <q-table dense :rows="tableData" flat :columns="tableColumns" row-key="id"
    :class="!$q.screen.lt.md && 'text-wrap'" ref="tableRef"
    v-model:pagination="tablePagination" :loading="tableLoading" :filter="tableFilter"
    @request="tableRequest" selection="multiple" v-model:selected="selectedRows" style="max-height: 75vh;">
    <template v-slot:top-left>
      <q-btn-toggle v-model="estatusOrdenes" toggle-color="primary" :options="[
        { label: 'Todas', value: '' },
        { label: 'Completadas', value: 'Completado' },
        { label: 'Por entregar', value: 'Por entregar' },
        { label: 'Por ejecutar', value: 'Por ejecutar' },
      ]" @click="selectedRows = []" />
      <!--<q-input class="q-ml-sm" label="Filtrar por mes" dense outlined v-model="filterDate" mask="####-##" :hide-bottom-space="true" style="max-width: 150px;" readonly clearable>
        <template v-slot:append>
          <q-icon v-if="filterDate" name="close" class="cursor-pointer" @click="filterDate = ''"></q-icon>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="filterDate" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                @update:model-value="filterDateClosePopup = true" @navigation="filterDateClosePopup = false">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>-->
      <q-btn icon="filter_alt" label="Filtrar por fecha" color="primary" class="q-ml-sm" @click="showDialogFilterDate = true"></q-btn>
      <div class="q-my-sm" style="width: 100%" v-if="filterDate.field?.value && (filterDate.desde || filterDate.hasta)">
        <q-btn icon="delete" color="negative" dense size="sm" @click="filterDate.desde = ''; filterDate.hasta = ''; filterDateClosePopup = true" />
        Filtrado por {{ filterDate.field.label.toLowerCase() }}
        <template v-if="filterDate.desde"> desde el: {{ filterDate.desde }}</template>
        <template v-if="filterDate.hasta"> hasta el: {{ filterDate.hasta }}</template>
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
        <div class="q-gutter-sm">
          <q-btn color="primary" dense flat size="sm" icon="edit" @click="editarOrdenTrabajoDialog.openDialog(props.row.id)" />
        </div>
      </q-td>
    </template>
    <template v-slot:body-cell-ubicacion="props">
      <q-td :props="props" style="width: 1px">
        <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(props.row.ubicacion_id)">{{ props.row.ubicacion.codigo_parcela }}</a>
        <q-icon name="info" class="q-ml-xs text-red-4" v-if="props.row?.notas?.length">
          <q-tooltip anchor="top middle" self="bottom middle" max-width="240px" style="background: #000 !important; border: 1px solid #fff">
            <div>{{ props.row.notas }}</div>
          </q-tooltip>
        </q-icon>
      </q-td>
    </template>
    <template v-slot:body-cell-cliente="props">
      <q-td :props="props" style="max-width: 150px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
        {{ props.row.ubicacion.propietario.propietario_nombre }} ({{ props.row.ubicacion.propietario.propietario_identidad }})
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
    <template v-slot:body-cell-vigente_hasta="props">
      <q-td :props="props" style="" :class="props.row.ubicacion.vigente_hasta ? new Date(props.row.ubicacion.vigente_hasta) < startOfMonth(new Date(props.row.fecha_vencimiento)) ? 'text-red-4 bg-red-1' : '' : ''">
        <template v-if="props.row.ubicacion?.vigente_hasta && new Date(props.row.ubicacion.vigente_hasta) != 'Invalid Date'">
          {{ format(props.row.ubicacion.vigente_hasta, 'dd/MM/yyyy') }}
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
        <q-linear-progress stripe :value="props.row.avance / 100" :color="classEstatus[props.row.estatus]"  />
      </q-td>
    </template>
    <template v-slot:body-cell-notas="props">
      <q-td :props="props" style="width: 100px; max-width: 100px; font-size: .65rem; letter-spacing: -0.25px;">
        {{ props.row.notas }}
      </q-td>
    </template>
  </q-table>
  <q-dialog allow-focus-outside v-model="showDialogFilterDate" class="j-dialog j-dialog-xl">
    <q-card>
      <q-card-section>

        <div class="row q-col-gutter-md">
          <div class="col-auto">
            <q-date
              v-model="fechaAsignado"
              :events="events"
              landscape
            />
          </div>
          <div class="col">
            <div class="text-h6 q-mb-md">
              Filtrar por fecha
            </div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-5">
                <q-select dense outlined v-model="filterDate.field" :options="[
                  { label: 'Asignado', value: 'fecha_asignado' },
                  { label: 'Último recibo', value: 'fecha_ultimo_recibo' },
                  { label: 'Completado', value: 'fecha_completado' },
                ]" label="Filtrar por fecha" clearable />
              </div>
              <div class="col">
                <q-input type="date" dense outlined v-model="filterDate.desde" label="Desde" clearable />
              </div>
              <div class="col">
                <q-input type="date" dense outlined v-model="filterDate.hasta" label="Hasta" clearable />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
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
              </div>

            </div>

            <div class="text-right q-mt-md">
              <q-btn label="Cerrar" flat @click="showDialogFilterDate = false" />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
  <DialogEditarOrdenTrabajo ref="editarOrdenTrabajoDialog" @updated="tableRequest(tablePagination)" />
  <DialogAgregarUbicacionesMantenimiento ref="agregarUbicacionesMantenimientoDialog" @created="tableRequest(tablePagination)" />
  <DialogEditarLoteOrdenesTrabajo ref="editarLoteOrdenesTrabajoDialog" @updated="val => {
      if (!val?.mantener_marcados) {
        selectedRows = [];
      }
      tableRequest(tablePagination)
    }" />
  <DialogImprimirMantenimento ref="imprimirMantenimientoDialog" :completado="estatusOrdenes" :ids="selectedRows" :mes="filterDate" />
  <DialogEditarParcela ref="editarParcelaDialog" />

</template>

<script setup>

  import { ref, reactive, onMounted, watch } from 'vue';
  import { api } from 'src/boot/axios';
  import { useRoute } from 'vue-router';
  import { useQuasar } from 'quasar';
  import { qNotify } from 'src/boot/jardines';
  import DialogEditarOrdenTrabajo from 'src/components/popups/DialogEditarOrdenTrabajo.vue';
  import DialogEditarLoteOrdenesTrabajo from "src/components/popups/DialogEditarLoteOrdenesTrabajo.vue";
  import DialogAgregarUbicacionesMantenimiento from "src/components/popups/DialogAgregarUbicacionesMantenimiento.vue";
  import DialogImprimirMantenimento from "src/components/popups/DialogImprimirMantenimento.vue";
  import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";

  import { format, lastDayOfMonth, startOfMonth } from 'date-fns'

  const editarOrdenTrabajoDialog = ref(null)
  const editarLoteOrdenesTrabajoDialog = ref(null)
  const agregarUbicacionesMantenimientoDialog = ref(null)
  const imprimirMantenimientoDialog = ref(null)
  const editarParcelaDialog = ref(null)

  const estatusOrdenes = ref('Por entregar')

  const fechaAsignado = ''
  const events = [
    '2024/10/05', '2024/10/25',
  ]

  const filterDateClosePopup = ref(false)

  const classEstatus = {
    'Por entregar': 'primary',
    'Por ejecutar': 'blue',
    'Completado': 'positive',
    'Vencido': 'negative',
  }

  const $q = useQuasar()

  const showDialogFilterDate = ref(false)

  const filterDate = ref({
    field: '',
    desde: '',
    hasta: ''
  })

  /* const filterDate = ref(format(new Date(), 'yyyy-MM')) */

  const selectedRows = ref([])

  watch(estatusOrdenes, () => {
    tableRef.value.requestServerInteraction()
  })

  watch(filterDate, () => {
    tableRef.value.requestServerInteraction()
  }, { deep: true })

  /* watch(filterDate, () => {
    tableRef.value.requestServerInteraction()
  }) */

  const tableData = ref([])

  const tableColumns = [
    { name: 'acciones', label: '', align: 'left' },
    { name: 'cliente', label: 'Cliente', align: 'left' },
    { name: 'ubicacion', label: 'Ubicación', field: 'ubicacion', align: 'left', sortable: true },
    { name: 'contrato', label: 'Contrato', align: 'left', style: 'width: 1px', field: row => [
      ...new Set(row.ubicacion.contratos
        .filter(c => c.estatus == 'Activo')
        .map(c => c.num_contrato))
      ].join(', ') },
    { name: 'difuntos', label: 'Difuntos', align: 'left' },
    { name: 'fecha_vencimiento', label: 'Mes', align: 'left', field: 'fecha_vencimiento', sortable: true },
    { name: 'fecha_asignado', label: 'Asignado el', align: 'left', field: 'fecha_asignado', sortable: true },
    { name: 'fecha_completado', label: 'Completado el', align: 'left', field: 'fecha_completado', sortable: true },
    { name: 'vigente_hasta', label: 'Pagado hasta', align: 'left', field: 'vigente_hasta', sortable: true },
    { name: 'fecha_ultimo_recibo', label: 'Último recibo', align: 'left', field: 'fecha_ultimo_recibo', sortable: true },
    { name: 'estatus', label: 'Estatus', align: 'center', field: 'estatus', headerStyle: 'width: 100px' },
    { name: 'notas', label: 'Notas', align: 'left', field: 'notas', headerStyle: 'width: 100px' },
  ]

  const tableRef = ref(null)
  const tableLoading = ref(false)
  const tableFilter = ref('');
  const tablePagination = ref({
    page: 1,
    rowsPerPage: 100,
    sortBy: 'fecha_asignado',
    descending: true,
  })

  const handleEliminarOrdenesMantenimientoLote = (ids, confirm = false) => {
    if (!confirm) {
      $q.dialog({
        title: 'Eliminar ordenes de mantenimiento',
        message: '¿Estás seguro de que quieres eliminar estas ordenes de mantenimiento?',
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
        handleEliminarOrdenesMantenimientoLote(ids, true)
      })
    } else {
      tableLoading.value = true
      ids.forEach(id => {
        api.delete('mantenimiento/' + id)
          .catch(error => qNotify(error, 'error'))
        selectedRows.value = []
      });

      setTimeout(() => {
        tableRef.value.requestServerInteraction()
      }, 1000)
    }

  }

  const handleEliminarOrdenMantenimiento = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Eliminar orden de trabajo',
      message: '¿Estás seguro de que quieres eliminar esta orden de trabajo?',
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
      handleEliminarOrdenMantenimiento(id, true)
    })
  } else {
    tableLoading.value = true
    api.delete('mantenimiento/' + id)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
          tableRef.value.requestServerInteraction()
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEliminarOrdenMantenimiento(id) }))
      .finally(() => tableLoading.value = false)
  }
}

  const tableRequest = (props) => {

    console.log('props', props);

    const { page, rowsPerPage, sortBy, descending } = props.pagination ? props.pagination : props

    tableLoading.value = true;

    let endpoint = 'mantenimiento';

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

    if (estatusOrdenes.value) {
      endpoint += '&f[estatus]=' + estatusOrdenes.value;
    }

    if (filterDate.value.field?.value) {
      endpoint += '&datefield=' + filterDate.value.field.value;
      endpoint += filterDate.value.desde ? `&from=${filterDate.value.desde}` : '';
      endpoint += filterDate.value.hasta ? `&to=${filterDate.value.hasta}` : '';
    }

    if (filterDate.value.mes) {
      endpoint += '&mes=' + filterDate.value.mes.substr(0, 7);
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

  onMounted(() => {
    tableRequest(tablePagination.value)
  })

</script>
