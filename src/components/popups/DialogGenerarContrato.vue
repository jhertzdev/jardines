<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xxl">
    <q-card class="q-pa-md scroll">
      <q-form ref="generarContratosForm" @submit="handleSubmitGenerarContratos" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">Generar contratos</div>
        </q-card-section>

        <q-card-section v-if="!defaultParams.tipo_actividad || !defaultParams.tipo_parcela">
          <q-banner class="bg-grey-3 q-pa-lg text-center">
            <q-option-group
              v-model="selectGenerarContratos"
              :options="tiposContratos
                .filter(tipo => tipo.tipo_parcela === tipoContratoSelected)
                .map(tipo => ({ label: `(${tipo.codigo_contrato}) ${tipo.nombre}`, value: tipo.codigo_contrato }))"
              color="primary"
              label="Tipo de contrato"
              type="checkbox"
              inline
              @update:model-value="handleSelectTipoContrato"
            />
            <div class="text-grey-7 q-mt-md" v-if="!selectGenerarContratos.length">Selecciona un tipo de contrato.</div>
          </q-banner>
        </q-card-section>

        <template v-if="selectGenerarContratos.length">
          <q-separator class="q-mt-lg" />
          <q-card-section class="q-py-none">

          <div class="q-py-md" v-for="(codigo, index) in Object.keys(contratosData)">

            <q-expansion-item
              class="shadow-1 overflow-hidden"
              :label="'(' + codigo + ') ' + tiposContratos.find(tipo => tipo.codigo_contrato === codigo)?.nombre"
              header-class="bg-primary text-white"
              expand-icon-class="text-white"
              v-model="contratosData[codigo].visible"
            >
              <q-card>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 text-right q-gutter-sm" v-if="!defaultParams">
                      <q-btn size="sm" label="Copiar del anterior" color="primary" icon="content_copy"
                        @click="handleCopiarContratoAnterior(codigo)" v-if="index > 0" />
                      <q-btn size="sm" label="Remover" color="negative" icon="clear"
                        @click="handleRemoverContrato(codigo)" />
                    </div>
                    <div class="col-12 col-md-4">
                      <template v-if="defaultParams.num_contrato">
                        <q-input class="input-num-parcela" dense stack-label v-model="contratosData[codigo].num_contrato"
                          outlined label="Número de contrato" hide-bottom-space readonly>
                          <template v-slot:prepend>
                            <span>{{ codigo }}</span>
                          </template>
                        </q-input>
                      </template>
                      <template v-else>
                        <q-input class="input-num-parcela" dense stack-label v-model="contratosData[codigo].num_contrato"
                          outlined label="Número de contrato" lazy-rules :rules="[val => val && val.length > 0]"
                          hide-bottom-space :readonly="contratosData[codigo].autogenerar_numero">
                          <template v-slot:prepend>
                            <span>{{ codigo }}</span>
                          </template>
                        </q-input>
                        <q-checkbox v-model="contratosData[codigo].autogenerar_numero" label="Autogenerar" />
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
                        v-model="contratosData[codigo].vendedor_id"
                        label="Selecciona una empresa (vendedor)"
                        rule="El campo es requerido."
                        :filters="{ contrato: codigo }"
                        />
                    </div>

                    <div class="col-12 col-md-4 text-right text-caption text-grey-6">
                      <template v-if="defaultParams.comprador_id">
                        <QSelectCliente dense v-model="contratosData[codigo].comprador_id" outlined clearable
                          label="Cliente relacionado" required readonly />
                      </template>
                      <template v-else>
                        <QSelectCliente dense v-model="contratosData[codigo].comprador_id" outlined clearable
                          label="Cliente relacionado" required :filters="{ difunto: 0 }"
                          @update:model-value="val => handleRellenarCamposDeCliente(val, codigo)" />
                      </template>

                      <div class="q-mt-lg">

                        <template v-if="parseInt(contratosData[codigo].comprador_id)">
                          <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                            agregarClienteDialog.openDialog(contratosData[codigo].comprador_id, e)"/>
                        </template>
                        <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                          color="primary" @click="agregarClienteDialog.openDialog()" />
                      </div>

                    </div>

                    <template v-if="authStore.user.role_perms.find((role) => role == 'contratos.*' || role == 'contratos.editar')">
                      <div class="col-md-4">
                        <q-select dense :options="['Donado', 'Entregado', 'Suspendido', 'Anulado', 'Traspasado', 'Removido', 'Unificado', 'Cambio por cremación']" outlined
                          v-model="contratosData[codigo].etiqueta" label="Etiqueta" clearable new-value-mode="add-unique" @update:model-value="val => {
                            if (val == 'Donado') {
                              contratosData[codigo].valor_cuota_inicial = 0
                              contratosData[codigo].valor_cuota_mensual = 0
                              contratosData[codigo].numero_cuotas = 1
                              contratosData[codigo].valor_total = 0
                              contratosData[codigo].valor_venta = 0
                              contratosData[codigo].fecha_vencimiento = null
                            }
                          }"/>
                      </div>
                      <div class="col-md-8">
                        <q-input dense type="textarea" class="no-resize" outlined v-model="contratosData[codigo].notas" rows="2" label="Notas" clearable autogrow />
                      </div>
                    </template>

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

                          <QSelectParcelas @selected="val => contratosData[codigo].ubicaciones = val" dense v-model="contratosData[codigo].parcelas" outlined
                            :label="`Selecciona las ubicaciones a asignar`" :required="!contratosData[codigo].sin_parcelas"
                            :rule="`Debes seleccionar al menos una ubicación`"/>

                          <div class="row q-col-gutter-sm">
                            <div class="col-12">
                              <div class="text-h6 text-center">Información del contrato</div>
                            </div>
                            <div class="col-12 col-md-6">
                              <q-input type="date" dense stack-label outlined
                                v-model="contratosData[codigo].fecha_emision" label="Fecha de emisión" @update:model-value="val => {
                                  if (contratosData[codigo].etiqueta == 'Donado') {
                                    contratosData[codigo].fecha_vencimiento = null
                                  } else if (contratosData[codigo].tipo_parcela == 'Cremacion' || contratosData[codigo].tipo_actividad == 'venta_parcelas') {
                                    contratosData[codigo].fecha_vencimiento = val
                                  } else {
                                    let currentDate = new Date(val + ' 00:00:00')
                                    let nextYearDate = add(currentDate, { years: 1 })
                                    contratosData[codigo].fecha_vencimiento = nextYearDate.toISOString().substr(0, 10)
                                  }
                                }" />
                            </div>
                            <div class="col-12 col-md-6">
                              <q-input type="date" dense stack-label outlined
                                v-model="contratosData[codigo].fecha_vencimiento" label="Fecha de vencimiento"
                                :readonly="contratosData[codigo].etiqueta == 'Donado'"
                                :disable="contratosData[codigo].etiqueta == 'Donado'" />
                            </div>
                            <div class="col-12 col-md-4">
                              <q-input dense type="number" outlined v-model="contratosData[codigo].parcelas.length"
                                label="Cant. parcelas" step="1" readonly />
                            </div>
                            <div class="col-12 col-md-8">
                              <q-input dense type="number" outlined v-model="contratosData[codigo].valor_venta" @update:model-value="val => contratosData[codigo].valor_total = val"
                                label="Valor de venta" step="0.01" :readonly="contratosData[codigo].etiqueta == 'Donado'" :disable="contratosData[codigo].etiqueta == 'Donado'" />
                            </div>
                            <div class="col-12 col-md-4">
                              <q-input dense type="number" outlined v-model="contratosData[codigo].numero_cuotas"
                                label="Núm. cuotas" step="1" :readonly="contratosData[codigo].etiqueta == 'Donado'" :disable="contratosData[codigo].etiqueta == 'Donado'" />
                            </div>
                            <div class="col-12 col-md-4">
                              <q-input dense type="number" outlined v-model="contratosData[codigo].valor_cuota_inicial"
                                label="Cuota inicial" step="0.01" :readonly="contratosData[codigo].etiqueta == 'Donado'" :disable="contratosData[codigo].etiqueta == 'Donado'" />
                            </div>
                            <div class="col-12 col-md-4">
                              <q-input dense type="number" outlined v-model="contratosData[codigo].valor_cuota_mensual"
                                label="Cuota mensual" step="0.01" :readonly="contratosData[codigo].etiqueta == 'Donado'" :disable="contratosData[codigo].etiqueta == 'Donado'" />
                            </div>
                            <div class="col-12 col-md-8">
                              <q-input dense outlined v-model="contratosData[codigo].direccion_pago" label="Dirección de pago" />
                            </div>
                            <div class="col-12 col-md-4">
                              <q-input dense type="number" outlined v-model="contratosData[codigo].valor_total"
                                label="Valor total" step="0.01" :readonly="contratosData[codigo].etiqueta == 'Donado'" :disable="contratosData[codigo].etiqueta == 'Donado'" />
                            </div>
                            <!--<div class="col-12 text-right">
                              <q-checkbox v-model="contratosData[codigo].autocalcular_total" label="Autocalcular total" />
                              <q-icon name="help_outline" class="q-ml-xs">
                                <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                                  Al marcar esta opción, se multiplicará el número de parcelas por el valor de la venta y el monto de las cuotas inicial y mensual.
                                </q-tooltip>
                              </q-icon>
                            </div>-->

                            <template v-if="authStore.user.role_perms.find((role) => role == 'contratos.*' || role == 'contratos.editar')">
                              <q-checkbox v-model="contratosData[codigo].sin_parcelas" true-value="1" false-value="0" label="El contrato no tiene ubicaciones asociadas" v-if="!contratosData[codigo].ubicaciones?.length" />
                            </template>

                          </div>
                        </div>

                        <div class="col-md-6">

                          <div class="text-center">
                            <span class="text-h6 text-center">Caja</span>
                            <q-checkbox v-model="contratosData[codigo].generar_recibo" label="Generar recibo" class="q-ml-sm"/>
                          </div>

                          <div>
                            <QTableReciboContratos :data="contratosData[codigo]" @recalcular="val => recalcularContrato(contratosData[codigo], val)" @agregarpago="val => contratosData[codigo].pagos = val" />
                          </div>



                        </div>
                      </div>

                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>




          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn color="primary" label="Generar contratos" icon="description" :loading="isLoadingSubmit" @click="generarContratosForm.submit()"/>
          </q-card-actions>
        </template>

      </q-form>

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
import { useAuthStore } from 'stores/auth.store'

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
const authStore = useAuthStore()

const agregarClienteDialog = ref(null)
const generarContratosForm = ref(null)

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
const contratosData = ref({})

const tipoContratoSelected = ref(null)

const filteredTiposContratos = computed(() => {
  return tiposContratos.value.filter(tipo => {
    tipo.tipo_parcela === tipoContratoSelected.value
  })
})

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

/*watch(() => Object.keys(contratosData.value), (codigos) => {
  if (!codigos.includes(step.value)) {
    step.value = codigos[0] || null;
  }

  // Auto-calcular precios
  codigos.forEach(codigo => {
    let cantidadParcelas = contratosData.value[codigo].parcelas?.length || 0
    let valorVenta = parseFloat(contratosData.value[codigo].valor_venta || 0)
    let numeroCuotas = parseInt(contratosData.value[codigo].numero_cuotas || 1)
    let cuotaInicial = parseFloat(contratosData.value[codigo].valor_cuota_inicial || 0)
    let cuotaMensual = parseFloat(contratosData.value[codigo].valor_cuota_mensual || 0)

    if (contratosData.value[codigo].autocalcular_total) {
      contratosData.value[codigo].valor_total = cantidadParcelas * (valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual)
    } else {
      contratosData.value[codigo].valor_total = valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual
    }
  });

  // Autogenerar código de contrato
  codigos.forEach(codigo => {
    if (contratosData.value[codigo].autogenerar_numero) {
      contratosData.value[codigo].num_contrato = contratosParams.value?.siguiente_num_contrato
    }
  });

}, { deep: true })*/

watch(contratosData, (value) => {
  if (!Object.keys(value).includes(step.value)) {
    step.value = Object.keys(value)[0] || null;
  }

  // Auto-calcular precios
  Object.keys(value).forEach(codigo => {
    let cantidadParcelas = value[codigo].parcelas?.length || 0
    let valorVenta = parseFloat(value[codigo].valor_venta || 0)
    let numeroCuotas = parseInt(value[codigo].numero_cuotas || 1)
    let cuotaInicial = parseFloat(value[codigo].valor_cuota_inicial || 0)
    let cuotaMensual = parseFloat(value[codigo].valor_cuota_mensual || 0)

    /*if (value[codigo].autocalcular_total) {
      contratosData.value[codigo].valor_total = cantidadParcelas * (valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual)
    } else {
      contratosData.value[codigo].valor_total = valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual
    }*/
  });

  // Autogenerar código de contrato
  Object.keys(value).forEach(codigo => {
    if (defaultParams.value.num_contrato) {
      contratosData.value[codigo].num_contrato = defaultParams.value.num_contrato
      contratosData.value[codigo].autogenerar_numero = false
    } else if (contratosData.value[codigo].autogenerar_numero) {
      contratosData.value[codigo].num_contrato = contratosParams.value?.siguiente_num_contrato
    }

    if (defaultParams.value.comprador_id) {
      contratosData.value[codigo].comprador_id = defaultParams.value.comprador_id
    }

    if (defaultParams.value.parcelas && defaultParams.value.ubicaciones) {
      contratosData.value[codigo].parcelas = defaultParams.value.parcelas
      contratosData.value[codigo].ubicaciones = defaultParams.value.ubicaciones
    }

    if (defaultParams.value.etiqueta) {
      contratosData.value[codigo].etiqueta = defaultParams.value.etiqueta
    }

    if (authStore.user.role_perms.find((role) => role == 'contratos.*' || role == 'contratos.editar')) {
      if (defaultParams.value.etiqueta) {
        contratosData.value[codigo].etiqueta = defaultParams.value.etiqueta
      }
      if (defaultParams.value.notas) {
        contratosData.value[codigo].notas = defaultParams.value.notas
      }
    }
  });

}, { deep: true })

const handleSelectTipoContrato = (opciones) => {
  let opcionesActuales = Object.keys(contratosData.value);
  let opcionesAAgregar = opciones.filter(opcion => !opcionesActuales.includes(opcion));
  let opcionesAEliminar = opcionesActuales.filter(opcion => !opciones.includes(opcion));

  let currentDate = new Date();
  let nextYearDate = add(currentDate, { years: 1 });

  opcionesAAgregar.forEach(opcion => {

    let tipoContrato = tiposContratos.value.find(tipo => tipo.codigo_contrato === opcion)

    console.log(tipoContrato);

    contratosData.value[opcion] = {
      codigo_contrato: opcion,
      tipo_actividad: tipoContrato?.tipo_actividad,
      autogenerar_numero: true,
      generar_recibo: false,
      parcelas: [],
      cliente: {},
      tipo_parcela: 'Producto',
      fecha_emision: currentDate.toISOString().substr(0, 10),
      fecha_vencimiento: tipoContrato?.tipo_actividad == 'mantenimiento_parcelas' ? nextYearDate.toISOString().substr(0, 10) : currentDate.toISOString().substr(0, 10),
      visible: true,
      sin_parcelas: "0"
    }

    if (defaultParams.value.etiqueta == 'Donado') {
      contratosData.value[opcion].fecha_vencimiento = null
      contratosData.value[opcion].valor_venta = 0
      contratosData.value[opcion].numero_cuotas = 1
      contratosData.value[opcion].valor_cuota_inicial = 0
      contratosData.value[opcion].valor_cuota_mensual = 0
      contratosData.value[opcion].valor_total = 0
    } else if (defaultParams.value.fecha_emision) {
      let fechaEmision = new Date(defaultParams.value.fecha_emision)
      let fechaEmisionDMY = fechaEmision.toISOString().substr(0, 10)
      contratosData.value[opcion].fecha_emision = fechaEmisionDMY
    }

    if (defaultParams.value.fecha_vencimiento) {
      let fechaVencimiento = new Date(defaultParams.value.fecha_vencimiento)
      let fechaVencimientoDMY = fechaVencimiento.toISOString().substr(0, 10)
      contratosData.value[opcion].fecha_vencimiento = fechaVencimientoDMY
    }

    api.get('contratos/tipos/' + opcion)
      .then(response => {
        if (response.data) {
          contratosData.value[opcion].tipo_parcela = response.data.tipo_parcela
          //contratosData.value[opcion].valor_venta = response.data.valor_venta
          contratosData.value[opcion].numero_cuotas = response.data.numero_cuotas
          contratosData.value[opcion].valor_cuota_inicial = response.data.valor_cuota_inicial
          contratosData.value[opcion].valor_cuota_mensual = response.data.valor_cuota_mensual
        }
      })
  });

  opcionesAEliminar.forEach(opcion => {
    delete contratosData.value[opcion];
  });
}

const handleCopiarContratoAnterior = (codigo) => {
  let keys = Object.keys(contratosData.value)
  let index = keys.indexOf(codigo);
  if (index > 0) {
    let anterior = keys[index - 1];

    // Valores a mantener
    /*let mantenerValoresContrato = {
      vendedor_id: null,
      codigo_contrato: codigo,
      valor_venta: contratosData.value[codigo].valor_venta || null,
      numero_cuotas: contratosData.value[codigo].numero_cuotas || null,
      valor_cuota_inicial: contratosData.value[codigo].valor_cuota_inicial || null,
      valor_cuota_mensual: contratosData.value[codigo].valor_cuota_mensual || null,
    }*/

    console.log(contratosData.value[codigo]);

    for (let key in contratosData.value[anterior]) {
      if (key == 'vendedor_id') contratosData.value[codigo][key] = null
      else if (key == 'tipo_actividad') {} // do nothing
      else if (key == 'codigo_contrato') contratosData.value[codigo][key] = codigo
      else if (key == 'fecha_vencimiento' && contratosData.value[codigo]['tipo_actividad'] == 'venta_parcelas') contratosData.value[codigo][key] = contratosData.value[codigo]['fecha_emision']
      else contratosData.value[codigo][key] = contratosData.value[anterior][key]
    }

    //let newData = JSON.parse(JSON.stringify(contratosData.value[anterior]))

    //contratosData.value[codigo] = newData;
  }
}

const handleRemoverContrato = (codigo) => {
  delete contratosData.value[codigo];
  selectGenerarContratos.value = selectGenerarContratos.value.filter(opcion => opcion !== codigo)
}

const handleRellenarCamposDeCliente = (value, codigo) => {
  api.get('clientes/' + value)
    .then(response => {
      if (response.data) {
        ['nombre', 'doc_numero', 'doc_identidad', 'apellido', 'fecha_nacimiento', 'direccion_habitacion', 'direccion_trabajo',
          'estado_civil', 'genero', 'email', 'telefono_principal', 'telefono_secundario'].forEach(key => {
            contratosData.value[codigo]['cliente'][key] = response.data[key]
          });
      }
    })
}

const handleSubmitGenerarContratos = () => {
  isLoadingSubmit.value = true

  let postData = JSON.parse(JSON.stringify(Object.values(contratosData.value)))

  console.log('generarcontratos', postData)

  postData.forEach( (contrato, key) => {
    if (contrato.generar_recibo && contrato.recibo) {

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
        //contratosData.value = {}
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitGenerarContratos))
    .finally(() => isLoadingSubmit.value = false)

}

const propietarioId = ref(null)
const empresaId = ref(null)
const isLoadingSubmit = ref(false)

const defaultParams = ref(null)

const openDialog = (tipo = null, params = null) => {

  contratosData.value = {}

  defaultParams.value = params;

  if (params.tipo_actividad && params.tipo_parcela) {
    let defaultTipoContrato = tiposContratos.value.find(tipo => {
      return tipo.tipo_actividad === params.tipo_actividad && tipo.tipo_parcela === params.tipo_parcela
    });

    selectGenerarContratos.value = [defaultTipoContrato.codigo_contrato];
    handleSelectTipoContrato([defaultTipoContrato.codigo_contrato]);
  } else {
    tipoContratoSelected.value = tipo
    selectGenerarContratos.value = []
  }

  api.get('parcelas/params')
    .then(response => {
      if (response.data) {
        contratosParams.value = response.data
      }
    })

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
