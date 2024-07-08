<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'">
        <q-card-section>
          <div class="text-h6">Agregar método de pago</div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input outlined v-model="data.metodo" label="Nombre del método" placeholder="Escribe el nombre del método de pago" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12 col-md-6">
            <q-input outlined v-model="data.descripcion" label="Descripción" placeholder="Escribe una descripción" />
          </div>

          <div class="col-12 col-md-6">
            <q-select outlined v-model="data.tipo_metodo" :options="['Efectivo', 'Transferencia']" label="Tipo" />

          </div>

          <div class="col-12 col-md-6">
            <QSelectMoneda class="single-line-value-select error-mb" outlined v-model="data.moneda_id" clearable label="Moneda" required
              rule="Este campo es requerido." />
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

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const data = reactive({
  id: null,
  metodo: null,
  descripcion: null,
  moneda_id: null,
  tipo_metodo: null,
})

const handleSubmit = () => {

  isLoadingSubmit.value = true
  let postData = { ...data }

  if (data.id) {
    api.put('caja/metodos/' + data.id, postData)
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
    api.post('caja/metodos', postData)
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

const openDialog = (id) => {

  Object.keys(data).forEach((i) => {
    data[i] = null
  })

  if (id) {
    isLoadingSubmit.value = true
    api.get('caja/metodos/' + id)
      .then(response => {
        if (response.data) {
          Object.keys(response.data).forEach((i) => {
            if (data.hasOwnProperty(i)) {
              data[i] = response.data[i]
            }
          })

        }
      })
      .finally(() => {
        isLoadingSubmit.value = false
        dialog.value = true
      })
  } else {
    dialog.value = true
  }
}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
