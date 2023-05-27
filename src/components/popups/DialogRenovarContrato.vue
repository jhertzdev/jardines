<template>
  <q-dialog v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md scroll">
      <q-form ref="renovarContratosForm" @submit="handleSubmitRenovarContratos" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">Renovar contrato</div>
        </q-card-section>
        <div class="q-pb-lg text-center" v-if="isLoadingContrato">
          <q-spinner size="xl" color="primary" />
        </div>
        <template v-else-if="contratoData?.num_contrato">
          <q-card-section class="q-py-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md">
                <q-input class="input-num-parcela" dense stack-label v-model="contratoData.num_contrato" outlined
                  label="Número de contrato" lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space
                  readonly>
                  <template v-slot:prepend>
                    <span>{{ contratoData.codigo_contrato }}</span>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-auto">
                <q-input class="input-num-parcela" dense stack-label v-model="contratoData.num_serie" outlined
                  label="Núm. serie" hide-bottom-space
                  :readonly="contratoData.autogenerar_serie" />
              </div>
              <div class="col-12 col-md-auto">
                <q-checkbox v-model="contratoData.autogenerar_serie" label="Autogenerar" />
                <q-icon name="help_outline" class="q-ml-xs">
                  <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                    Al marcar esta opción, el número de serie se genera automáticamente siguiendo la secuencia
                    del número anterior.
                  </q-tooltip>
                </q-icon>
              </div>
              <div class="col-12">
                <QSelectEmpresa dense outlined required clearable v-model="contratoData.vendedor_id"
                  label="Selecciona una empresa (vendedor)" rule="El campo es requerido."
                  :filters="{ contrato: contratoData.codigo_contrato }" />
              </div>
              <div class="col-12">
                <div class="text-h6 text-center">Información del cliente</div>
              </div>
              <div class="col-12">
                <QSelectCliente dense v-model="contratoData.comprador_id" outlined clearable label="Cliente relacionado"
                  required @update:model-value="val => handleRellenarCamposDeCliente(val)" />
              </div>

              <div class="col-sm-5 col-4">
                <q-select dense outlined v-model="contratoData.cliente.doc_identidad" :options="['V', 'E', 'P', 'J', 'G']"
                  label="Documento" clearable @clear="contratoData.cliente.doc_numero = null" hide-bottom-space />
              </div>
              <div class="col-sm-7 col-8">
                <q-input dense outlined v-model="contratoData.cliente.doc_numero" label="Núm. identidad" lazy-rules
                  :rules="[val => val && val.length > 0 || '']" :disable="!contratoData.cliente.doc_identidad"
                  :class="!contratoData.cliente.doc_identidad && 'bg-grey-3'" hide-bottom-space />
              </div>
              <div class="col-12 text-right text-caption text-grey-6">
                <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                  color="primary" @click="agregarClienteDialog.openDialog()" />
              </div>
              <div class="col-12 col-md-6">
                <q-input dense v-model="contratoData.cliente.nombre" outlined label="Nombre" lazy-rules
                  :rules="[val => val && val.length > 0]" hide-bottom-space />
              </div>
              <div class="col-12 col-md-6">
                <q-input dense v-model="contratoData.cliente.apellido" outlined label="Apellido" lazy-rules
                  :rules="[val => val && val.length > 0]" hide-bottom-space />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="datetime-local" stack-label outlined v-model="contratoData.cliente.fecha_nacimiento"
                  label="Fecha de nacimiento" />
              </div>
              <div class="col-12 col-md-4">
                <q-select dense :options="['Soltero/a ', 'Casado/a', 'Divorciado/a', 'Viudo/a']" outlined
                  v-model="contratoData.cliente.estado_civil" label="Estado civil" clearable />
              </div>
              <div class="col-12 col-md-4">
                <q-select dense :options="['Masculino', 'Femenino']" outlined v-model="contratoData.cliente.genero"
                  label="Género" clearable />
              </div>
              <div class="col-12">
                <q-input dense outlined v-model="contratoData.cliente.direccion_habitacion"
                  label="Dirección de habitación" />
              </div>
              <div class="col-12">
                <q-input dense outlined v-model="contratoData.cliente.direccion_trabajo" label="Dirección de trabajo" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="contratoData.cliente.email" label="Email" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="contratoData.cliente.telefono_principal" label="Teléfono principal" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="contratoData.cliente.telefono_secundario" label="Teléfono secundario" />
              </div>

              <div class="col-12">
                <div class="text-h6 text-center">
                  {{ (contratoData.tipo_parcela || 'Producto').concat('s') }}
                </div>
              </div>
              <div class="col-12">
                <q-table class="q-mb-lg" :columns="[
                  { name: 'codigo_parcela', label: 'Cód. parcela', field: 'codigo_parcela', sortable: false, align: 'center' },
                  { name: 'estatus', label: 'Estatus', field: 'estatus', sortable: false, align: 'center' },
                ]" :rows="contratoData.parcelas" row-key="id" separator="cell" :pagination="{ rowsPerPage: -1 }" />

              </div>
              <div class="col-12">
                <div class="text-h6 text-center">Información del contrato</div>
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="contratoData.parcelas.length" label="Cant. parcelas"
                  step="1" readonly />
              </div>
              <div class="col-12 col-md-8">
                <q-input dense type="number" outlined v-model="contratoData.valor_venta" label="Valor de venta"
                  step="0.01" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="contratoData.numero_cuotas" label="Núm. cuotas" step="1" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="contratoData.valor_cuota_inicial" label="Cuota inicial"
                  step="0.01" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="contratoData.valor_cuota_mensual" label="Cuota mensual"
                  step="0.01" />
              </div>
              <div class="col-12 col-md-6">
                <q-input dense type="datetime-local" stack-label outlined v-model="contratoData.fecha_emision"
                  label="Fecha de emisión" />
              </div>
              <div class="col-12 col-md-6">
                <q-input dense type="datetime-local" stack-label outlined v-model="contratoData.fecha_vencimiento"
                  label="Fecha de vencimiento" />
              </div>
              <div class="col-12 col-md-8">
                <q-input dense outlined v-model="contratoData.direccion_pago" label="Dirección de pago" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="contratoData.valor_total" label="Valor total" readonly />
              </div>
              <div class="col-12 text-right">
                <q-checkbox v-model="contratoData.autocalcular_total" label="Autocalcular total" />
                <q-icon name="help_outline" class="q-ml-xs">
                  <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                    Al marcar esta opción, se multiplicará el número de parcelas por el valor de la venta y el monto de
                    las cuotas inicial y mensual.
                  </q-tooltip>
                </q-icon>
              </div>
            </div>

          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn color="primary" label="Renovar contrato" icon="description" :loading="isLoadingSubmit"
              @click="renovarContratosForm.submit()" />
          </q-card-actions>
        </template>
        <q-card-section v-else>
          <p class="text-center">Contrato no encontrado.</p>
        </q-card-section>


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
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
import QSelectEmpresa from 'src/components/selects/QSelectEmpresa.vue'
import QSelectParcelas from 'src/components/selects/QSelectParcelas.vue'
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";

const $q = useQuasar()
const dialog = ref(false)
const step = ref(0)
const route = useRoute()

const agregarClienteDialog = ref(null)
const renovarContratosForm = ref(null)

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

const selectRenovarContratos = ref([])
const contratoData = ref(null)

const { getScrollTarget, setVerticalScrollPosition } = scroll
const onValidationError = (ref) => {
  const el = ref.$el
  setVerticalScrollPosition(getScrollTarget(el), el.offsetTop, 200)
}

watch(contratoData, (value) => {
  /*if (!Object.keys(value).includes(step.value)) {
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
  */

  // Autogenerar código de contrato  
  if (contratoData.value.autogenerar_serie) {
    console.log(contratoData.value);
    contratoData.value.num_serie = contratoData.value.siguiente_num_serie
  }

}, { deep: true })

const handleRellenarCamposDeCliente = (value, codigo) => {

  console.log('Rellenar');
  api.get('clientes/' + value)
    .then(response => {
      if (response.data) {
        ['nombre', 'doc_numero', 'doc_identidad', 'apellido', 'fecha_nacimiento', 'direccion_habitacion', 'direccion_trabajo',
          'estado_civil', 'genero', 'email', 'telefono_principal', 'telefono_secundario'].forEach(key => {
            contratoData['cliente'][key] = response.data[key]
          });
      }
    })
}

const handleSubmitRenovarContratos = () => {
  isLoadingSubmit.value = true

  api.post('contratos/' + contratoData.value.id + '/renovar', contratoData.value)
    .then(response => {
      if (response.data) {
        console.log(response.data);
        dialog.value = false
        $q.notify({ message: 'Contrato renovado exitosamente.', color: 'positive' })
        emit('done', response.data)
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitRenovarContratos))
    .finally(() => isLoadingSubmit.value = false)

}

const isLoadingSubmit = ref(false)
const isLoadingContrato = ref(true)

const openDialog = (id) => {
  isLoadingContrato.value = true
  api.get('contratos/' + id + '?with[]=sigNumSerie')
    .then(response => {
      if (response.data) {
        contratoData.value = response.data
        console.log(response.data);
        if (!contratoData.value.cliente) contratoData.value.cliente = {}
        contratoData.value.parcelasIds = contratoData.value.parcelas?.map(parcela => {
          console.log(parcela.id);
          return parcela.id
        }) || []
        contratoData.value.autocalcular_total = false
        contratoData.value.autogenerar_serie = true
      }
    })
    .finally(() => isLoadingContrato.value = false)
  dialog.value = true
}

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
