<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md scroll">
      <q-form ref="traspasarContratosForm" @submit="handleSubmitTraspasarContratos" @validation-error="onValidationError">
        <q-card-section>
          <div class="flex justify-between items-center">
            <div class="text-h6">Traspasar contratos</div>
            <q-option-group v-model="tipoTraspaso" :options="opcionesTraspaso" inline map-options emit-value @update:model-value="handleUpdateTipoTraspaso" />
          </div>
        </q-card-section>
        <q-card-section>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <QSelectContratos dense outlined clearable v-model="contratoActualId" :multiple="false" label="Selecciona el contrato a traspasar" rule="El campo es requerido." @update:model-value="handleUpdateContratoActual" />
            </div>
            <div class="col-12 col-md-6">
              <QSelectCliente dense outlined clearable v-model="nuevoTitularId" label="Selecciona al nuevo titular" rule="El campo es requerido." @update:model-value="handleUpdateNuevoTitular" :filters="{ difunto: 0 }"/>
            </div>
          </div>

          <template v-if="tipoTraspaso == 'traspaso_ubicaciones' && nuevoTitularId">
            <q-option-group v-model="contratoNuevoId" :options="[...contratosNuevoTitular, { label: 'Crear nuevo contrato', value: 0 }]" inline map-options emit-value class="text-center q-mb-md" @update:model-value="handleUpdateContratoNuevo" />
          </template>

          <div class="row q-col-gutter-md q-mb-lg" v-if="tipoTraspaso == 'traspaso_ubicaciones'">
            <div class="col-12 col-md-6">
              <div class="text-weight-bold text-center q-mb-sm text-primary">Ubicaciones en el contrato actual</div>
              <q-list dense bordered separator>
                <q-item v-for="ubicacion in ubicaciones.contratoActual" v-show="!ubicacion.transferido">
                  <q-item-section>
                    {{ ubicacion.codigo_parcela }}
                  </q-item-section>
                  <q-item-section avatar @click="handleTraspasarUbicacion(ubicacion)" v-show="ubicacion.transferible">
                    <q-btn color="primary" dense round size="small" icon="chevron_right" />
                  </q-item-section>
                </q-item>
                <q-item v-if="ubicaciones.contratoActual?.filter(ubicacion => !ubicacion.transferido).length === 0">
                  <q-item-section class="text-center q-py-md text-grey">
                    No hay ubicaciones para transferir.
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-weight-bold text-center q-mb-sm text-primary">Ubicaciones en el contrato nuevo</div>
              <q-list dense bordered separator>
                <q-item v-for="ubicacion in ubicaciones.contratoNuevo">
                  <q-item-section>
                    {{ ubicacion.codigo_parcela }}
                  </q-item-section>
                </q-item>
                <q-item v-for="ubicacion in ubicaciones.contratoActual" v-show="ubicacion.transferido">
                  <q-item-section avatar @click="handleTraspasarUbicacion(ubicacion)" v-show="ubicacion.transferible">
                    <q-btn color="primary" dense round size="small" icon="chevron_left" />
                  </q-item-section>
                  <q-item-section>
                    {{ ubicacion.codigo_parcela }}
                  </q-item-section>
                </q-item>
                <q-item v-if="!ubicaciones.contratoActual?.filter(ubicacion => ubicacion.transferido).length">
                  <q-item-section class="text-center q-py-md text-grey">
                    No se han seleccionado ubicaciones para transferir.
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mb-lg" v-if="tipoTraspaso == 'traspaso_titular'">
            <div class="col-12 col-md-4 offset-md-4 text-center">
              <div class="text-weight-bold text-center q-mb-sm text-primary">Ubicaciones a traspasar</div>
              <q-list dense bordered separator>
                <q-item v-for="ubicacion in ubicaciones.contratoActual">
                  <q-item-section>
                    {{ ubicacion.codigo_parcela }}
                  </q-item-section>
                </q-item>
                <q-item v-if="ubicaciones.contratoActual.length === 0">
                  <q-item-section class="text-center q-py-md text-grey">
                    No hay ubicaciones para transferir.
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <template v-if="contratoNuevoId === 0 || tipoTraspaso == 'traspaso_titular'">
            <div class="text-h6 text-center q-mb-md">Información del contrato</div>
            <div class="row q-col-gutter-md q-mb-lg q-mx-auto" style="max-width: 600px;">
              <div class="col-12 col-md-6">
                <QSelectTiposContratos dense v-model="contratoNuevoData.codigo_contrato" outlined required label="Selecciona el tipo de contrato" :multiple="false" />
              </div>

              <div class="col-12 col-md-6">
                <div class="row">
                  <div class="col-12 col-md">
                    <q-input class="input-num-parcela" dense stack-label v-model="contratoNuevoData.num_contrato"
                      outlined label="Número de contrato" lazy-rules :rules="[val => val && val.length > 0]"
                      hide-bottom-space :readonly="contratoNuevoData.autogenerar_numero">
                      <template v-slot:prepend>
                        <span>{{ contratoNuevoData.codigo_contrato }}</span>
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-auto">
                    <q-checkbox v-model="contratoNuevoData.autogenerar_numero" label="Autogenerar" />
                    <q-icon name="help_outline" class="q-ml-xs">
                      <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                        Al marcar esta opción, los números de contrato se generan automáticamente siguiendo la secuencia
                        del número anterior.
                      </q-tooltip>
                    </q-icon>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="ubicaciones.contratoNuevo.length"
                  label="Cant. parcelas" step="1" readonly />
              </div>
              <div class="col-12 col-md-8">
                <q-input dense type="number" outlined v-model="contratoNuevoData.valor_venta"
                  label="Valor de venta" step="0.01" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="contratoNuevoData.numero_cuotas"
                  label="Núm. cuotas" step="1" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="contratoNuevoData.valor_cuota_inicial"
                  label="Cuota inicial" step="0.01" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense type="number" outlined v-model="contratoNuevoData.valor_cuota_mensual"
                  label="Cuota mensual" step="0.01" />
              </div>
              <div class="col-12 col-md-6">
                <QSelectDatetime dense stack-label outlined
                  v-model="contratoNuevoData.fecha_emision" label="Fecha de emisión"/>
              </div>
              <div class="col-12 col-md-6">
                <QSelectDatetime dense stack-label outlined
                  v-model="contratoNuevoData.fecha_vencimiento" label="Fecha de vencimiento"/>
              </div>
              <div class="col-12 col-md-8">
                <q-input dense outlined v-model="contratoNuevoData.direccion_pago" label="Dirección de pago" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="contratoNuevoData.valor_total" label="Valor total" readonly />
              </div>
              <div class="col-12 text-right">
                <q-checkbox v-model="contratoNuevoData.autocalcular_total" label="Autocalcular total" />
                <q-icon name="help_outline" class="q-ml-xs">
                  <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                    Al marcar esta opción, se multiplicará el número de parcelas por el valor de la venta y el monto de las cuotas inicial y mensual.
                  </q-tooltip>
                </q-icon>
              </div>
            </div>
          </template>

        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Traspasar" icon="swap_horiz" :loading="isLoadingSubmit" @click="traspasarContratosForm.submit()"/>
        </q-card-actions>
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
import QSelectEstatusContrato from 'src/components/selects/QSelectEstatusContrato.vue'
import QSelectParcelas from 'src/components/selects/QSelectParcelas.vue'
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';
import QSelectContratos from '../selects/QSelectContratos.vue';
import QSelectTiposContratos from '../selects/QSelectTiposContratos.vue';

const $q = useQuasar()
const dialog = ref(false)
const dialogAgregarProductos = ref(false)
const step = ref(0)
const route = useRoute()

const agregarClienteDialog = ref(null)

const tipoTraspaso = ref('traspaso_titular');
const opcionesTraspaso = ref([
  {
    label: 'Traspaso de titular',
    value: 'traspaso_titular'
  },
  {
    label: 'Traspaso de ubicaciones',
    value: 'traspaso_ubicaciones'
  },
]);

const ubicaciones = ref({
  contratoActual: [],
  contratoNuevo: []
});

const handleTraspasarUbicacion = (ubicacion) => {

  ubicacion.transferido = !ubicacion.transferido;
  console.log('handleTraspasarUbicacion', ubicacion);

}

const contratoActualId = ref(null)
const contratoActualData = ref({})

const contratoNuevoId = ref(null)
const contratosNuevoTitular = ref([])
const nuevoTitularId = ref(null)

const contratoNuevoData = ref({
  codigo_contrato: null,
})

const openDialog = (id) => {
  dialog.value = true
}

const handleUpdateTipoTraspaso = (value) => {
  contratoActualId.value = null
  contratoNuevoId.value = null
  contratosNuevoTitular.value = []
  nuevoTitularId.value = null
  handleUpdateContratoActual(null)
  handleUpdateContratoNuevo(null)
}

const handleUpdateContratoActual = (value) => {
  ubicaciones.value.contratoActual = []
  contratoActualData.value = {}

  api.get('contratos/' + value)
  .then(response => {
    if (response.data) {
      contratoActualData.value = response.data

      if (tipoTraspaso.value === 'traspaso_titular') {
        ubicaciones.value.contratoActual = response.data?.parcelas || []
        ubicaciones.value.contratoNuevo = response.data?.parcelas || []
      } else {
        ubicaciones.value.contratoActual = response.data?.parcelas?.map(parcela => {
          parcela.transferible = true
          return parcela
        }) || []
      }

    }
  })
}

const handleUpdateContratoNuevo = (value) => {

  if (tipoTraspaso.value === 'traspaso_titular') {
    ubicaciones.value.contratoNuevo = ubicaciones.value.contratoActual
  } else {
    ubicaciones.value.contratoNuevo = []
  }

  if (value) {
    api.get('contratos/' + value)
      .then(response => {
        if (response.data) {
          ubicaciones.value.contratoNuevo = response.data.parcelas;
        }
      })
  }
}

const handleUpdateNuevoTitular = (value) => {
  contratoNuevoId.value = null;
  handleUpdateContratoNuevo(contratoNuevoId.value)

  api.get('contratos?f[tipo_actividad]=venta_parcelas&f[comprador_id]=' + value)
  .then(response => {
    contratosNuevoTitular.value = []
    response.data.data.forEach(contrato => {
      contratosNuevoTitular.value.push({
        label: `${contrato.codigo_contrato}-${contrato.num_contrato} (${contrato.estatus})`,
        value: contrato.id
      })
    })

  })
}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
