<template>
  <div class="row q-col-gutter-md">
    <div class="col-md-12">
      <q-card class="q-mb-md">
        <q-card-section class="bg-primary text-white flex justify-between items-center">
          <div class="text-h6">Gestión de cobro</div>
          <div class="flex items-center q-gutter-sm">
            <q-btn label="Calculadora" icon="calculate" flat @click="calculadoraDialog.openDialog()" />
            <q-btn label="Imprimir" icon="print" flat @click="() => imprimirTablaCobros()" />
            <q-field label="Fecha de vencimiento" dark readonly stack-label dense outlined style="width: 275px;">
              <template v-slot:control>
                <div class="self-center full-width no-outline" tabindex="0">{{ fechaVencimientoLabel }}</div>
              </template>
              <template v-slot:append>
                <q-icon v-if="fechaVencimiento" name="close" class="cursor-pointer" @click="fechaVencimiento = ''"></q-icon>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="fechaVencimiento" range default-view="Months" emit-immediately
                      v-close-popup="filterDateClosePopup"
                      @update:model-value="cargarParcelasVigentesPorFecha()"
                      years-in-month-view
                      subtitle="Selecciona rango o pulsa doble click">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-field>
          </div>
        </q-card-section>
        <q-card-section>
          <template v-if="isLoading">
            <div class="text-center q-py-xl">
              <q-spinner size="xl" color="primary" />
            </div>
          </template>
          <template v-else>
            <q-virtual-scroll
              type="table"
              style="max-height: 50vh"
              dense flat
              separator="cell"
              :virtual-scroll-item-size="48"
              :virtual-scroll-sticky-size-start="48"
              :virtual-scroll-sticky-size-end="32"
              :items="parcelas"
            >
              <template v-slot:before>
                <thead class="thead-sticky text-left">
                  <tr>
                    <th v-for="col in Object.keys(columns)" :key="col" style="max-width: 1px; padding-left: 8px; padding-right: 8px; text-align: center">
                      {{ columns[col] }}
                    </th>
                  </tr>
                </thead>
              </template>
              <template v-slot="{ item: row, index }">
                <tr :key="index">
                  <td style="max-width: 50px; text-align: center; padding-left: 8px;">
                    <a href="javascript:void(0)" @click="(e) => verContratosDialog.openDialog(row.contratos.find(c => c.estatus == 'Activo' && c.tipo_actividad == 'mantenimiento_parcelas')?.num_contrato, row.contratos.find(c => c.estatus == 'Activo' && c.tipo_actividad == 'mantenimiento_parcelas')?.tipo_parcela)">
                      {{ row.contratos.find(c => c.estatus == 'Activo' && c.tipo_actividad == 'mantenimiento_parcelas')?.num_contrato }}
                    </a>
                  </td>
                  <td style="max-width: 150px; white-space: break-spaces; line-height: 1.15;">
                    <a href="javascript:void(0)" @click="(e) => editarClienteDialog.openDialog(row.propietario_id)">
                      {{ row.cliente_nombre }}
                    </a>
                  </td>
                  <td style="max-width: 50px; text-align: center;">
                    <a href="javascript:void(0)" @click="(e) => editarParcelaDialog.openDialog(row.id)">
                      {{ row.codigo_parcela }}
                    </a>
                  </td>
                  <td style="max-width: 150px; white-space: break-spaces; line-height: 1.15;">
                    {{ row.puestos.filter(p => !!parseInt(p.ocupado)).map(p => p.ocupante_nombre).join(', ') }}
                  </td>
                  <td style="max-width: 100px; text-align: center; padding-right: 8px;" :class="{ 'bg-red-2 text-red': row.proximo_mantenimiento == 0, 'bg-yellow-2 text-orange': row.proximo_mantenimiento == 2 }">
                    {{ row.fecha_ultimo_mantenimiento && new Date(row.fecha_ultimo_mantenimiento) != 'Invalid Date' ? format(new Date(row.fecha_ultimo_mantenimiento), 'dd/MM/yyyy') : '-' }}
                  </td>
                  <td style="max-width: 100px; text-align: center;">
                    {{ row.vigente_hasta && new Date(row.vigente_hasta) != 'Invalid Date' ? format(new Date(row.vigente_hasta), 'dd/MM/yyyy') : '-' }}
                  </td>
                  <td style="max-width: 100px;">
                    <template v-if="row.fecha_ultima_nota">
                      <q-badge class="cursor-pointer bg-green-1 text-black column" style="white-space: wrap; align-items: end;" :class="`badge-status badge-status-${slugify(row.estatus_nota)}`" @click="(e) => agregarNotasCobroDialog.openDialog(row.propietario_id, { nombre_completo: row.cliente_nombre })">
                        {{ row.descripcion_nota }} <span class="text-grey-6" style="font-size: .65rem">{{ new Date(row.fecha_ultima_nota) ? format(new Date(row.fecha_ultima_nota), 'dd/MM/yyyy HH:mm') : '-' }}</span>
                      </q-badge>
                    </template>
                    <template v-else>
                      <q-btn outline color="primary" icon="add" label="Agregar nota" size="xs" class="q-px-sm" @click="(e) => agregarNotasCobroDialog.openDialog(row.propietario_id, { nombre_completo: row.cliente_nombre })"/>
                    </template>
                  </td>
                </tr>
              </template>
            </q-virtual-scroll>
          </template>
        </q-card-section>
      </q-card>
    </div>

  </div>

  <DialogVerContratos ref="verContratosDialog" />
  <DialogEditarParcela ref="editarParcelaDialog" />
  <DialogAgregarCliente ref="editarClienteDialog" />
  <DialogAgregarNotasCobro ref="agregarNotasCobroDialog" @created="() => cargarParcelasVigentesPorFecha()" @updated="() => cargarParcelasVigentesPorFecha() "/>
  <DialogCalculadora ref="calculadoraDialog" />
</template>

<style>
.q-table .btn-link {
  margin: 2px 3px;
}

.badge-status-contactado {
  background-color: #e3f2fd !important
}

.badge-status-no-contactado {
  background-color: #ffebee !important
}

.badge-status-respondido {
  background-color: #e8f5e9 !important
}

</style>

<script setup>

import { ref, onMounted, watch, computed } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { qNotify, slugify } from 'src/boot/jardines';
import xlsx from 'json-as-xlsx';

import DialogVerContratos from "src/components/popups/DialogVerContratos.vue";
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogAgregarNotasCobro from "src/components/popups/DialogAgregarNotasCobro.vue";
import DialogCalculadora from "src/components/popups/DialogCalculadora.vue";

import { format } from 'date-fns';

const $q = useQuasar()

const parcelas = ref([]);

const columns = {
  num_contrato: 'Contrato',
  cliente_nombre: 'Cliente',
  ubicacion: 'Ubicación',
  difuntos: 'Difunto/s',
  ultimo_mantenimiento: 'Últ. mantenim.',
  fecha_vencimiento: 'Fecha vencim.',
  estatus: 'Notas'
}

const isLoading = ref(true)
const fechaVencimiento = ref(new Date().toISOString().substr(0, 10).replaceAll('-', '/'))
//const fechaVencimiento = ref('2040/01/01');
const filterDateClosePopup = ref(false)

const verContratosDialog = ref(null)
const editarParcelaDialog = ref(null)
const editarClienteDialog = ref(null)
const agregarNotasCobroDialog = ref(null)
const calculadoraDialog = ref(null)

const fechaVencimientoLabel = computed(() => {
  if (!fechaVencimiento.value) return '-- Selecciona una fecha --';

  if (fechaVencimiento.value?.from) {
    return 'Del ' + format(fechaVencimiento.value.from, 'dd/MM/yyyy') + ' al ' + format(fechaVencimiento.value.to, 'dd/MM/yyyy');
  } else {
    return 'Hasta el ' + format(fechaVencimiento.value, 'dd/MM/yyyy');
  }
})

const searchQuery = ref('')

watch(searchQuery, query => {

  if (!query || query.length < 3) return searchResults.value = {};

  const searchParams = new URLSearchParams;
  searchParams.append('q', query)

  api.get('search?' + searchParams.toString())
    .then(response => {
      if (response.data) searchResults.value = response.data
    })
    .catch(error => console.log(error))

})

const dashboardOptions = ref([
  {
    name: "Clientes",
    path: "/app/clientes",
    key: "clientes",
    icon: "people",
    count: 0,
  },
  {
    name: "Parcelas",
    path: "/app/parcelas",
    key: "parcelas",
    icon: "yard",
    count: 0,
  },
])

const searchResults = ref({});

const emit = defineEmits(['toggleBusqueda'])

onMounted(() => {
  api.get('pages/dashboard')
    .then(response => {
      if (response.data) {
        Object.keys(response.data).forEach(k => {
          let index = dashboardOptions.value.findIndex(option => option.key === k)
          if (index > -1) {
            dashboardOptions.value[index].count = response.data[k]
          }
        });
      }
    })
    .catch(error => qNotify(error, 'error'))

  cargarParcelasVigentesPorFecha()

  emit('toggleBusqueda', true)
})

const imprimirTablaCobros = () => {
  let tableData = [{
    sheet: "Hoja",
    columns: [
      { label: 'Contrato', value: 'num_contrato' },
      { label: 'Cliente', value: 'cliente_nombre' },
      { label: 'Ubicación', value: 'codigo_parcela' },
      { label: 'Últ. mantenim.', value: 'fecha_ultimo_mantenimiento' },
      { label: 'Fecha vencim.', value: 'fecha_vencimiento' },
    ],
    content: parcelas.value.map(row => {
      row = JSON.parse(JSON.stringify(row))
      row.num_contrato = row.contratos.find(c => c.estatus == 'Activo' && c.tipo_actividad == 'mantenimiento_parcelas')?.num_contrato
      row.ubicacion = row.parcelas_posiciones?.find(p => p.id == row.ubicacion_id)?.codigo_seccion + '-' + row.parcelas_posiciones?.find(p => p.id == row.ubicacion_id)?.num_parcela
      row.fecha_ultimo_mantenimiento = row.fecha_ultimo_mantenimiento ? format(new Date(row.fecha_ultimo_mantenimiento), 'dd/MM/yyyy') : '-'
      row.fecha_vencimiento = row.vigente_hasta ? format(new Date(row.vigente_hasta), 'dd/MM/yyyy') : '-'
      return row
    })
  }];

  let settings = {
    fileName: "gestion-cobros_" + format(new Date(), "yyyy-MM-dd"),
    extraLength: 3,
    writeMode: "writeFile",
    writeOptions: {},
  }

  console.log(tableData)

  xlsx(tableData, settings) // Will download the excel file*/
}

const cargarParcelasVigentesPorFecha = () => {
  let vencimientoDesdeFecha, vencimientoHastaFecha;

  if (fechaVencimiento.value?.from) {
    vencimientoDesdeFecha = fechaVencimiento.value.from.replaceAll('/', '-');
    vencimientoHastaFecha = fechaVencimiento.value.to.replaceAll('/', '-');
  } else {
    vencimientoDesdeFecha = ''
    vencimientoHastaFecha = fechaVencimiento.value ? fechaVencimiento.value.replaceAll('/', '-') : '';
  }

  let endpoint = `parcelas?sortBy=vigente_hasta&order=DESC&page=1&rowsPerPage=200&with[]=mantenimiento&vencimiento_desde=${vencimientoDesdeFecha}&vencimiento_hasta=${vencimientoHastaFecha}&proximo_mantenimiento=1&ultima_nota=1`
  console.log(endpoint)

  api.get(endpoint)
  .then(response => {
    if (response.data) {
      parcelas.value = response.data.data
      isLoading.value = false
    }
  })
}


const router = useRouter()




</script>
