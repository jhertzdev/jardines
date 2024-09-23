<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md scroll">
      <q-form ref="cambiarTitularForm" @submit="handleSubmitCambiarTitular" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">Cambiar titular</div>
        </q-card-section>
        <q-card-section class="q-px-sm">
          <div class="text-right text-caption text-grey-6" v-if="!props.relacionado">
            <span>¿El cliente no existe?</span>
            <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary" @click="agregarClienteDialog.openDialog(null, null)" />
          </div>
          <template v-for="contrato in data.contratos">
            <div class="row q-col-gutter-md q-mb-sm">
              <div class="col-12 col-md-auto">
                <q-checkbox v-model="contrato.selected" :label="contrato.codnum_contrato" />
              </div>
              <div class="col-12 col-md text-right text-caption text-grey-6">
                <QSelectCliente dense outlined clearable v-model="contrato.comprador_id" @update:model-value="val => handleSelectCliente(val)" :disable="!contrato.selected"
                  label="Selecciona el nuevo titular" />
              </div>
            </div>
          </template>
          <q-separator class="q-mt-md" />
          <q-checkbox v-model="data.diferentes_titulares" label="Seleccionar diferentes titulares" />
          <q-checkbox v-model="data.guardar_copia" label="Guardar copia inactiva del contrato" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Cambiar titular" icon="person" :loading="isLoadingSubmit" @click="cambiarTitularForm.submit()"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <template v-if="!relacionado">
    <DialogAgregarCliente ref="agregarClienteDialog" />
  </template>




</template>

<script setup>

import { ref, reactive, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { qNotify } from 'src/boot/jardines';
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'

const $q = useQuasar()

const dialog = ref(false)
const data = ref({
  id: null,
  contratoId: null,
  contratos: {},
})

const props = defineProps({
  relacionado: {
    type: Boolean,
    default: false,
  }
})

const isLoadingSubmit = ref(false)
const cambiarTitularForm = ref(null)
const agregarClienteDialog = ref(null)

const handleSelectCliente = (clienteId) => {
  if (data.value.diferentes_titulares) return;

  for (let key in data.value.contratos) {
    data.value.contratos[key].comprador_id = clienteId
  }
}

const handleSubmitCambiarTitular = () => {

  let postData = {
    cliente_id: data.value.cliente_id,
    contratos: Object.values(data.value.contratos).filter(contrato => contrato.selected),
    guardar_copia: data.value.guardar_copia ? true : false,
  }

  api.post('contratos/cambiarTitular', postData)
    .then(response => {
      if (response.data) {
        console.log(response.data)
        dialog.value = false
        $q.notify({ message: 'Titular cambiado exitosamente.', color: 'positive' })
        emit('updated', response.data)
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitCambiarTitular))
    .finally(() => isLoadingSubmit.value = false)

}

const onValidationError = () => {

}

const openDialog = (params = {}) => {
  data.value = params

  api.get('clientes/' + data.value.cliente_id + '?with[]=data')
    .then(response => {
      if (response.data) {
        data.value.contratos = {}
        response.data.contratos.forEach(contrato => {
          data.value.contratos[contrato.id] = {
            codnum_contrato: contrato.codigo_contrato + '-' + contrato.num_contrato,
            comprador_id: contrato.comprador_id,
            id: contrato.id,
            selected: params?.num_contrato == contrato.num_contrato || params?.select_all ? true : false,
          }
        });
      }
    })

  data.value.diferentes_titulares = false
  data.value.guardar_copia = false

  dialog.value = true
}

const emit = defineEmits(['updated'])

defineExpose({ openDialog })

</script>
