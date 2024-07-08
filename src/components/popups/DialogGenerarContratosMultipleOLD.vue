<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md scroll">
      <q-form ref="generarContratosForm" @submit="handleSubmitGenerarContratos" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">Generar contratos</div>
        </q-card-section>
        <q-card-section class="q-pb-none q-mb-lg text-right">
          <QSelectTiposContratos dense v-model="selectGenerarContratos" outlined required
            @update:model-value="handleSelectTipoContrato" rule="Selecciona al menos un tipo de contrato."
            hint="Selecciona los tipos de contrato a generar." />
        </q-card-section>
        <template v-if="selectGenerarContratos.length">
          <q-separator class="q-mt-lg" />
          <q-card-section class="q-py-none">
            <q-stepper flat v-model="step" header-nav vertical color="primary" animated>
              <q-step :name="codigo" :title="codigo" icon="description"
                v-for="(codigo, index) in Object.keys(contratosData)">
                <div class="row q-col-gutter-md">
                  <div class="col-12 text-right q-gutter-sm">
                    <q-btn size="sm" label="Copiar del anterior" color="primary" icon="content_copy"
                      @click="handleCopiarContratoAnterior(codigo)" v-if="index > 0" />
                    <q-btn size="sm" label="Remover" color="negative" icon="clear"
                      @click="handleRemoverContrato(codigo)" />
                  </div>
                  <div class="col-12 col-md">
                    <q-input class="input-num-parcela" dense stack-label v-model="contratosData[codigo].num_contrato"
                      outlined label="Número de contrato" lazy-rules :rules="[val => val && val.length > 0]"
                      hide-bottom-space :readonly="contratosData[codigo].autogenerar_numero">
                      <template v-slot:prepend>
                        <span>{{ codigo }}</span>
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-auto">
                    <q-checkbox v-model="contratosData[codigo].autogenerar_numero" label="Autogenerar" />
                    <q-icon name="help_outline" class="q-ml-xs">
                      <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                        Al marcar esta opción, los números de contrato se generan automáticamente siguiendo la secuencia
                        del número anterior.
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <div class="col-12">
                    <QSelectEmpresa dense outlined required clearable
                      v-model="contratosData[codigo].vendedor_id"
                      label="Selecciona una empresa (vendedor)"
                      rule="El campo es requerido."
                      :filters="{ contrato: codigo }"
                      />
                  </div>
                  <div class="col-12">
                    <div class="text-h6 text-center">Información del cliente</div>
                  </div>
                  <div class="col-12">
                    <QSelectCliente dense v-model="contratosData[codigo].comprador_id" outlined clearable
                      label="Cliente relacionado" required
                      @update:model-value="val => handleRellenarCamposDeCliente(val, codigo)" />
                  </div>
                  <div class="col-12 text-right text-caption text-grey-6">
                    <template v-if="parseInt(contratosData[codigo].comprador_id)">
                      <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                        agregarClienteDialog.openDialog(contratosData[codigo].comprador_id, e)"/>
                    </template>
                    <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                      color="primary" @click="agregarClienteDialog.openDialog()" />
                  </div>
                  <div class="col-12">
                    <div class="text-h6 text-center">{{ (contratosData[codigo].tipo_parcela || 'Producto').concat('s') }}
                      <q-icon name="help_outline" class="q-ml-xs">
                        <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                          Al asignar las {{ (contratosData[codigo].tipo_parcela || 'Producto').concat('s') }}, su estatus cambiará a "Vendido", y se asignará al comprador como propietario.
                        </q-tooltip>
                      </q-icon>
                    </div>
                  </div>
                  <div class="col-12">
                    <QSelectParcelas dense v-model="contratosData[codigo].parcelas" outlined clearable
                      :label="`Selecciona los ${(contratosData[codigo].tipo_parcela || 'Producto').concat('s')} a asignar`" required
                      :rule="`Debes seleccionar al menos un ${(contratosData[codigo].tipo_parcela || 'Producto')}`"/>
                  </div>
                  <div class="col-12">
                    <div class="text-h6 text-center">Información del contrato</div>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratosData[codigo].parcelas.length"
                      label="Cant. parcelas" step="1" readonly />
                  </div>
                  <div class="col-12 col-md-8">
                    <q-input dense type="number" outlined v-model="contratosData[codigo].valor_venta"
                      label="Valor de venta" step="0.01" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratosData[codigo].numero_cuotas"
                      label="Núm. cuotas" step="1" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratosData[codigo].valor_cuota_inicial"
                      label="Cuota inicial" step="0.01" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratosData[codigo].valor_cuota_mensual"
                      label="Cuota mensual" step="0.01" />
                  </div>
                  <div class="col-12 col-md-6">
                    <QSelectDatetime dense stack-label outlined
                      v-model="contratosData[codigo].fecha_emision" label="Fecha de emisión"/>
                  </div>
                  <div class="col-12 col-md-6">
                    <QSelectDatetime dense stack-label outlined
                      v-model="contratosData[codigo].fecha_vencimiento" label="Fecha de vencimiento"/>
                  </div>
                  <div class="col-12 col-md-8">
                    <q-input dense outlined v-model="contratosData[codigo].direccion_pago" label="Dirección de pago" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense outlined v-model="contratosData[codigo].valor_total" label="Valor total" readonly />
                  </div>
                  <div class="col-12 text-right">
                    <q-checkbox v-model="contratosData[codigo].autocalcular_total" label="Autocalcular total" />
                    <q-icon name="help_outline" class="q-ml-xs">
                      <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                        Al marcar esta opción, se multiplicará el número de parcelas por el valor de la venta y el monto de las cuotas inicial y mensual.
                      </q-tooltip>
                    </q-icon>
                  </div>
                </div>
              </q-step>
            </q-stepper>
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
import { ref, watch, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, scroll } from 'quasar';
import { qNotify } from 'src/boot/jardines';

// Components
import QSelectTiposContratos from 'src/components/selects/QSelectTiposContratos.vue'
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
import QSelectEmpresa from 'src/components/selects/QSelectEmpresa.vue'
import QSelectParcelas from 'src/components/selects/QSelectParcelas.vue'
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';

const $q = useQuasar()
const dialog = ref(false)
const step = ref(0)
const route = useRoute()

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

    if (value[codigo].autocalcular_total) {
      contratosData.value[codigo].valor_total = cantidadParcelas * (valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual)
    } else {
      contratosData.value[codigo].valor_total = valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual
    }
  });

  // Autogenerar código de contrato
  Object.keys(value).forEach(codigo => {
    if (contratosData.value[codigo].autogenerar_numero) {
      contratosData.value[codigo].num_contrato = contratosParams.value?.siguiente_num_contrato
    }
  });

}, { deep: true })

const handleSelectTipoContrato = (opciones) => {
  let opcionesActuales = Object.keys(contratosData.value);
  let opcionesAAgregar = opciones.filter(opcion => !opcionesActuales.includes(opcion));
  let opcionesAEliminar = opcionesActuales.filter(opcion => !opciones.includes(opcion));

  opcionesAAgregar.forEach(opcion => {
    contratosData.value[opcion] = {
      codigo_contrato: opcion,
      autogenerar_numero: true,
      autocalcular_total: true,
      parcelas: [],
      cliente: {},
      tipo_parcela: 'Producto',
      fecha_emision: '2023-01-01',
    }

    api.get('contratos/tipos/' + opcion)
      .then(response => {
        if (response.data) {
          contratosData.value[opcion].tipo_parcela = response.data.tipo_parcela
          contratosData.value[opcion].valor_venta = response.data.valor_venta
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
    let mantenerValoresContrato = {
      vendedor_id: null,
      codigo_contrato: codigo,
      valor_venta: contratosData.value[codigo].valor_venta || null,
      numero_cuotas: contratosData.value[codigo].numero_cuotas || null,
      valor_cuota_inicial: contratosData.value[codigo].valor_cuota_inicial || null,
      valor_cuota_mensual: contratosData.value[codigo].valor_cuota_mensual || null,
    }

    contratosData.value[codigo] = Object.assign({}, contratosData.value[anterior], mantenerValoresContrato)
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

  let postData = Object.values(contratosData.value);

  console.log(postData);

  api.post('contratos', postData)
    .then(response => {
      if (response.data) {
        dialog.value = false
        $q.notify({ message: 'Contratos generados exitosamente.', color: 'positive' })
        emit('created', response.data)
        selectGenerarContratos.value = []
        contratosData.value = {}
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitGenerarContratos))
    .finally(() => isLoadingSubmit.value = false)

}

const propietarioId = ref(null)
const empresaId = ref(null)
const isLoadingSubmit = ref(false)

const openDialog = () => dialog.value = true

defineExpose({ openDialog })
const emit = defineEmits(['created'])

const contratosParams = ref(null)
const siguienteNumContrato = ref('');

onMounted(() => {
  api.get('parcelas/params')
    .then(response => {
      if (response.data) {
        contratosParams.value = response.data
      }
    })
})

</script>
