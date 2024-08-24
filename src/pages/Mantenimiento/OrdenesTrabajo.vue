<template>
  <div class="text-right q-mb-sm">
    <q-btn size="sm" label="Asignar mantenimientos" icon="handyman" color="primary" @click="agregarUbicacionesMantenimientoDialog.openDialog()" />
  </div>
  <q-table dense :rows="tableData" flat :columns="tableColumns" row-key="id"
    :class="!$q.screen.lt.md && 'text-wrap'" ref="tableRef"
    v-model:pagination="tablePagination" :loading="tableLoading" :filter="tableFilter"
    @request="tableRequest">
    <template v-slot:top-left>
      <q-btn-toggle v-model="estatusOrdenes" toggle-color="primary" :options="[
        { label: 'Completadas', value: '1' },
        { label: 'Pendientes', value: '0' },
      ]" />
      <q-input class="q-ml-sm" label="Filtrar por mes" dense outlined v-model="filterDate" mask="####-##" :hide-bottom-space="true" style="max-width: 150px;" readonly clearable>
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
      </q-input>
    </template>
    <template v-slot:top-right>
      <q-input dense debounce="300" v-model="tableFilter" placeholder="Buscar...">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
    <template v-slot:body-cell-acciones="props">
      <q-td :props="props" class="q-gutter-xs">
        <q-btn size="sm" dense color="primary" icon="handyman" @click="editarOrdenTrabajoDialog.openDialog(props.row.id)" />
        <q-btn size="sm" dense color="negative" icon="delete" @click="handleEliminarOrdenMantenimiento(props.row.id)" />
      </q-td>
    </template>
    <template v-slot:body-cell-ubicacion="props">
      <q-td :props="props">
        {{ props.row.ubicacion.codigo_parcela }}
      </q-td>
    </template>
    <template v-slot:body-cell-cliente="props">
      <q-td :props="props" style="max-width: 150px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
        {{ props.row.ubicacion.propietario.propietario_nombre }} ({{ props.row.ubicacion.propietario.propietario_identidad }})
      </q-td>
    </template>
    <template v-slot:body-cell-difuntos="props">
      <q-td :props="props">
        <ol class="q-my-none q-pl-sm" style="font-size: .75rem; letter-spacing: -0.25px;">
          <li v-for="puesto in props.row.ubicacion?.puestos?.filter(p => !!parseInt(p.ocupado))">
            {{ puesto.ocupante_nombre }}
          </li>
        </ol>
      </q-td>
    </template>
    <template v-slot:body-cell-fecha_vencimiento="props">
      <q-td :props="props">
        <template v-if="props.row.fecha_vencimiento && new Date(props.row.fecha_vencimiento) != 'Invalid Date'">
          {{ format(props.row.fecha_vencimiento, 'dd/MM/yyyy') }}
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
    <template v-slot:body-cell-vigente_hasta="props">
      <q-td :props="props">
        <template v-if="props.row.ubicacion?.vigente_hasta && new Date(props.row.ubicacion.vigente_hasta) != 'Invalid Date'">
          {{ format(props.row.ubicacion.vigente_hasta, 'dd/MM/yyyy') }}
        </template>
        <template v-else>
          <span>-</span>
        </template>
      </q-td>
    </template>
    <template v-slot:body-cell-estatus="props">
      <q-td :props="props">
        <q-badge :color="props.row.estatus == 'Completado' ? 'primary' : (props.row.estatus == 'Vencido' ? 'negative' : 'secondary')" :label="props.row.estatus" />
        <q-linear-progress stripe :value="props.row.avance / 100" :color="props.row.estatus == 'Completado' ? 'primary' : (props.row.estatus == 'Vencido' ? 'negative' : 'secondary')"  />
      </q-td>
    </template>
  </q-table>
  <DialogEditarOrdenTrabajo ref="editarOrdenTrabajoDialog" @updated="tableRequest(tablePagination)" />
  <DialogAgregarUbicacionesMantenimiento ref="agregarUbicacionesMantenimientoDialog" @created="tableRequest(tablePagination)" />
</template>

<script setup>

  import { ref, reactive, onMounted, watch } from 'vue';
  import { api } from 'src/boot/axios';
  import { useRoute } from 'vue-router';
  import { useQuasar } from 'quasar';
  import { qNotify } from 'src/boot/jardines';
  import DialogEditarOrdenTrabajo from 'src/components/popups/DialogEditarOrdenTrabajo.vue';
  import DialogAgregarUbicacionesMantenimiento from "src/components/popups/DialogAgregarUbicacionesMantenimiento.vue";

  import { format } from 'date-fns'

  const editarOrdenTrabajoDialog = ref(null)
  const editarCaracteristicasUbicacionDialog = ref(null)
  const agregarUbicacionesMantenimientoDialog = ref(null)

  const estatusOrdenes = ref('0')
  const $q = useQuasar()

  const filterDate = ref(format(new Date(), 'yyyy-MM'))

  watch(estatusOrdenes, () => {
    tableRef.value.requestServerInteraction()
  })

  watch(filterDate, () => {
    tableRef.value.requestServerInteraction()
  })

  const tableData = ref([])

  const tableColumns = [
    { name: 'acciones', label: '', align: 'left' },
    { name: 'cliente', label: 'Cliente', align: 'left' },
    { name: 'ubicacion', label: 'Ubicación', align: 'left' },
    { name: 'contrato', label: 'Contrato', align: 'left', field: row => [
      ...new Set(row.ubicacion.contratos
        .filter(c => c.estatus == 'Activo')
        .map(c => c.num_contrato))
      ].join(', ') },
    { name: 'difuntos', label: 'Difuntos', align: 'left' },
    { name: 'fecha_vencimiento', label: 'Vencimiento', align: 'left', field: 'fecha_vencimiento' },
    { name: 'fecha_completado', label: 'Completado el', align: 'left', field: 'fecha_completado' },
    { name: 'vigente_hasta', label: 'Pagado hasta', align: 'left', field: 'vigente_hasta' },
    { name: 'estatus', label: 'Estatus', align: 'center', field: 'estatus', headerStyle: 'width: 100px' },
  ]

  const tableRef = ref(null)
  const tableLoading = ref(false)
  const tableFilter = ref('');
  const tablePagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'fecha_completado',
    descending: true,
  })

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
      endpoint += '&completado=' + estatusOrdenes.value;
    }

    if (filterDate.value) {
      endpoint += '&mes=' + filterDate.value;
    }

    //endpoint += '&with[]=data';

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
