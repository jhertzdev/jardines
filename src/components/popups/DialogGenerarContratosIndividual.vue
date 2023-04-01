<template>
  <!-- Crear cliente -->
  <q-dialog v-model="dialog" class="j-dialog">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'">
        <q-card-section>
          <div class="text-h6">Generar contratos</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <QSelectCliente dense outlined required clearable
            v-model="propietarioId" 
            label="Selecciona un propietario (comprador)"
            hint="Busca por nombre o número de documento."
            rule="El campo es requerido." />
          <QSelectEmpresa dense outlined required clearable
            v-model="empresaId" 
            label="Selecciona una empresa (vendedor)"
            rule="El campo es requerido." />
          <q-separator class="q-mt-xl q-mb-lg"/>
          <p class="text-center">Los números de contrato se generan automáticamente a partir del anterior. Se generarán los siguientes contratos:</p>
          <table class="full-width q-px-lg">
            <tr v-for="tipoContrato in props.params?.tipos_contratos">
              <td class="text-center">{{ tipoContrato.nombre }}</td>
              <td class="text-weight-bold">{{ tipoContrato.codigo_contrato }}{{ props.params.siguiente_num_contrato }}</td>
            </tr>
          </table>
        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
// Components
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
import QSelectEmpresa from 'src/components/selects/QSelectEmpresa.vue'

const $q = useQuasar()
const dialog = ref(false)
const route = useRoute()
const props = defineProps({
  propietarioId: {
    type: String,
    default: null
  },
  parcelaId: {
    type: String,
    default: null
  },
  params: {
    type: Object,
    default: []
  }
})

function qNotifyError(error) {
  let message = !!error?.response?.data?.messages ?
    Object.values(error.response.data.messages).join(' ') :
    'Ha ocurrido un error.'
  $q.notify({ message, color: 'negative' })
}

const handleSubmit = () => {
  isLoadingSubmit.value = true
  let postData = {
    parcela_id: route.params.id,
    comprador_id: propietarioId.value,
    vendedor_id: empresaId.value
  }

  api.post('parcelas/' + route.params.id + '/generarContratos', postData)
    .then(response => {
      if (response.data) {
        dialog.value = false
        $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
        emit('created', response.data)
      }
    })
    .catch(error => qNotifyError(error))
    .finally(() => isLoadingSubmit.value = false)

}

const propietarioId = ref(null)
const empresaId = ref(null)
const isLoadingSubmit = ref(false)

const openDialog = () => dialog.value = true

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>