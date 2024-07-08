<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xxl">
    <q-card class="q-pa-md scroll">

      <template v-if="isLoading">
        <div class="text-center">
          <q-spinner size="xl" color="primary" />
        </div>
      </template>
      <template v-else>
        <q-form ref="generarContratosForm" @submit="handleSubmitGenerarContratos" @validation-error="onValidationError">
          <q-card-section>
            <div class="row">
              <div class="col-sm-6 col-lg-7 col-xl-8">
                <div class="text-h6">Generar contrato</div>
              </div>
            </div>
          </q-card-section>




            <q-card-section>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <template v-if="index > 0">
                    <q-input class="input-num-parcela" dense stack-label v-model="contratoData.num_contrato"
                      outlined label="Número de contrato" lazy-rules :rules="[val => val && val.length > 0]"
                      hide-bottom-space :readonly="contratoData.autogenerar_numero">
                      <template v-slot:prepend>
                        <span>{{ codigo }}</span>
                      </template>
                    </q-input>
                  </template>
                  <template v-else>
                    <q-input class="input-num-parcela" dense stack-label v-model="contratoData.num_contrato"
                      outlined label="Número de contrato" lazy-rules :rules="[val => val && val.length > 0]"
                      hide-bottom-space :readonly="contratoData.autogenerar_numero">
                      <template v-slot:prepend>
                        <span>{{ codigo }}</span>
                      </template>
                    </q-input>
                    <q-checkbox v-model="contratoData.autogenerar_numero" label="Autogenerar" />
                    <q-icon name="help_outline" class="q-ml-xs">
                      <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                        Al marcar esta opción, los números de contrato se generan automáticamente siguiendo la secuencia
                        del número anterior.
                      </q-tooltip>
                    </q-icon>
                  </template>
                </div>

                <div class="col-12 col-md-4">
                  <QSelectEmpresa dense outlined required clearable
                    v-model="contratoData.vendedor_id"
                    label="Selecciona una empresa (vendedor)"
                    rule="El campo es requerido."
                    :filters="{ contrato: contratoData.codigo_contrato }"
                    />
                </div>

                <div class="col-12 col-md-4">
                  <QSelectCliente dense v-model="contratoData.comprador_id" outlined clearable
                      label="Cliente relacionado" required :filters="{ difunto: 0 }" readonly />
                </div>


                <div class="col-12">

                  <div class="row q-col-gutter-md">
                    <div class="col-md-6">
                      <div class="text-h6 text-center">Ubicaciones
                        <q-icon name="help_outline" class="q-ml-xs">
                          <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                            Al asignar las ubicaciones, su estatus cambiará a "Vendido", y se asignará al comprador como propietario.
                          </q-tooltip>
                        </q-icon>
                      </div>

                      <QSelectParcelas @selected="val => contratoData.ubicaciones = val" dense v-model="contratoData.parcelas" outlined
                        :label="`Selecciona las ubicaciones a asignar`" required
                        :rule="`Debes seleccionar al menos una ubicación`"/>

                      <div class="row q-col-gutter-sm">
                        <div class="col-12">
                          <div class="text-h6 text-center">Información del contrato</div>
                        </div>
                        <div class="col-12 col-md-4">
                          <q-input dense type="number" outlined :model-value="contratoData.parcelas?.length"
                            label="Cant. parcelas" step="1" readonly />
                        </div>
                        <div class="col-12 col-md-8">
                          <q-input dense type="number" outlined v-model="contratoData.valor_venta"
                            label="Valor de venta" step="0.01" />
                        </div>
                        <div class="col-12 col-md-4">
                          <q-input dense type="number" outlined v-model="contratoData.numero_cuotas"
                            label="Núm. cuotas" step="1" />
                        </div>
                        <div class="col-12 col-md-4">
                          <q-input dense type="number" outlined v-model="contratoData.valor_cuota_inicial"
                            label="Cuota inicial" step="0.01" />
                        </div>
                        <div class="col-12 col-md-4">
                          <q-input dense type="number" outlined v-model="contratoData.valor_cuota_mensual"
                            label="Cuota mensual" step="0.01" />
                        </div>
                        <div class="col-12 col-md-6">
                          <q-input type="date" dense stack-label outlined
                            v-model="contratoData.fecha_emision" label="Fecha de emisión" @update:model-value="val => {
                              if (contratoData.tipo_actividad == 'venta_parcelas') {
                                contratoData.fecha_vencimiento = val
                              } else {
                                let currentDate = new Date(val + ' 00:00:00')
                                let nextYearDate = add(currentDate, { years: 1 })
                                contratoData.fecha_vencimiento = nextYearDate.toISOString().substr(0, 10)
                              }
                            }" />
                        </div>
                        <div class="col-12 col-md-6">
                          <q-input type="date" dense stack-label outlined
                            v-model="contratoData.fecha_vencimiento" label="Fecha de vencimiento" :readonly="contratoData.tipo_actividad == 'venta_parcelas'" />
                        </div>
                        <div class="col-12 col-md-8">
                          <q-input dense outlined v-model="contratoData.direccion_pago" label="Dirección de pago" />
                        </div>
                        <div class="col-12 col-md-4">
                          <q-input dense type="number" outlined v-model="contratoData.valor_total"
                            label="Valor total" step="0.01" />
                        </div>
                        <!--<div class="col-12 text-right">
                          <q-checkbox v-model="contratoData.autocalcular_total" label="Autocalcular total" />
                          <q-icon name="help_outline" class="q-ml-xs">
                            <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                              Al marcar esta opción, se multiplicará el número de parcelas por el valor de la venta y el monto de las cuotas inicial y mensual.
                            </q-tooltip>
                          </q-icon>
                        </div>-->

                      </div>
                    </div>

                    <div class="col-md-6">

                      <div class="text-center">
                        <span class="text-h6 text-center">Caja</span>
                        <q-checkbox v-model="contratoData.generar_recibo" label="Generar recibo" class="q-ml-sm"/>
                      </div>

                      <div>
                        <QTableReciboContratos :data="contratoData" @recalcular="val => recalcularContrato(contratoData, val)" />
                      </div>



                    </div>
                  </div>

                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancelar" v-close-popup />
              <q-btn color="primary" label="Generar contratos" icon="description" :loading="isLoadingSubmit" @click="generarContratosForm.submit()"/>
            </q-card-actions>


        </q-form>
      </template>

    </q-card>
  </q-dialog>

  <DialogAgregarCliente ref="agregarClienteDialog" />
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, watch, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, scroll } from 'quasar';
import { qNotify } from 'src/boot/jardines';
import { add } from "date-fns";

// Components
import QSelectTiposContratos from 'src/components/selects/QSelectTiposContratos.vue'
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
import QSelectEmpresa from 'src/components/selects/QSelectEmpresa.vue'
import QSelectParcelas from 'src/components/selects/QSelectParcelas.vue'
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';
import QTableReciboContratos from 'src/components/tables/QTableReciboContratos.vue';

const $q = useQuasar()
const dialog = ref(false)
const step = ref(0)
const route = useRoute()

const agregarClienteDialog = ref(null)
const generarContratosForm = ref(null)
const clienteData = ref(null)

const props = defineProps({
  propietarioId: {
    type: String,
    default: null
  },
  parcelas: {
    type: Object,
    default: {}
  },
  params: {
    type: Object,
    default: []
  }
})

const selectGenerarContratos = ref([])
const contratoData = ref({})

const tipoContratoSelected = ref(null)

const filteredTiposContratos = computed(() => {
  return tiposContratos.value.filter(tipo => {
    return tipo.tipo_parcela === tipoContratoSelected.value
  })
})

const handleSelectCliente = (clienteId) => {

  api.get('clientes/' + clienteId + '?with[]=data')
    .then(response => {
      if (response.data) {
        // Verificar si el cliente tiene contratos de venta del tipo seleccionado
        clienteData.value = response.data;
      }
    })

}

const recalcularContrato = (contrato, data) => {

  contrato['recibo'] = data;

  let tipoContrato = tiposContratos.value.find(tipo => tipo.codigo_contrato === contrato.codigo_contrato)
  let total = 0;

  data.lineas.forEach(linea => {
    if (tipoContrato.tipo_actividad == 'mantenimiento_parcelas' && linea.tipo?.tipo_producto == 'Mantenimiento') {
      total += linea.total
    }
    if (tipoContrato.tipo_actividad == 'venta_parcelas' && linea.tipo?.tipo_producto == 'Propiedad / Venta') {
      total += linea.total
    }
  })

  let tasa = data.moneda?.tasa || 1

  contrato.valor_venta = (parseFloat(total || 0) * tasa).toFixed(2)
  contrato.valor_total = (parseFloat(total || 0) * tasa).toFixed(2)

  if (tipoContrato.tipo_actividad == 'mantenimiento_parcelas') {
    let years = 0;
    data.lineas.forEach(linea => {
      if (linea.tipo?.tipo_producto == 'Mantenimiento') {
        years = linea.cuotas
      }
    })

    let fechaEmision = new Date(contrato.fecha_emision);
    let fechaVencimiento = add(fechaEmision, { years });

    contrato.fecha_vencimiento = fechaVencimiento.toISOString().substr(0, 10);
    console.log(contrato, fechaEmision, fechaVencimiento, years, fechaVencimiento.toISOString().substr(0, 10));
  }
}

const { getScrollTarget, setVerticalScrollPosition } = scroll
const onValidationError = (ref) => {
  const el = ref.$el
  setVerticalScrollPosition(getScrollTarget(el), el.offsetTop, 200)
}

watch(contratoData, (value) => {

  let cantidadParcelas = value.parcelas?.length || 0
  let valorVenta = parseFloat(value.valor_venta || 0)
  let numeroCuotas = parseInt(value.numero_cuotas || 1)
  let cuotaInicial = parseFloat(value.valor_cuota_inicial || 0)
  let cuotaMensual = parseFloat(value.valor_cuota_mensual || 0)

  if (contratoData.value.autogenerar_numero) {
    contratoData.value.num_contrato = contratosParams.value?.siguiente_num_contrato
  }

}, { deep: true })

const handleSubmitGenerarContratos = () => {
  isLoadingSubmit.value = true

  let postData = JSON.parse(JSON.stringify([contratoData.value]))
  let numContrato = postData[0] && postData[0].numContrato

  postData.forEach( (contrato, key) => {

    if (contrato.generar_recibo && contrato.recibo) {

      contrato.num_contrato = numContrato;

      contrato.recibo = {
        empresa_id: contrato.vendedor_id,
        tipo_factura: contrato.tipo_factura,
        cliente_id: contrato.comprador_id,
        autogenerar_numero: true,
        tipo_ubicacion: contrato.tipo_parcela,
        fecha_emision: contrato.fecha_emision,
        fecha_vencimiento: contrato.fecha_vencimiento,
        moneda_id: contrato.recibo?.moneda?.id,
        subtotal: contrato.recibo?.totals?.find(t => t.tipo == 'Subtotal')?.total || 0,
        descuentos: contrato.recibo?.totals?.find(t => t.tipo == 'Descuentos')?.total || 0,
        impuestos: contrato.recibo?.totals?.find(t => t.tipo == 'Impuestos')?.total || 0,
        total: contrato.recibo?.totals?.find(t => t.tipo == 'Total')?.total || 0,
        tasa: contrato.recibo?.moneda?.tasa,
        caja_id: contrato.recibo?.caja_id,
        lineas: contrato.recibo?.lineas?.map(row => {
          return {
            producto_id: row?.tipo?.id,
            descripcion: row.descripcion,
            ubicaciones: row.ubicaciones || [],
            cantidad: row.cantidad,
            precio_unitario: row.precio,
            total_ref: row.total,
          }
        })
      }

    } else {
      delete contrato.recibo;
    }

  })

  api.post('contratos/lotes', postData)
    .then(response => {
      if (response.data) {
        dialog.value = false
        $q.notify({ message: 'Contratos generados exitosamente.', color: 'positive' })
        emit('created', response.data)
        //selectGenerarContratos.value = []
        //contratoData.value = {}
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitGenerarContratos))
    .finally(() => isLoadingSubmit.value = false)

}

const propietarioId = ref(null)
const empresaId = ref(null)

const isLoading = ref(true)
const isLoadingSubmit = ref(false)

const openDialog = (contratoId) => {
  isLoading.value = true

  api.get('parcelas/params')
    .then(response => {
      if (response.data) {
        contratosParams.value = response.data
      }
    })

  api.get('contratos/' + contratoId)
    .then(response => {
      if (response.data) {
        console.log(response.data);
        contratoData.value = response.data;
        contratoData.value.parcelas = response.data.parcelas.map(ubicacion => ubicacion.id)
      }
    })
    .finally(() => isLoading.value = false)



  tipoContratoSelected.value = '' // tipo
  selectGenerarContratos.value = []
  contratoData.value = {}
  dialog.value = true
}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

const contratosParams = ref(null)
const siguienteNumContrato = ref('');

const tiposContratos = ref([])

onMounted(() => {
  api.get('parcelas/params')
    .then(response => {
      if (response.data) {
        contratosParams.value = response.data
      }
    })

  api.get('contratos/tipos')
    .then(response => {
      tiposContratos.value = response?.data || []
    })

})

</script>
