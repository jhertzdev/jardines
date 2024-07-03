<template>
  <q-dialog v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md scroll">
      <q-form ref="asignarParcelaForm" @submit="handleSubmitAsignarParcela" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">Traspasar parcela</div>
        </q-card-section>
        <div class="q-pb-lg text-center" v-if="isLoadingParcela">
          <q-spinner size="xl" color="primary" />
        </div>
        <q-card-section v-else class="q-py-none">

          {{ parcelaData.contratos }}
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <QSelectCliente dense v-model="parcelaData.comprador_id" outlined clearable label="Propietario" required />
            </div>
            <div class="col-12">
              <QSelectContratos dense v-model="parcelaData.comprador_id" outlined clearable label="Propietario" required />
            </div>
          </div>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { qNotify } from 'src/boot/jardines';
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'

const dialog = ref(false)
const parcelaData = ref({})
const asignarParcelaForm = ref(null)

const isLoadingParcela = ref(true)

const handleSubmitAsignarParcela = () => {

}

const onValidationError = () => {

}

const openDialog = (id = null) => {
  isLoadingParcela.value = true;
  api.get('parcelas/' + id)
    .then(response => {
      parcelaData.value = response.data;
    })
    .finally(() => {
      isLoadingParcela.value = false
      dialog.value = true
    })

  /*isLoadingContrato.value = true
  api.get('contratos/' + id)
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


      }
    })
    .finally(() => isLoadingContrato.value = false)*/
}

defineExpose({ openDialog })

</script>
