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
        <q-btn label="Agregar servicio" icon="add" color="primary" @click="showDialogAgregarServicio = true" />
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
          <q-btn color="primary" dense flat size="sm" icon="edit" @click="openDialogEditarServicio(props.row.id)" />
          <q-btn color="negative" dense flat size="sm" icon="delete" @click="handleEliminarServicio(props.row.id)" />
        </div>
      </q-td>
    </template>
    <template v-slot:body-cell-ubicacion="props">
      <q-td :props="props" style="width: 1px">
        <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(props.row.ubicacion_id)">{{ props.row.ubicacion}}</a>
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
        <a href="javascript:void(0)" @click="verContratosDialog.openDialog(props.row.num_contrato, props.row.tipo_contrato)" v-if="props.row.num_contrato">
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
          {{ format(props.row.fecha_asignado, 'hh:mm a') }}
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

  <q-dialog v-model="showDialogAgregarServicio" class="j-dialog j-dialog-lg">
    <q-card>
      <q-form @submit="handleSubmit">
        <q-card-section>
          <div class="text-h6">{{ agregarServicioData.id ? 'Editar servicio' : 'Agregar servicio' }}</div>
        </q-card-section>
        <q-card-section>

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-select dense v-model="agregarServicioData.clase_servicio" outlined label="Categoría de servicio"
              :options="['Inhumación', 'Exhumación', 'Cremación']"
              @update:model-value="(val) => {
                if (val == 'Cremación') agregarServicioData.ubicacion_id = null
              }" lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona una categoría']" hide-hint hide-bottom-space></q-select>
            </div>
            <div class="col-6">
              <QSelectUbicacion dense v-model="agregarServicioData.ubicacion_id" outlined
                :disable="!agregarServicioData.clase_servicio || agregarServicioData.clase_servicio == 'Cremación'"
                @selected="handleSelectUbicacion" clearable required lazy-rules="true" :rules="[val => val > 0 || ' ']"
              />
            </div>
            <div class="col-6">
              <q-input dense v-model="agregarServicioData.tipo_contrato" outlined label="Tipo de contrato" readonly />
            </div>
            <div class="col-6">
              <q-select dense v-model="agregarServicioData.tipo_servicio" outlined label="Tipo de servicio"
                :options="['1er Cuerpo', '2do Cuerpo']" :disable="agregarServicioData.tipo_contrato != 'Parcela'"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona un tipo de servicio']" hide-bottom-space></q-select>
            </div>
            <div class="col-4">
              <q-input dense type="date" v-model="agregarServicioData.fecha_servicio" outlined label="Fecha"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona una fecha']" hide-bottom-space />
            </div>
            <div class="col-4">
              <q-input dense type="time" v-model="agregarServicioData.hora_servicio" outlined label="Hora" step="60"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona una hora']" hide-bottom-space/>
            </div>
            <div class="col-4">
              <q-select dense v-model="agregarServicioData.estatus" outlined label="Estatus" :options="['Pendiente', 'Completado']"></q-select>
            </div>
            <div class="col-4">
              <q-input dense v-model="agregarServicioData.num_contrato" outlined label="Núm. contrato" />
            </div>
            <div class="col-8">
              <q-input dense v-model="agregarServicioData.difunto" outlined label="Nombre del difunto"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Escribe del nombre del difunto/a']" hide-bottom-space/>
            </div>
            <div class="col-12">
              <q-input dense outlined type="textarea" rows="2" label="Observaciones" v-model="agregarServicioData.observaciones"></q-input>
            </div>
            <div class="col-12" v-if="agregarServicioData.tipo_contrato && agregarServicioData.tipo_contrato != 'Cremación'">
              <q-checkbox v-model="agregarServicioData.incluir_mantenimiento" label="Incluir en mantenimiento del mes" />
              <q-checkbox v-model="agregarServicioData.entrega_parcela" :label="'Hace entrega de ' + agregarServicioData.tipo_contrato.toLowerCase()"  />
            </div>

          </div>

        </q-card-section>
        <q-card-actions align="right">
          <q-btn type="button" label="Cerrar" flat @click="showDialogAgregarServicio = false" />
          <q-btn type="submit" :label="agregarServicioData.id ? 'Editar' : 'Agregar'" color="primary" :loading="isLoadingSubmit"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>


</template>

<script setup>

  import { ref, reactive, onMounted, watch } from 'vue';
  import { api } from 'src/boot/axios';
  import { useRoute } from 'vue-router';
  import { useQuasar } from 'quasar';
  import { qNotify } from 'src/boot/jardines';

  import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";
  import DialogVerContratos from "src/components/popups/DialogVerContratos.vue";

  import { format, lastDayOfMonth, startOfMonth } from 'date-fns'
  import QSelectUbicacion from 'src/components/selects/QSelectUbicacion.vue';

  const verContratosDialog = ref(null)
  const editarParcelaDialog = ref(null)

  const openDialogEditarServicio = (id) => {

    if (id) {
      api.get('parque/servicios/' + id).then((response) => {
        agregarServicioData.value = response.data
        showDialogAgregarServicio.value = true
      })
    } else {
      showDialogAgregarServicio.value = true
    }


  }

  const showDialogAgregarServicio = ref(false)

  const filterDateClosePopup = ref(false)

  const isLoadingSubmit = ref(false);

  const classEstatus = {
    'Pendiente': 'yellow-9',
    'Completado': 'primary',
  }

  const $q = useQuasar()

  const agregarServicioData = ref({
    incluir_mantenimiento: false,
    entrega_parcela: false
  })

  const filterDate = ref({
    field: '',
    desde: '',
    hasta: ''
  })

  const handleSelectUbicacion = (val) => {
    agregarServicioData.value.tipo_contrato = val?.tipo_parcela?.tipo_parcela;

    if (!val || val?.tipo_parcela?.tipo_parcela == 'Cremación') {
      agregarServicioData.value.tipo_servicio = null
      agregarServicioData.value.incluir_mantenimiento = false
      agregarServicioData.value.entrega_parcela = false
    }
  }

  watch(filterDate, () => {
    tableRef.value.requestServerInteraction()
  }, { deep: true })

  const handleSubmit = () => {
    isLoadingSubmit.value = true;

    api.post('parque/servicios', agregarServicioData.value).then((response) => {
      qNotify('Servicio agregado', 'positive')
      agregarServicioData.value = {
        incluir_mantenimiento: false,
        entrega_parcela: false
      }
      showDialogAgregarServicio.value = false
      tableRef.value.requestServerInteraction();
    })
    .catch((error) => {
      console.log(error);
      qNotify(error, 'error')
    })
    .finally(() => {
      isLoadingSubmit.value = false;
    });

  }

  /* watch(filterDate, () => {
    tableRef.value.requestServerInteraction()
  }) */

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
