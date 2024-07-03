<template>
  <!-- Crear cliente -->
  <q-dialog v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section>
          <div class="text-h6">Agregar cuenta o banco</div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-sm">
          <div class="col-12 col-md-5">
            <q-input outlined v-model="data.nombre_cuenta" label="Nombre de la cuenta" placeholder="Escribe el nombre de la cuenta o banco" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12 col-md-7">
            <q-input outlined v-model="data.numero_cuenta" label="Número de cuenta" placeholder="Escribe el número de la cuenta o correo" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12 col-md-5">
            <QSelectMoneda class="single-line-value-select error-mb" outlined v-model="data.moneda_id" clearable label="Moneda" required
              rule="Este campo es requerido." />
          </div>

          <div class="col-12 col-md-7">
            <QSelectMetodosPago class="error-mb" outlined multiple v-model="data.metodos_permitidos" clearable label="Métodos de pago permitidos" />
          </div>

          <div class="col-12">
            <q-input type="textarea" class="no-resize" outlined v-model="data.notas" rows="2" label="Notas" placeholder="Escribe condiciones o detalles adicionales para el uso de la cuenta" clearable/>
          </div>

          <div class="col-12 text-right">
            <q-checkbox v-model="data.disponible" true-value="1" false-value="0" label="Marcar como disponible" />
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
  nombre_cuenta: null,
  numero_cuenta: null,
  disponible: null,
  moneda_id: null,
  metodos_permitidos: null,
  notas: null,
})

const handleSubmit = () => {

  
  isLoadingSubmit.value = true
  let postData = { ...data }
  
  if (data.id) {
    api.put('caja/bancos/' + data.id, postData)
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
    api.post('caja/bancos', postData)
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
    data[i] = (i === 'metodos_permitidos') ? [] :
      (i === 'disponible' ? '1' : null)
  })

  if (id) {
    isLoadingSubmit.value = true
    api.get('caja/bancos/' + id)
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
