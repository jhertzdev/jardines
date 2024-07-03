<template>
  <!-- Crear cliente -->
  <q-dialog v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section>
          <div class="text-h6">{{ data.id ? 'Editar' : 'Agregar' }} moneda</div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-sm">
          <div class="col-12 col-md-5">
            <q-input outlined v-model="data.moneda" label="Nombre de la moneda" placeholder="Ejemplo: Dólar americano" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12 col-md-3">
            <q-input outlined v-model="data.simbolo" label="Símbolo" placeholder="Ejemplo: $" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12 col-md-4">
            <q-input type="number" step="0.01" outlined v-model="data.tasa" label="Tasa" placeholder="Ejemplo: 0,00" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12">
            <q-input type="textarea" class="no-resize" outlined v-model="data.descripcion" rows="2" label="Descripción" placeholder="Escribe una descripción (opcional)" clearable/>
          </div>
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
import { qNotify } from 'src/boot/jardines';
// Components
import QSelectMoneda from 'src/components/selects/QSelectMoneda.vue'
import QSelectMetodosPago from 'src/components/selects/QSelectMetodosPago.vue'

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const data = reactive({
  id: null,
  moneda: null,
  simbolo: null,
  descripcion: null,
  tasa: null,
})

const openDialog = (id) => {

  Object.keys(data).forEach((i) => {
    data[i] = null
  })

  if (id) {
    isLoadingSubmit.value = true
    api.get('caja/monedas/' + id)
      .then(response => {
        if (response.data) {
          Object.keys(response.data).forEach((i) => {
            if (data.hasOwnProperty(i)) {
              data[i] = response.data[i]
            }
          })
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => {
        isLoadingSubmit.value = false
        dialog.value = true
      })
  } else {
    dialog.value = true
  }
}

const handleSubmit = () => {


  isLoadingSubmit.value = true
  let postData = { ...data }

  if (data.id) {
    api.put('caja/monedas/' + data.id, postData)
      .then(response => {
        if (response.data) {
          Object.keys(data).forEach((i) => data[i] = null)
          dialog.value = false
          $q.notify({ message: 'Editado exitosamente.', color: 'positive' })
          emit('updated', response.data)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleSubmit }))
      .finally(() => isLoadingSubmit.value = false)
  } else {
    api.post('caja/monedas', postData)
      .then(response => {
        if (response.data) {
          Object.keys(data).forEach((i) => data[i] = null)
          dialog.value = false
          $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
          emit('created', response.data)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleSubmit }))
      .finally(() => isLoadingSubmit.value = false)
  }
}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
