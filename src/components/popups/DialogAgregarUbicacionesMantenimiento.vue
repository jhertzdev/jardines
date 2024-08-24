<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xxl">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
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
                  <q-option-group
                    v-model="dataFilters"
                    type="checkbox"
                    :options="[
                      { label: 'Solo contratos vigentes', value: 'vigente' },
                      { label: 'Mantenimiento trimestral', value: 'trimestral' },
                    ]"
                    color="primary"
                    inline
                    dense
                  />
                </template>
                <template v-slot:top-right>
                  <q-input dense debounce="300" v-model="parcelasTableFilter" placeholder="Buscar...">
                    <template v-slot:append>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </template>
                <template v-slot:body-cell-codigo_parcela="props">
                  <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
                    {{ props.row.codigo_parcela }}
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

              <q-input dense class="q-mt-sm" type="date" v-model="data.fecha_vencimiento" outlined :label="data.oculto ? 'Completado el' : 'Fecha de vencimiento'" @update:model-value="handleChangeFechaVencimiento" clearable />

              <q-checkbox v-model="data.ultimo_del_mes" label="Vence al fin del mes" color="primary" class="q-mt-sm" />

              <q-checkbox v-model="data.oculto" label="Marcar como completados" color="primary" class="q-mt-sm" />

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
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

import { format, getDate, getMonth, getYear, lastDayOfMonth } from 'date-fns';

// Components
import QSelectMoneda from 'src/components/selects/QSelectMoneda.vue'
import QSelectMetodosPago from 'src/components/selects/QSelectMetodosPago.vue'
import QSelectUbicacion from 'src/components/selects/QSelectUbicacion.vue';

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const dataFilters = ref(['vigente', 'trimestral'])

const parcelas = ref([])

const parcelasColumnas = [
  { name: 'codigo_parcela', label: 'Ubicación', align: 'left', field: 'num_parcela', sortable: true, headerStyle: "width: 105px" },
  { name: 'propietario', label: 'Propietario', align: 'left', field: 'cliente_nombre', sortable: false },
  { name: 'difuntos', label: 'Difuntos', align: 'left', sortable: false },
  { name: 'vigente_hasta', label: 'Vigente hasta', align: 'left', field: 'vigente_hasta', sortable: true },
  { name: 'fecha_ultimo_mantenimiento', label: 'Últ. mantenim.', align: 'left', field: 'fecha_ultimo_mantenimiento', sortable: true },
]

const parcelasSelected = ref([])

const parcelasTableRef = ref(null)
const parcelasTableLoading = ref(false)
const parcelasTableFilter = ref('');
const parcelasTablePagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'codigo_parcela',
  descending: false,
})

watch(dataFilters, () => {
  console.log('dataFilters', dataFilters.value)
  parcelasTableRef.value.requestServerInteraction()
})

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

  dataFilters.value.forEach(filter => {
    endpoint += `&${filter}=1`;
  });

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
  ubicaciones: [],
  ultimo_del_mes: true,
  oculto: false
})

const handleChangeFechaVencimiento = (val) => {

  let ultimoDiaDelMes = val ? getDate(lastDayOfMonth(val)) : null;
  let year = val? getYear(val) : null
  let month = val ? getMonth(val) + 1 : null

  if (ultimoDiaDelMes && data.ultimo_del_mes) {
    data.fecha_vencimiento = `${year}-${month.toString().padStart(2, '0')}-${ultimoDiaDelMes}`
  }

}


const handleSubmit = () => {

  let postData = {
    ubicaciones: parcelasSelected.value.map(ub => ub.id),
    fecha_vencimiento: data.fecha_vencimiento,
    oculto: data.oculto ? 1 : 0,
  }

  if (!postData.ubicaciones.length) {
    qNotify('Debe seleccionar al menos una ubicación.', 'error')
    return
  }

  if (!data.fecha_vencimiento) {
    qNotify('Debe seleccionar una fecha de vencimiento.', 'error')
    return
  }

  isLoadingSubmit.value = true

  console.log(postData)

  api.post('mantenimiento/asignar', postData)
    .then(response => {
      if (response.data) {
        data.value = {
          fecha_vencimiento: null,
          ubicaciones: [],
          ultimo_del_mes: true,
          oculto: false
        }
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

  data.ultimo_del_mes = true
  data.ubicaciones = []
  parcelasSelected.value = []

  nextTick(() => {
    parcelasTableRef.value.requestServerInteraction()
  })
}

onMounted(() => {
  nextTick(() => {
    parcelasTableRef.value.requestServerInteraction()
  })
})

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
