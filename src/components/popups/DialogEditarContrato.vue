<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md scroll">
      <q-form ref="editarContratosForm" @submit="handleSubmitEditarContratos" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">Editar contrato</div>
        </q-card-section>
        <div class="q-pb-lg text-center" v-if="isLoadingContrato">
          <q-spinner size="xl" color="primary" />
        </div>
        <template v-else-if="contratoData?.num_contrato">
          <q-card-section class="q-py-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <q-input class="input-num-parcela" dense stack-label v-model="contratoData.num_contrato" outlined
                  label="Número de contrato" lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space
                  readonly>
                  <template v-slot:prepend>
                    <span>{{ contratoData.codigo_contrato }}</span>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-4">
                <QSelectEstatusContrato label="Estatus" dense outlined required v-model="contratoData.estatus" />
              </div>
              <div class="col-12">
                <QSelectEmpresa dense outlined required clearable
                  v-model="contratoData.vendedor_id"
                  label="Selecciona una empresa (vendedor)"
                  rule="El campo es requerido."
                  :filters="{ contrato: contratoData.codigo_contrato }"
                  />
              </div>
              <div class="col-12">
                <div class="text-h6 text-center">Información del cliente</div>
              </div>
              <div class="col-12">
                <QSelectCliente dense v-model="contratoData.comprador_id" outlined clearable label="Cliente relacionado"
                  required @update:model-value="val => handleRellenarCamposDeCliente(val)" />
              </div>
              <div class="col-12 text-right text-caption text-grey-6">
                <template v-if="parseInt(contratoData.comprador_id)">
                  <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                    agregarClienteDialog.openDialog(contratoData.comprador_id, e)"/>
                </template>
                <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                  color="primary" @click="agregarClienteDialog.openDialog()" />
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
                  { name: 'pagado_hasta', label: 'Pagado hasta', field: 'pagado_hasta', sortable: false, align: 'center' },
                ]" :rows="contratoData.parcelas" row-key="id" separator="cell" selection="multiple"
                  v-model:selected="selectedProducts"
                  :pagination="{rowsPerPage: -1}"
                >
                  <template v-slot:body-cell-pagado_hasta="props">
                    <q-td :props="props">
                      <template v-if="props.row.pagado_hasta">
                        {{ format(props.row.pagado_hasta, 'dd/MM/yyyy') }}
                      </template>
                      <template v-else>
                        <span>-</span>
                      </template>
                    </q-td>
                  </template>
                </q-table>
                <div class="text-center q-gutter-sm flex justify-center q-mb-sm">
                  <div>
                    <q-btn color="primary" label="Agregar" icon="add" @click="dialogAgregarProductos = true" />
                  </div>
                  <div>
                    <q-btn color="primary" label="Actualizar fecha" icon="event" @click="dialogActualizarFechas = true" :disable="selectedProducts.length < 1" />
                  </div>
                </div>
                <div class="text-center q-gutter-sm flex justify-center">
                  <div>
                    <q-btn color="primary" label="Liberar" icon="lock_open" @click="handleLiberarProductos()" :disable="selectedProducts.length < 1" />
                    <q-tooltip anchor="top middle" self="bottom middle" max-width="240px"
                      v-if="selectedProducts.length < 1">
                      Debes selecciona 1 o más {{ (contratoData.tipo_parcela || 'Producto').concat('s') }} para liberar.
                    </q-tooltip>
                  </div>
                  <div>
                    <q-btn color="primary" label="Desligar" icon="eject" @click="handleDesligarProductos()" :disable="selectedProducts.length < 1" />
                    <q-tooltip anchor="top middle" self="bottom middle" max-width="240px"
                      v-if="selectedProducts.length < 1">
                      Debes selecciona 1 o más {{ (contratoData.tipo_parcela || 'Producto').concat('s') }} para desligar.
                    </q-tooltip>
                  </div>
                </div>
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
              <div class="col-12 col-md-4">
                <QSelectDatetime dense stack-label outlined v-model="contratoData.fecha_emision" label="Fecha de emisión" readonly />
              </div>
              <div class="col-12 col-md-4">
                <QSelectDatetime dense stack-label outlined v-model="contratoData.fecha_vencimiento" label="Fecha de vencimiento" readonly />
              </div>
              <div class="col-12 col-md-4">
                <QSelectDatetime dense stack-label outlined v-model="contratoData.vigente_hasta" label="Vigente hasta" readonly />
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
            <q-btn color="primary" label="Editar contratos" icon="description" :loading="isLoadingSubmit"
              @click="editarContratosForm.submit()" />
          </q-card-actions>
        </template>
        <q-card-section v-else>
          <p class="text-center">Contrato no encontrado.</p>
        </q-card-section>


      </q-form>

    </q-card>
  </q-dialog>

  <q-dialog allow-focus-outside v-model="dialogAgregarProductos" class="j-dialog">

    <q-card class="q-pa-md scroll">
      <q-form>

        <q-card-section>
          <div class="text-h6">Agregar {{(contratoData.tipo_parcela || 'Producto').concat('s')}}</div>
        </q-card-section>

        <q-card-section class="q-py-none">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <QSelectParcelas dense v-model="addProducts" outlined clearable
                :label="`Selecciona los ${(contratoData.tipo_parcela || 'Producto').concat('s')} a asignar`" required
                :rule="`Debes seleccionar al menos un ${(contratoData.tipo_parcela || 'Producto')}`"

                 />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Agregar" icon="add" :loading="isLoadingSubmit" @click="handleSubmitAgregarProductos"/>
        </q-card-actions>

      </q-form>
    </q-card>

  </q-dialog>

  <q-dialog allow-focus-outside v-model="dialogActualizarFechas" class="j-dialog">
    <q-card class="q-pa-md scroll">
      <q-form ref="actualizarFechasForm" @submit="handleSubmitActualizarFechas">
        <q-card-section>
          <div class="text-h6">Actualizar fechas</div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <q-table class="q-mb-lg" :columns="[
            { name: 'codigo_parcela', label: 'Cód. parcela', field: 'codigo_parcela', sortable: false, align: 'center' },
            { name: 'pagado_hasta', label: 'Pagado hasta', field: 'pagado_hasta', sortable: false, align: 'center' },
          ]" :rows="selectedProducts" row-key="id" separator="cell"
            :pagination="{rowsPerPage: -1}" hide-bottom
          >
            <template v-slot:body-cell-pagado_hasta="props">
              <q-td :props="props">
                <q-input type="date"
                  dense outlined
                  v-model="props.row.nuevo_pagado_hasta" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Actualizar fechas" icon="event" :loading="isLoadingSubmit" @click="actualizarFechasForm.submit()"/>
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
import { format } from 'date-fns';

// Components
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
import QSelectEmpresa from 'src/components/selects/QSelectEmpresa.vue'
import QSelectEstatusContrato from 'src/components/selects/QSelectEstatusContrato.vue'
import QSelectParcelas from 'src/components/selects/QSelectParcelas.vue'
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';

const $q = useQuasar()
const dialog = ref(false)
const dialogAgregarProductos = ref(false)
const dialogActualizarFechas = ref(false)
const step = ref(0)
const route = useRoute()

const agregarClienteDialog = ref(null)
const editarContratosForm = ref(null)
const actualizarFechasForm = ref(null)
const selectedProducts = ref([])
const addProducts = ref([])

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

const selectEditarContratos = ref([])
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

  // Autoeditar código de contrato
  Object.keys(value).forEach(codigo => {
    if (contratosData.value[codigo].autoeditar_numero) {
      contratosData.value[codigo].num_contrato = contratosParams.value?.siguiente_num_contrato
    }
  });*/

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

const handleSubmitEditarContratos = () => {
  isLoadingSubmit.value = true

  api.put('contratos/' + contratoData.value.id, contratoData.value)
    .then(response => {
      if (response.data) {
        dialog.value = false
        $q.notify({ message: 'Contrato editado exitosamente.', color: 'positive' })
        emit('updated', response.data)
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitEditarContratos))
    .finally(() => isLoadingSubmit.value = false)

}

const handleSubmitActualizarFechas = () => {
  isLoadingSubmit.value = true

  let postData = selectedProducts.value.map(ubicacion => {
    return {
      ubicacion_id: ubicacion.id,
      contrato_id: contratoData.value.id,
      nuevo_pagado_hasta: ubicacion.nuevo_pagado_hasta,
    }
  })

  console.log('postData', postData)

  api.post('contratos/' + contratoData.value.id + '/actualizarFechas', postData)
    .then(response => {
      if (response.data) {
        dialogActualizarFechas.value = false
        selectedProducts.value = []
        openDialog(contratoData.value.id)
        emit('updated', response.data)
        $q.notify({ message: 'Fechas actualizadas exitosamente.', color: 'positive' })
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitActualizarFechas))
    .finally(() => isLoadingSubmit.value = false)

}

const handleSubmitAgregarProductos = () => {
  isLoadingSubmit.value = true

  let postData = Object.values(addProducts.value)

  api.post('contratos/' + contratoData.value.id + '/agregarProductos', postData)
    .then(response => {
      if (response.data) {
        dialogAgregarProductos.value = false
        addProducts.value = []
        openDialog(contratoData.value.id)
        emit('updated', response.data)
        $q.notify({ message: 'Agregados exitosamente.', color: 'positive' })
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitAgregarProductos))
    .finally(() => isLoadingSubmit.value = false)

}

const handleDesligarProductos = (confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Desligar ubicaciones',
      message: '¿Estás seguro de que quieres desligar las ubicaciones del contrato seleccionado?',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Desligar ubicaciones',
        color: 'primary',
        flat: true,
        icon: 'eject'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      handleDesligarProductos(true)
    })
  } else {
    isLoadingSubmit.value = true

    let postData = selectedProducts?.value?.map(parcela => {
      return parcela.id
    }) || []

    api.post('contratos/' + contratoData.value.id + '/desligarProductos', postData)
      .then(response => {
        if (response.data) {
          console.log(response.data);
          selectedProducts.value = []
          openDialog(contratoData.value.id)
          emit('updated', response.data)
          $q.notify({ message: 'Desligados exitosamente.', color: 'positive' })
        }
      })
      .catch((error) => qNotify(error, 'error', handleDesligarProductos(false)))
      .finally(() => isLoadingSubmit.value = false)
  }


}

const handleLiberarProductos = (confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Liberar ubicaciones',
      message: '¿Estás seguro de que quieres liberar las ubicaciones? Se desligarán de cualquier contrato que tenga, y quedarán en estatus "Disponible", para poder ser asignadas a otro contrato o titular, incluso si tienen fallecidos. Esta acción no se puede deshacer.',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Desligar ubicaciones',
        color: 'primary',
        flat: true,
        icon: 'eject'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      handleDesligarProductos(true)
    })
  } else {

    isLoadingSubmit.value = true

    let postData = selectedProducts?.value?.map(parcela => {
      return parcela.id
    }) || []

    api.post('contratos/' + contratoData.value.id + '/liberarProductos', postData)
      .then(response => {
        if (response.data) {
          console.log('contratos/' + contratoData.value.id + '/liberarProductos', postData);
          selectedProducts.value = []
          openDialog(contratoData.value.id)
          emit('updated', response.data)
          $q.notify({ message: 'Liberados exitosamente.', color: 'positive' })
        }
      })
      .catch((error) => qNotify(error, 'error', handleLiberarProductos(false)))
      .finally(() => isLoadingSubmit.value = false)
    }
}

const isLoadingSubmit = ref(false)
const isLoadingContrato = ref(true)

const openDialog = (id) => {
  isLoadingContrato.value = true
  selectedProducts.value = []

  api.get('contratos/' + id)
    .then(response => {
      if (response.data) {

      console.log('contratos', response.data);


        contratoData.value = response.data
        console.log(response.data);
        if (!contratoData.value.cliente) contratoData.value.cliente = {}
        contratoData.value.parcelasIds = contratoData.value.parcelas?.map(parcela => {
          console.log(parcela.id);
          return parcela.id
        }) || []
        contratoData.value.autocalcular_total = false


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
