<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog">
    <q-card class="q-pa-md" style="width: 100%">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms" @keydown.enter.prevent="">
        <q-card-section>
          <div class="text-h6">Asignar mantenimientos</div>
        </q-card-section>

        <q-card-section class="q-pa-md">

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md">
              <q-table dense :rows="parcelas" flat :columns="parcelasColumnas" row-key="id"
                :class="!$q.screen.lt.md && 'text-wrap'" ref="parcelasTableRef"
                v-model:pagination="parcelasTablePagination" :loading="parcelasTableLoading" :filter="parcelasTableFilter"
                @request="parcelasTableRequest" selection="multiple" v-model:selected="parcelasSelected">
                <template v-slot:top-left>
                  <div class="q-gutter-sm">
                    <q-checkbox v-model="dataFilters.trimestral" label="Mantenimiento trimestral" color="primary" dense />
                  </div>
                </template>
                <template v-slot:top-right>

                  <q-input class="q-mr-sm" label="Vigente hasta" dense flat v-model="dataFilters.vigente_hasta" mask="####-##" :hide-bottom-space="true" readonly clearable style="width: 150px; display: inline-flex">
                    <template v-slot:append>
                      <q-icon v-if="dataFilters.vigente_hasta" name="close" class="cursor-pointer" @click="dataFilters.vigente_hasta = ''"></q-icon>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="dataFilters.vigente_hasta" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                            @update:model-value="filterDateClosePopup = true" @navigation="filterDateClosePopup = false"
                            :default-year-month="(dataFilters.vigente_hasta || new Date().toISOString().substr(0, 7)).replace('-', '/')" years-in-month-view>
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                  <q-input dense debounce="300" v-model="parcelasTableFilter" placeholder="Buscar...">
                    <template v-slot:append>
                      <q-icon name="search" />
                    </template>
                  </q-input>

                </template>
                <template v-slot:body-cell-ubicacion="props">
                  <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
                    <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(props.row.id)">{{ props.row.codigo_parcela }}</a>
                  </q-td>
                </template>
                <template v-slot:body-cell-propietario="props">
                  <q-td :props="props" class="q-gutter-xs" style="max-width: 150px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; font-size: .75rem">
                    <template v-if="props.row.cliente_nombre || props.row.cliente_identidad">
                      {{ props.row.cliente_nombre }}
                    </template>
                    <template v-else>-</template>
                  </q-td>
                </template>
                <template v-slot:body-cell-difuntos="props">
                  <q-td :props="props">
                    <template v-if="props.row?.puestos?.filter(p => !!parseInt(p.ocupado)).length">
                      <ol class="q-my-none q-pl-sm" style="font-size: .75rem; letter-spacing: -0.25px;">
                        <li v-for="puesto in props.row?.puestos?.filter(p => !!parseInt(p.ocupado))">
                          {{ puesto.ocupante_nombre }}
                        </li>
                      </ol>
                    </template>
                    <template v-else>-</template>
                  </q-td>
                </template>
                <template v-slot:body-cell-vigente_hasta="props">
                  <q-td :props="props">
                    {{ props.row[props.col.name] && (new Date(props.row[props.col.name]) != 'Invalid Date') ? format(props.row[props.col.name], 'dd/MM/yyyy') : '-' }}
                  </q-td>
                </template>
                <template v-slot:body-cell-fecha_ultimo_mantenimiento="props">
                  <q-td :props="props">
                    <template v-if="props.row.fecha_ultimo_mantenimiento && props.row.fecha_completado_mantenimiento == props.row.fecha_ultimo_mantenimiento">
                      <div class="badge-contrato">
                        <span class="bg-primary" style="font-size:.6rem; letter-spacing: -0.2px; width: 55px; justify-content: center">
                          Completado
                        </span>
                        <span>{{ props.row.fecha_completado_mantenimiento && (new Date(props.row.fecha_completado_mantenimiento) != 'Invalid Date') ? format(props.row.fecha_completado_mantenimiento, 'dd/MM/yyyy') : '-' }}</span>
                      </div>
                    </template>
                    <template v-else-if="!props.row.fecha_ultimo_mantenimiento">
                      <span class="text-grey-5 text-italic">Sin información.</span>
                    </template>
                    <template v-else>
                      <div class="badge-contrato">
                        <span class="bg-primary" style="font-size:.6rem; letter-spacing: -0.2px; width: 55px; justify-content: center">
                          Completado
                        </span>
                        <span>{{ props.row.fecha_completado_mantenimiento && (new Date(props.row.fecha_completado_mantenimiento) != 'Invalid Date') ? format(props.row.fecha_completado_mantenimiento, 'dd/MM/yyyy') : '-' }}</span>
                      </div>
                      <br />
                      <div class="badge-contrato">
                        <span class="bg-primary" style="font-size:.6rem; letter-spacing: -0.2px; width: 55px; justify-content: center">
                          Asignado
                        </span>
                        <span>{{ props.row.fecha_ultimo_mantenimiento && (new Date(props.row.fecha_ultimo_mantenimiento) != 'Invalid Date') ? format(props.row.fecha_ultimo_mantenimiento, 'dd/MM/yyyy') : '-' }}</span>
                      </div>
                    </template>
                  </q-td>
                </template>
                <template v-slot:body-cell-fecha_ultimo_recibo="props">
                  <q-td :props="props">
                    {{ props.row[props.col.name] && (new Date(props.row[props.col.name]) != 'Invalid Date') ? format(props.row[props.col.name], 'dd/MM/yyyy') : '-' }}
                  </q-td>
                </template>
                <template v-slot:body-cell="props">
                  <q-td :props="props">
                    {{ props.value || '-' }}
                  </q-td>
                </template>
              </q-table>

            </div>
            <div class="col-12 col-md-auto flex column justify-center">
              <q-list dense bordered v-if="parcelasSelected.length" style="width: 220px; max-height: 380px; overflow-y: auto">
                <q-item v-for="(parcela, index) in parcelasSelected" :key="index">
                  <q-item-section>
                    {{ parcela.codigo_parcela }}
                  </q-item-section>
                  <q-item-section side>
                    <q-btn icon="delete" color="red" dense size="sm" @click="parcelasSelected.splice(index, 1);" />
                  </q-item-section>
                </q-item>
              </q-list>
              <q-list bordered v-else style="width: 220px; max-height: 380px; overflow-y: auto">
                <q-item>
                  <q-item-section>
                    <div class="text-grey-5 text-center">No hay ubicaciones seleccionadas.</div>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-select
                dense
                outlined
                v-model="data.lista_id"
                label="Lista seleccionada"
                emit-value
                map-options
                style="width: 220px;"
                class="q-mt-sm"
                :options="[
                  {
                    label: '-- No asignar --',
                    value: null,
                  },
                  ...listas?.map((lista) => {
                    return {
                      label: [lista.resumen, lista.titulo, lista.subtitulo]
                        .filter((el) => !!el)
                        .join(' - '),
                      value: lista.id,
                    };
                  }),
                ]"
              >
              </q-select>

              <q-input class="q-mt-sm" label="Mes asignado" dense outlined v-model="data.fecha_vencimiento" mask="####-##" :hide-bottom-space="true" readonly clearable style="width: 220px">
                <template v-slot:append>
                  <q-icon v-if="data.fecha_vencimiento" name="close" class="cursor-pointer" @click="data.fecha_vencimiento = ''"></q-icon>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="data.fecha_vencimiento" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                        @update:model-value="filterDateClosePopup = true" @navigation="filterDateClosePopup = false"
                        :default-year-month="(data.fecha_vencimiento || new Date().toISOString().substr(0, 7)).replace('-', '/')" years-in-month-view>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-checkbox v-model="data.oculto" label="Marcar como completados" color="primary" class="q-mt-sm" @update:model-value="data.fecha_vencimiento = new Date().toISOString().substr(0, data.oculto ? 10 : 7)" />

              <template v-if="data.oculto">
                <q-input dense class="q-mt-sm" type="date" v-model="data.fecha_vencimiento" outlined label="Completado el" clearable />
              </template>

            </div>
          </div>


        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
  <DialogEditarParcela ref="editarParcelaDialog" />
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

import { format, getDate, getMonth, getYear, lastDayOfMonth, startOfMonth } from 'date-fns';

// Components
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const ultimoDelMes = lastDayOfMonth(new Date())
const primeroDelMes = startOfMonth(new Date())

const dataFilters = ref({
  trimestral: false,
  vigente_hasta: new Date().toISOString().substr(0, 7),
})

const parcelas = ref([])
const editarParcelaDialog = ref(null)
const filterDateClosePopup = ref(false)

const props = defineProps({
  listas: {
    type: Array,
    required: false,
    default: () => [],
  },
});

const listas = ref([])

const parcelasColumnas = [
  { name: 'ubicacion', label: 'Ubicación', align: 'left', sortable: true, headerStyle: "width: 105px" },
  { name: 'propietario', label: 'Propietario', align: 'left', field: 'cliente_nombre', sortable: false },
  { name: 'difuntos', label: 'Difuntos', align: 'left', sortable: false },
  { name: 'vigente_hasta', label: 'Vigente hasta', align: 'left', field: 'vigente_hasta', sortable: true },
  { name: 'fecha_ultimo_mantenimiento', label: 'Fecha mantenim.', align: 'left', field: 'fecha_ultimo_mantenimiento', sortable: true },
  { name: 'fecha_ultimo_recibo', label: 'Últ. recibo', align: 'left', field: 'fecha_ultimo_recibo', sortable: true },
]

const parcelasSelected = ref([])

const parcelasTableRef = ref(null)
const parcelasTableLoading = ref(false)
const parcelasTableFilter = ref('');
const parcelasTablePagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'fecha_ultimo_recibo',
  descending: true,
})

watch(dataFilters, () => {
  console.log('dataFilters', dataFilters.value)
  parcelasTableRef.value.requestServerInteraction()
}, { deep: true })

const parcelasTableRequest = (props) => {

  console.log('props', props);
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  parcelasTableLoading.value = true;

  let endpoint = 'parcelas';

  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
  );

  if (parcelasTableFilter.value) {
    searchParams.append('q', parcelasTableFilter.value)
  }

  if (sortBy) {
    searchParams.append('order', descending ? 'DESC' : 'ASC')
  }

  if (searchParams) {
    endpoint += '?' + searchParams.toString();
  }

  endpoint += '&with[]=data&with[]=mantenimiento';

  if (dataFilters.value.trimestral) endpoint += '&trimestral=1';
  if (dataFilters.value.vigente_hasta) endpoint += `&vigente=${dataFilters.value.vigente_hasta}`;

  console.log('endpoint', endpoint);

  api.get(endpoint)
    .then(response => {
      if (response.data) {

        console.log('Response', response.data);
        parcelas.value = response.data.data
        parcelasTablePagination.value.page = response.data.pager.currentPage
        parcelasTablePagination.value.rowsPerPage = response.data.pager.perPage
        parcelasTablePagination.value.rowsNumber = response.data.pager.total
        parcelasTablePagination.value.sortBy = response.data.sortBy || null
        parcelasTablePagination.value.descending = response.data.order == 'DESC'
      }
    })
    .catch(e => console.log(e))
    .finally(() => parcelasTableLoading.value = false)
}

const data = reactive({
  fecha_vencimiento: null,
  fecha_completado: null,
  lista_id: null,
  ubicaciones: [],
  oculto: false
})

const observacionesPorTipoUbicacion = {
  Parcela: [
    { title: 'Observación', value: ''},
    { title: 'Base', value: ''},
    { title: 'Placas / Fotos / Letras', value: ''},
    { title: 'Grama', value: ''}
  ],
  Nicho: [
    { title: 'Observación', value: ''},
    { title: 'Placas / Nombre', value: ''},
    { title: 'Foto', value: ''},
  ],
  Columbario: [
    { title: 'Observación', value: ''},
    { title: 'Placas / Nombre', value: ''},
    { title: 'Foto', value: ''},
  ]
}



const handleSubmit = (confirm = false) => {

  // Chequear si alguna parcela no está vigente para el mes actual
  if (confirm !== true && parcelasSelected.value.some(p => p.vigente_hasta && new Date(p.vigente_hasta) < primeroDelMes)) {
    $q.dialog({
      title: 'Parcelas no vigentes',
      message: 'Las parcelas seleccionadas no están vigentes para el mes actual: ' + parcelasSelected.value.filter(p => p.vigente_hasta && new Date(p.vigente_hasta) < primeroDelMes).map(p => p.codigo_seccion + '-' + p.num_parcela + ' (' + new Date(p.vigente_hasta).toLocaleDateString() + ')').join(', '),
      cancel: true,
      ok: {
        label: 'Asignar de todas formas',
        color: 'primary',
        flat: true,
      },
      cancel: {
        label: 'Cerrar',
        color: 'primary',
      }
    }).onOk(() => {
      handleSubmit(true)
    })

    return;
  }

  let postData = {
    ubicaciones: parcelasSelected.value.map(ub => ub.id),
    fecha_vencimiento: data.fecha_vencimiento,
    fecha_completado: data.fecha_completado,
    lista_id: data.lista_id,
    oculto: data.oculto ? 1 : 0,
    observacionesPorTipo: observacionesPorTipoUbicacion
  }

  if (!postData.ubicaciones.length) {
    qNotify('Debe seleccionar al menos una ubicación.', 'error')
    return
  }

  if (!postData.fecha_vencimiento) {
    qNotify('Debe seleccionar una fecha de vencimiento.', 'error')
    return
  } else if (postData.fecha_vencimiento.length < 10) {
    postData.fecha_vencimiento = postData.fecha_vencimiento + '-01'
  }

  isLoadingSubmit.value = true

  console.log(postData)

  api.post('mantenimiento/asignar', postData)
    .then(response => {
      if (response.data) {
        data.ubicaciones = []
        dialog.value = false
        $q.notify({ message: 'Asignado exitosamente.', color: 'positive' })
        emit('created', response.data)
      }
    })
    .catch(error => { console.log(error); qNotify(error, 'error', { callback: handleSubmit }) })
    .finally(() => isLoadingSubmit.value = false)

}

const openDialog = (id) => {
  dialog.value = true
  listas.value = props.listas

  data.fecha_vencimiento = new Date().toISOString().substr(0, 7),

  data.ubicaciones = []
  parcelasSelected.value = []

  nextTick(() => {
    parcelasTableRef.value.requestServerInteraction()
  })
}

onMounted(() => {
  nextTick(() => {
    console.log('ori', props)
    parcelasTableRef.value.requestServerInteraction()
  })
})

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
