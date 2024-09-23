<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section>
          <div class="text-h6">{{ data.title || 'Editar notas' }}</div>
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-input dense v-model="data.notas" outlined type="textarea" label="Notas" stack-label autogrow />
        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const data = reactive({
  id: 0,
  endpoint: '',
  notas: '',
  title: '',
})

const handleSubmit = () => {
  let postData = {
    id: data.id,
    endpoint: data.endpoint,
    notas: data.notas,
  }

  api.post('pages/editarNotas', postData)
    .then((response) => {
      console.log(response);
      qNotify(response.data, "success");
      emit('updated', response.data);
      dialog.value = false
    })
    .catch(async (error) => {
      qNotify(error, "error", {
        callback: () => handleSubmit(),
      });
    });
}

const openDialog = (id, endpoint, notas = '', title = '') => {
  data.id = id
  data.endpoint = endpoint
  data.notas = notas
  data.title = title
  dialog.value = true
}

defineExpose({ openDialog })
const emit = defineEmits(['updated'])

</script>
