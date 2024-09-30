<template>


  <template v-if="reciboData.generar_recibo">

    <template v-if="cajaSeleccionada">

      <template v-if="cajaSeleccionada.esta_abierta">
        <q-table
          dense
          flat
          class="contratos-recibo-table"
          hide-bottom="false"
          table-header-class="bg-green-1"
          :rows="tableData"
          :columns="tableColumns"
          row-key="id"
          hide-no-data
          hide-pagination
          v-model:pagination="tablePagination"
        >
          <template v-slot:body-cell-tipo="props">
            <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
              <q-btn
                icon="delete"
                size="sm"
                dense
                color="red"
                flat
                @click="deleteRow(props.row)"
                style="margin-top: -10px"
                @mouseover="hoveredRow = props.row"
                @mouseleave="hoveredRow = null"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-descripcion="props">
            <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">

              <q-select
                v-model="props.row['tipo']"
                dense
                borderless
                :options="filteredServicios"
                option-value="id"
                option-label="nombre_producto"
                map-options
                :hide-dropdown-icon="!!props.row['tipo']"
                @update:model-value="handleChangeTipoServicio(props.row)"
              >
                <template v-slot:selected>
                  <q-chip
                    removable
                    v-if="props.row['tipo']"
                    @remove="
                      props.row['tipo'] = null;
                      handleChangeTipoServicio(props.row);
                    "
                  >
                    {{ props.row['tipo']?.nombre_producto }}
                  </q-chip>
                  <span class="text-grey-5" style="font-size: 10px" v-else> -- Línea personalizada -- </span>
                </template>
              </q-select>

              <q-input type="textarea" rows="1" autogrow dense v-model="props.row.descripcion" style="margin-bottom: 20px;" readonly>
                <template v-slot:append>
                  <q-btn flat color="primary" dense size="sm" icon="edit">
                    <q-popup-proxy @hide="props.row.descripcion = props.row.descripcion_plantilla; handleRellenarDescripcion(props.row)">
                      <q-banner>
                        <q-input type="textarea" autogrow dense outlined v-model="props.row.descripcion_plantilla" label="Descripción" style="width: 300px" />
                        <div class="q-mt-xs q-gutter-xs">
                          <q-btn outline dense size="sm" color="primary" label="Fecha desde" class="q-pa-xs" @click="props.row.descripcion_plantilla += '__DESDE__'" />
                          <q-btn outline dense size="sm" color="primary" label="Fecha hasta" class="q-pa-xs" @click="props.row.descripcion_plantilla += '__HASTA__'"/>
                          <q-btn outline dense size="sm" color="primary" label="Ubicaciones" class="q-pa-xs" @click="props.row.descripcion_plantilla += '__UBICACIONES__'"/>
                        </div>
                      </q-banner>
                    </q-popup-proxy>
                  </q-btn>
                </template>
              </q-input>

              <div class="text-right" style="min-height: 20px; margin-top: -15px;" v-if="props.row['tipo']?.requiere_ubicaciones == 1">
                <QSelectParcelasLinea class="q-select-parcelas-linea" dense :ubicaciones="reciboData.ubicaciones" options-dense v-model="props.row['ubicaciones']"
                  :use-input="!props.row['ubicaciones']?.length" placeholder="Asignar ubicaciones" @update:model-value="handleRecalcularLinea(props.row)"/>
              </div>

            </q-td>
          </template>

          <template v-slot:body-cell-cantidad="props">
            <q-td :props="props" :class="{'highlighted': hoveredRow === props.row }">

              <q-input dense :label="props.row.tipo?.tipo_producto == 'Mantenimiento' ? 'Ubicaciones' : null" v-model="props.row[props.col.name]" type="number" step="1" min="1" style="margin-bottom: 20px;" :disable="!!parseInt(props.row.tipo?.requiere_ubicaciones)" @update:model-value="handleRecalcularLinea(props.row)" />
              <template v-if="props.row.tipo?.tipo_producto == 'Mantenimiento'">
                <q-input label="Años" type="number" step="1" min="0" stack-label dense v-model="props.row['cuotas']" @update:model-value="val => handleRecalcularLinea(props.row, val)" required style="margin-top: -20px;" />
              </template>

            </q-td>
          </template>

          <template v-slot:body-cell-precio="props">
            <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
              <template v-if="props.row.tipo">
                {{ $dinero(props.row[props.col.name]) }}
              </template>
              <template v-else>
                <q-input dense v-model="props.row[props.col.name]" type="number" step="0.01" min="0" @update:model-value="handleRecalcularLinea(props.row)" />
              </template>
              <div style="height: 20px;">
                <template v-if="selectedMoneda">
                  <span class="text-grey-5">{{ selectedMoneda?.simbolo }} {{ $dinero(selectedMoneda?.tasa * props.row[props.col.name]) }}</span>
                </template>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-total="props">
            <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
              {{ $dinero(props.row[props.col.name]) }}
              <div style="height: 20px;">
                <template v-if="selectedMoneda">
                  <span class="text-grey-5">{{ selectedMoneda?.simbolo }} {{ $dinero(selectedMoneda?.tasa * props.row[props.col.name]) }}</span>
                </template>
              </div>
            </q-td>
          </template>

          <template v-slot:bottom-row>
            <q-td colspan="100%" class="text-center">
              <q-btn label="Agregar servicio" class="q-my-md" icon="add" color="primary" @click="agregarServicio" />
            </q-td>
          </template>


        </q-table>

        <div class="flex column items-end q-mr-md">
          <q-table flat dense hide-bottom hide-header :columns="totalsColumns" :rows="totalsData">
            <template v-slot:body-cell-tipo="props">
              <q-td :props="props" style="border: none;">
                <span class="text-weight-bold" style="font-size: .95rem">{{ props.value || '-' }}</span>
              </q-td>
            </template>
            <template v-slot:body-cell-total="props">
              <q-td :props="props" style="border: none;" class="text-right">
                <div class="q-pl-xl">{{ $dinero(props.value) }}</div>
                <div class="text-grey">{{ $dinero(props.value * (selectedMoneda?.tasa || 1)) }} {{ selectedMoneda?.simbolo }}</div>
              </q-td>
            </template>
          </q-table>

          <q-btn color="primary" class="q-mt-sm" size="sm" label="Agregar pago" icon="credit_card" @click="agregarPagoDialog.openDialog(null, {
            ...reciboData,
            cliente_id: reciboData.comprador_id,
            caja_id: cajaSeleccionada.id,
            simbolo: selectedMoneda.simbolo,
            tasa_actual: selectedMoneda.tasa,
            subtotal: totalsData.find(total => total.tipo == 'Subtotal').total,
            balance: totalsData.find(total => total.tipo == 'Total').total,
            lineas: tableData.map(row => {
              return {
                precio_unitario: row.precio,
                total_ref: row.total,
                descripcion: row.descripcion,
              }
            })
          })" />

        </div>
      </template>
      <template v-else>
        <q-banner class="bg-grey-3 q-pb-md">
      <template v-slot:avatar>
        <q-icon name="lock" color="red" />
          </template>
          <div class="row">
            <div class="col-md flex items-center">
              <div>La caja está cerrada.</div>
            </div>
            <div class="col-md-auto">
              <q-btn color="primary" label="Abrir caja" icon="login" to="/caja" />
            </div>
          </div>
          <template v-slot:action>
          </template>
        </q-banner>
      </template>

    </template>
    <template v-else>
      <q-banner class="bg-grey-3 q-pa-lg">
        <div class="row">
          <div class="col-md flex items-center">
            <div>Selecciona una empresa.</div>
          </div>
        </div>
        <template v-slot:action>
        </template>
      </q-banner>
    </template>

  </template>

  <template v-else>
    <q-banner class="bg-grey-3 q-pa-lg">
      <div class="row">
        <div class="col-md flex items-center">
          <div>No se generará un recibo.</div>
        </div>
      </div>
    </q-banner>
  </template>

  <DialogAgregarPago ref="agregarPagoDialog" @updated="handleAgregarPago" />

</template>

<style>
  .highlighted {
    background-color: #ffebee !important;
  }

  .td-cantidad-cuotas .q-field__marginal {
    padding: 0;
  }

  .td-cantidad-cuotas .q-field__marginal .q-icon {
    font-size: 12px;
  }

  .td-cantidad-cuotas .q-field--outlined .q-field__control {
    padding: 0 2px;
    text-align: center;
    border-radius: 0
  }

  .input-cuotas {
    margin-bottom: 5px;
  }

  .input-cuotas .q-field__control {
    height: 36px;
  }

  .input-cuotas .q-field__label {
    top: 5px;
  }

  .input-cuotas .q-field__native {
    padding-top: 18px;
  }

  .input-cuotas .q-field__control-container {
    margin-left: 2px;
  }

  .input-cuotas .q-field__append {
    padding: 0;
  }

  .input-cuotas .q-field__append .q-icon {
    font-size: 12px;
    margin-right: 2px;
    color: red;
  }

  .q-field--date.q-field--dense .q-field__native {
    font-size: 10px !important;
  }

  .q-select-parcelas-linea .q-field__bottom {
    padding-top: 2px;
    color: var(--q-primary);
    font-weight: 600;
  }

  .contratos-recibo-table * {
    font-size: 10px;
    line-height: 1.15 !important;
  }

  .q-table .q-field__native {
    color: #000;
  }

  .q-table .q-select .q-chip__content {
    overflow: hidden;
  }

  .q-table .q-select .q-field__control {
    width: 100%;
    max-width: 230px;
  }

  .q-select.select-ubicaciones-linea .q-field__control {
    max-width: 100%;
  }

  .select-ubicaciones-linea .q-field__marginal {
    height: 20px;
  }

  .select-ubicaciones-linea .q-field__native {
    padding: 1px 0 0 0;
  }

  .select-ubicaciones-linea .q-field__control,
  .select-ubicaciones-linea .q-field__native {
    min-height: 20px !important;
  }

  .select-ubicaciones-linea .q-placeholder {
    font-size: 11px;
    min-height: 20px;
  }

  .select-ubicaciones-linea .q-chip--dense {
    margin: 0 1px 1px 0;
    font-size: 11px;
    letter-spacing: -0.5px;
  }

</style>

<script setup>
import { ref, reactive, onMounted, computed, watch, toRaw } from "vue";
import { api } from "src/boot/axios";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAppStore } from "src/stores/app.store";
import { $dinero, qNotify } from "src/boot/jardines";
import { add } from "date-fns";

import DialogAgregarPago from "src/components/popups/DialogAgregarPago.vue";
import QSelectParcelasLinea from "src/components/selects/QSelectParcelasLinea.vue";

const tablePagination = ref({ rowsPerPage: 0 });

const agregarPagoDialog = ref(null)

const tableData = ref([
  { tipo: "", descripcion: "", cantidad: 1, precio: 0, total: 0 },
]);

const totalsColumns = [
  {
    name: 'tipo',
    required: true,
    label: 'Tipo',
    align: 'left',
    field: 'tipo'
  },
  {
    name: 'total',
    required: true,
    label: 'Total',
    align: 'left',
    field: 'total'
  }
]

const totalsData = computed(() => {
  let totals = [];

  let SubTotal = tableData.value.reduce((acc, row) => acc + (row.total), 0);

  totals.push({
    tipo: 'Subtotal',
    total: SubTotal,
  });

  /** DESCUENTOS */
  let Descuentos = 0;

  if (reciboData.aplicar_descuentos) {

    if (reciboData.tipo_descuento === 'perc') {
      Descuentos = (SubTotal * reciboData.descuento_total / 100 || 0);
    } else {
      Descuentos = reciboData.descuento_total;
    }

    Descuentos = Descuentos * -1;

  } else {
    Descuentos = (tableData.value.reduce((acc, row) => acc + (row.total * (row.descuento || 0) / 100), 0) || 0) * -1
  }

  if (Descuentos) {
    totals.push({
      tipo: 'Descuentos',
      total: Descuentos,
    });
  }
  /** END DESCUENTOS */

  /** IMPUESTOS */
  let SubtotalConDescuentos = SubTotal + Descuentos;
  let Impuestos = 0;

  if (reciboData.aplicar_impuestos) {
    Impuestos = SubtotalConDescuentos * reciboData.impuesto_total / 100;
  } else {
    Impuestos = tableData.value.reduce((acc, row) => acc + (row.total * (row.impuesto || 0) / 100), 0);
  }

  if (Impuestos) {
    totals.push({
      tipo: 'Impuestos',
      total: Impuestos,
    });
  }
  /** END IMPUESTOS */

  let Total = SubtotalConDescuentos + Impuestos;

  totals.push({
    tipo: 'Total',
    total: Total,
    isTotal: true,
  });

  // Agregar los pagos

  if (pagos.value.length) {

    let TotalPagado = pagos.value.reduce((acc, row) => acc + (row.monto / row.tasa_ref), 0);

    totals.push({
      tipo: 'Total pagado',
      total: TotalPagado,
    })

    totals.push({
      tipo: 'Balance',
      total: Total - TotalPagado
    })
  }

  return totals;

});

const props = defineProps({
  data: {
    type: Object,
    default: {}
  }
})

const deleteRow = (row) => {
  const index = tableData.value.indexOf(row)
  tableData.value.splice(index, 1)

  emit('recalcular', {
    lineas: tableData.value,
    totals: totalsData.value,
    //recibo: reciboData,
    moneda: selectedMoneda.value,
    caja_id: cajaSeleccionada.value.id,
  })
}

/*watch(props, () => {
  if (props.data) {
    reciboData.value = props.data
  }
}, { deep: true })*/

const reciboData = reactive(props.data)

const hoveredRow = ref(null)

const tableColumns = [
  {
    name: "tipo",
    required: true,
    label: "Tipo",
    align: "left",
    field: "tipo",
    headerStyle: "width: auto",
    style: "width: auto",
  },
  {
    name: "descripcion",
    required: true,
    label: "Descripción",
    align: "left",
    field: "descripcion",
    headerStyle: "min-width: 240px;",
  },
  {
    name: "cantidad",
    required: true,
    label: "Cantidad",
    align: "left",
    field: "cantidad",
    headerStyle: "width: 80px",
    style: "width: 80px",
  },
  {
    name: "precio",
    required: true,
    label: "Precio",
    align: "left",
    field: "precio",
    format: (value) => `${value.toFixed(2)}`,
    headerStyle: "width: 100px",
    style: "width: 100px",
  },
  {
    name: "total",
    required: true,
    label: "Total",
    align: "left",
    field: "total",
    format: (value) => `${value.toFixed(2)}`,
    headerStyle: "width: 100px",
    style: "width: 100px",
  },
];

const pagos = ref([])

const servicios = ref([])
const filteredServicios = computed(() => {
  if (reciboData.vendedor_id) {
    let dataFiltered = servicios.value.filter(servicio => servicio.empresa_id === reciboData.vendedor_id)

    // Si reciboData.tipo_ubicacion tiene valor, devolver todos los servicios con servicio.tipo_ubicacion tanto NULL como con el valor de reciboData.tipo_ubicacion
    if (reciboData.tipo_parcela) {
      return dataFiltered.filter(servicio => !servicio.tipo_ubicacion || servicio.tipo_ubicacion === reciboData.tipo_parcela)
    } else {
      return dataFiltered
    }

  } else {
    return []
  }
})

watch( () => reciboData.fecha_emision, () => {
  tableData.value.forEach(row => {
    handleRecalcularLinea(row)
  });
})

watch( () => reciboData.fecha_vencimiento, () => {
  tableData.value.forEach(row => {
    handleRellenarDescripcion(row)
  });
})

watch( () => reciboData.ubicaciones, () => {
  tableData.value.forEach(row => {
    handleRellenarDescripcion(row)
  });
})

const handleAgregarPago = (data) => {
  pagos.value = data?.pagos || []
  emit('agregarpago', pagos.value)
}

const handleChangeTipoServicio = (row) => {
  if (row.tipo) {
    row.descripcion = row.tipo.descripcion
    row.descripcion_plantilla = row.tipo.descripcion
    row.precio = parseFloat(row.tipo.precio_ref)

    if (!!parseInt(row.tipo.requiere_ubicaciones)){
      console.log(reciboData.ubicaciones)
      row.ubicaciones = reciboData.ubicaciones;
    } else {
      row.ubicaciones = [];
    }

    if (row.tipo.tipo_producto == 'Mantenimiento') {
      row.cuotas = 1;
    }
  } else {
    row.descripcion = ''
    row.precio = 0
    row.cantidad = 1
    delete row.ubicaciones
  }

  handleRecalcularLinea(row)
}

const agregarServicio = () => {
  tableData.value.push({
    tipo: '',
    descripcion: '',
    cantidad: 1,
    precio: 0,
    total: 0,
  })
}

const handleRecalcularLinea = (row, val) => {

  if (!!parseInt(row.tipo?.requiere_ubicaciones)) {
    row.cantidad = row.ubicaciones?.length || 0
  }

  if (row.tipo?.pagable_cuotas == 1) {

    let cantidadCuotas = parseInt(val);
    let precioPorCuota = row.tipo.precio_ref;

    const ultimoPagadoHasta = new Date(reciboData.fecha_emision);
    row.cuotas = cantidadCuotas;
    row.nuevo_pagado_hasta = add(ultimoPagadoHasta, { years: parseInt(cantidadCuotas) }).toISOString().substr(0, 10);

    row.ubicaciones.forEach(ubicacion => {

      ubicacion.cuotas = cantidadCuotas;

      const ultimoPagadoHasta = new Date(reciboData.fecha_emision);
      ubicacion.nuevo_pagado_hasta = add(ultimoPagadoHasta, { years: parseInt(ubicacion.cuotas) }).toISOString().substr(0, 10);

    })

    row.total = precioPorCuota * row.cuotas * row.cantidad
  } else {
    row.total = row.precio * row.cantidad
  }

  handleRellenarDescripcion(row)

  emit('recalcular', {
    lineas: tableData.value,
    totals: totalsData.value,
    //recibo: reciboData,
    moneda: selectedMoneda.value,
    caja_id: cajaSeleccionada.value.id,
  })
}

const dateToDMY = (datestring) => {
  if (!datestring) return null

  const inputDate = new Date(datestring.replace(/-/g, '/'));

  // Format the date as a string in the desired format
  const day = inputDate.getDate().toString().padStart(2, '0');
  const month = (inputDate.getMonth() + 1).toString().padStart(2, '0');
  const year = inputDate.getFullYear().toString();
  const outputDateString = `${day}/${month}/${year}`;

  return outputDateString;
}

const handleRellenarDescripcion = (row) => {
  console.log('rellenando', reciboData, row)
  let plantilla = row.descripcion_plantilla

  if (!plantilla) return;

  let ubicacionesAgrupadasPorFecha = {}

  // Verificar si la plantilla tiene __DESDE__ o __HASTA__
  if (row.descripcion_plantilla.includes('__DESDE__') || row.descripcion_plantilla.includes('__HASTA__')) {
    reciboData.ubicaciones.forEach(ubicacion => {
      let fechaDesde = reciboData.fecha_emision.substr(0, 10)
      let fechaHasta = reciboData.fecha_vencimiento.substr(0, 10)

      let fechaDesdeHasta = fechaDesde + '_' + fechaHasta
      if (!ubicacionesAgrupadasPorFecha[fechaDesdeHasta]) {
        ubicacionesAgrupadasPorFecha[fechaDesdeHasta] = []
      }
      ubicacionesAgrupadasPorFecha[fechaDesdeHasta].push(ubicacion)
    })

    let descripciones = [];
    for (let fecha in ubicacionesAgrupadasPorFecha) {

      let descripcion = row.descripcion_plantilla;

      if (descripcion.includes('__DESDE__')) {
        descripcion = descripcion.replace('__DESDE__', dateToDMY(reciboData.fecha_emision))
      }

      if (descripcion.includes('__HASTA__')) {
        descripcion = descripcion.replace('__HASTA__', dateToDMY(reciboData.fecha_vencimiento))
      }

      if (descripcion.includes('__UBICACIONES__')) {
        descripcion = descripcion.replace('__UBICACIONES__', ubicacionesAgrupadasPorFecha[fecha].map(ubicacion => ubicacion.codigo_parcela).join(', '))
      }

      descripciones.push(descripcion)
    }

    row.descripcion = descripciones.join('\n')

  } else if (row.descripcion_plantilla.includes('__UBICACIONES__')) {

    row.descripcion = row.descripcion_plantilla.replace('__UBICACIONES__', reciboData.ubicaciones.map(ubicacion => ubicacion.codigo_parcela).join(', '))

  }


}

onMounted(() => {
  initializePage()
})

const cajas = ref([])
const cajaSeleccionada = computed(() => {
  return cajas.value.find(caja => caja.empresa_id === reciboData.vendedor_id)
})

const monedas = ref([])
const selectedMoneda = computed(() => {
  return monedas.value.find(moneda => moneda.id === reciboData.moneda_id)
})

function initializePage() {
  api.get('servicios')
    .then(response => {
      if (response.data) {
        servicios.value = response.data
      }
    })
    .catch(e => console.log(e))

  api.get('caja/cajas')
    .then(response => {
      if (response.data) {
        cajas.value = response.data
      }
    })
    .catch(error => qNotify(error, 'error'))

  api.get('caja/monedas')
    .then(response => {
      if (response.data) {
        monedas.value = response.data

        let monedaVes = response.data.find(moneda => moneda.simbolo.includes('Bs'))
        if (monedaVes) {
          reciboData.moneda_id = monedaVes.id
        }
      }
    })
    .catch(error => qNotify(error, 'error'))
}

const emit = defineEmits(['recalcular', 'agregarpago'])

</script>
