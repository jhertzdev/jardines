<template>
  <q-table
    dense
    flat
    class="contratos-recibo-table"
    hide-bottom="false"
    table-header-class="bg-green-1"
    :rows="tableData"
    row-key="id"
    hide-no-data
    hide-pagination
    v-model:pagination="tablePagination"
  >
    <template v-slot:body-cell-tipo="props">
      <q-td
        :props="props"
        style="padding-left: 0; padding-right: 0;"
        :class="{ highlighted: hoveredRow === props.row }"
      >
        <q-select
          v-model="props.row[props.col.name]"
          dense
          borderless
          :options="filteredServicios"
          option-value="id"
          option-label="nombre_producto"
          map-options
          :hide-dropdown-icon="!!props.row[props.col.name]"
          @update:model-value="handleChangeTipoServicio(props.row, props.rowIndex)"
        >
          <template v-slot:selected>
            <q-chip
              removable
              v-if="props.row[props.col.name]"
              @remove="
                props.row[props.col.name] = null;
                handleChangeTipoServicio(props.row);
              "
            >
              {{ props.row[props.col.name]?.nombre_producto }}
            </q-chip>
            <span class="text-grey-5" style="font-size: 10px" v-else> -- Línea personalizada -- </span>
          </template>
        </q-select>
        <div class="text-center">
          <q-btn
            icon="delete"
            size="sm"
            dense
            color="red"
            label="Eliminar"
            flat
            class="q-ml-xs"
            @click="deleteRow(props.row)"
            style="margin-top: -10px"
            @mouseover="hoveredRow = props.row"
            @mouseleave="hoveredRow = null"
          />
        </div>
      </q-td>
    </template>

    <template v-slot:body-cell-descripcion="props">
      <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
        {{ ubicaciones }}
        <q-input type="textarea" rows="1" autogrow dense v-model="props.row[props.col.name]" style="margin-bottom: 20px;"/>
        <div style="min-height: 20px; margin-top: -15px; margin-bottom: 20px" v-if="props.row['tipo']?.requiere_ubicaciones == 1">


          <q-option-group
            class="q-mt-xs"
            v-model="ubicaciones[props.rowIndex]"
            :options="reciboData.parcelas.map(parcela => ({ label: parcela, value: parcela }))"
            type="checkbox"
            dense
          />
        </div>
        <div class="q-mt-xs" style="min-height: 20px;" v-if="props.row.tipo?.requiere_ubicaciones == true">
          <div class="flex q-gutter-sm" v-for="ubicacion in props.row.ubicaciones" :key="ubicacion.id">
            <div style="flex: 1 0 4em">
              <q-input label="Ubicación" dense v-model="ubicacion.codigo_parcela" readonly />
            </div>
            <div style="flex: 1 0 5em">
              <q-input label="Últ. pago" stack-label placeholder="--" dense v-model="ubicacion.pagado_hasta" readonly />
            </div>
            <div style="flex: 1 0 5em" v-if="props.row.tipo?.tipo_producto == 'Mantenimiento'">
              <q-input label="Nuevo pago" type="date" stack-label placeholder="--" dense v-model="ubicacion.nuevo_pagado_hasta" />
            </div>
            <div style="flex: 1 0 3em" v-if="props.row.tipo?.tipo_producto == 'Mantenimiento'">
              <q-input :label="props.row['pago_por_cuotas'] ? 'Meses' : 'Años'" type="number" step="1" min="0" stack-label dense v-model="ubicacion.cuotas" @update:model-value="val => handleRecalcularLinea(props.row, val)" required />
            </div>
          </div>

          <div class="q-mt-xs q-gutter-x-sm" v-if="props.row.tipo?.tipo_producto == 'Mantenimiento'">

              <q-checkbox size="sm" dense v-model="props.row['separar_pagos']" @update:model-value="handleRecalcularLinea(props.row)" />
              <span style="font-size:.6rem; color:#444; margin-left: 2px">Separar pagos</span>

              <q-checkbox size="sm" dense v-model="props.row['pago_por_cuotas']" @update:model-value="handleRecalcularLinea(props.row)" />
              <span style="font-size:.6rem; color:#444; margin-left: 2px">Pago por cuotas</span>

          </div>


          <!--div class="row">
            <div class="col-12 col-md" style="flex-basis:80px">
              <q-input class="q-field--date" type="date" dense stack-label label="Fecha emisión" v-model="contratoSelectedFechaEmision" readonly />
              </div>
              <div class="col-12 col-md" style="flex-basis:80px">
              <q-input class="q-field--date" type="date" dense stack-label label="Último pago" v-model="contratoSelectedFechaUltimoPago" readonly />
              </div>
            <div class="col-12 col-md-auto">
              <q-input class="q-field--date" type="date" outlined filled dense stack-label label="Pagado hasta" v-model="props.row.pagado_hasta" />
            </div>
          </div>-->
        </div>
      </q-td>
    </template>


  </q-table>
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
    /*font-size: 10px;*/
  }



</style>

<script setup>
import { ref, reactive, onMounted, computed, watch, toRaw } from "vue";
import { api } from "src/boot/axios";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAppStore } from "src/stores/app.store";
import { $dinero, qNotify } from "src/boot/jardines";

import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogAgregarDifunto from "src/components/popups/DialogAgregarCliente.vue";
import DialogAgregarOcupante from "src/components/popups/DialogAgregarOcupante.vue";

import QSelectCliente from "src/components/selects/QSelectCliente.vue";
import QSelectContratos from "src/components/selects/QSelectContratos.vue";
import QSelectMoneda from "src/components/selects/QSelectMoneda.vue";
import QSelectDatetime from "src/components/selects/QSelectDatetime.vue";

const tablePagination = ref({ rowsPerPage: 0 });

const tableData = ref([
  { tipo: "", descripcion: "", cantidad: 1, precio: 0, total: 0, ubicaciones: [] },
]);

const ubicaciones = ref({});

const itemProps = defineProps({
  data: {
    type: Object,
    default: {}
  }
})

/*watch(props, () => {
  if (props.data) {
    reciboData.value = props.data
  }
}, { deep: true })*/

const reciboData = ref(itemProps.data)

const hoveredRow = ref(null)

const tableColumns = [
  {
    name: "tipo",
    required: true,
    label: "Tipo",
    align: "left",
    field: "tipo",
    headerStyle: "width: 230px",
    style: "width: 230px",
  },
  {
    name: "descripcion",
    required: true,
    label: "Descripción",
    align: "left",
    field: "descripcion",
    headerStyle: "width: 400px",
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
  }
];

const servicios = ref([])
const filteredServicios = computed(() => {
  if (reciboData.value.vendedor_id) {
    let dataFiltered = servicios.value.filter(servicio => servicio.empresa_id === reciboData.value.vendedor_id)

    // Si reciboData.tipo_ubicacion tiene valor, devolver todos los servicios con servicio.tipo_ubicacion tanto NULL como con el valor de reciboData.tipo_ubicacion
    if (reciboData.value.tipo_parcela) {
      return dataFiltered.filter(servicio => !servicio.tipo_ubicacion || servicio.tipo_ubicacion === reciboData.value.tipo_parcela)
    } else {
      return dataFiltered
    }

  } else {
    return []
  }
})

const handleChangeTipoServicio = (row, index = null) => {
  if (row.tipo) {
    row.descripcion = row.tipo.descripcion
    row.precio = parseFloat(row.tipo.precio_ref)
    row.pago_por_cuotas = false
    row.separar_pagos = false

    if (!!parseInt(row.tipo.requiere_ubicaciones)){
      if (index !== null) {
        ubicaciones.value[index] = reciboData.value.parcelas;
      }
    } else {
      if (index !== null) {
        ubicaciones.value[index] = [];
      }
    }

  } else {
    row.descripcion = ''
    row.precio = 0
    row.cantidad = 1
    delete row.pago_por_cuotas
    delete row.separar_pagos
    delete row.ubicaciones
    delete row.pagado_hasta
  }

  handleRecalcularLinea(row)
}

const handleRecalcularLinea = (row, val) => {
  return;
    console.log('handleRecalcularLinea', {
      cantidad: row.cantidad,
      pago_por_cuotas:row.pago_por_cuotas,
      precio: row.precio,
      separar_pagos: row.separar_pagos,
      ubicaciones: row.ubicaciones,
    });

    if (!!parseInt(row.tipo?.requiere_ubicaciones)) {
      row.cantidad = row.ubicaciones.length
    }

    if (row.tipo?.pagable_cuotas == 1) {

      let cantidadCuotas = parseInt(val);
      let precioPorCuota = row.pago_por_cuotas ? row.tipo.precio_ref / row.tipo.cantidad_cuotas : row.tipo.precio_ref;

      row.ubicaciones.forEach(ubicacion => {

        if (!row.separar_pagos) {
          ubicacion.cuotas = cantidadCuotas;
        }

        /*TODO: const ultimoPagadoHasta = new Date(ubicacion.pagado_hasta || contratoSelected.value.fecha_emision);

        if (row.pago_por_cuotas) {
          ubicacion.nuevo_pagado_hasta = agregarPorFechaCorte(ultimoPagadoHasta, new Date(contratoSelected.value.fecha_emision), parseInt(ubicacion.cuotas))
        } else {
          ubicacion.nuevo_pagado_hasta = add(ultimoPagadoHasta, { years: parseInt(ubicacion.cuotas) }).toISOString().substr(0, 10);
        }*/

      })

      let totalCuotas = row.ubicaciones.reduce((acc, ubicacion) => acc + parseInt(ubicacion.cuotas || 0), 0);
      row.total = precioPorCuota * totalCuotas

    } else {
      row.total = row.precio * row.cantidad
    }
  }

onMounted(() => {
  initializePage()
})

function initializePage() {
  api.get('servicios')
    .then(response => {
      if (response.data) {
        servicios.value = response.data
      }
    })
    .catch(e => console.log(e))
}

</script>
