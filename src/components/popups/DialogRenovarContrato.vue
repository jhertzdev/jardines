<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
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

            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-12 col-md-6">
                <q-input dense stack-label outlined v-model="contratoData.codnum_contrato" label="Número de contrato" readonly />
              </div>
              <div class="col-12 col-md-6">
                <q-input type="date" dense stack-label outlined
                  :model-value="contratoData.vigente_hasta ? format(contratoData.vigente_hasta, 'yyyy-MM-dd') : null"
                  label="Vigente hasta" readonly />
              </div>
              <div class="col-12 col-md-6">
                <q-input type="date" dense stack-label outlined
                  :model-value="contratoData.fecha_emision ? format(contratoData.fecha_emision, 'yyyy-MM-dd') : null"
                  label="Fecha de emisión" readonly />
              </div>
              <div class="col-12 col-md-6">
                <q-input type="date" dense stack-label outlined
                  :model-value="contratoData.fecha_vencimiento ? format(contratoData.fecha_vencimiento, 'yyyy-MM-dd') : null"
                  label="Fecha de vencimiento" readonly />
              </div>
              <div class="col-12 col-md-3">
                <q-input type="number" min="1" dense stack-label outlined v-model="contratoData.periodos_renovacion" label="Años a renovar"
                  @update:model-value="handleChangePeriodosRenovacion"></q-input>
              </div>
              <div class="col-12 col-md">
                <q-input type="date" dense stack-label outlined
                  :model-value="contratoData.nueva_fecha_emision"
                  label="Nueva fecha de emisión" readonly />
              </div>
              <div class="col-12 col-md">
                <q-input type="date" dense stack-label outlined
                  :model-value="contratoData.nueva_fecha_vencimiento"
                  label="Nueva fecha de vencimiento" readonly />
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
import { format, add } from 'date-fns';

// Components
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

const handleChangePeriodosRenovacion = (value) => {
  contratoData.value.nueva_fecha_vencimiento = value ? add(
    new Date(contratoData.value.fecha_vencimiento), { years: value }
  ).toISOString().substring(0, 10) : null

  contratoData.value.nueva_fecha_emision = value ? add(
    new Date(contratoData.value.fecha_vencimiento), { years: value - 1 }
  ).toISOString().substring(0, 10) : null
}

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

  let postData = {
    periodos_renovacion: contratoData.value.periodos_renovacion,
    nueva_fecha_emision: contratoData.value.nueva_fecha_emision,
    nueva_fecha_vencimiento: contratoData.value.nueva_fecha_vencimiento,
  }

  api.post('contratos/' + contratoData.value.id + '/renovar', postData)
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
