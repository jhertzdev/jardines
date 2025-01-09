<template>
  <!-- Crear cliente -->
  <q-dialog v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" >
        <q-card-section>
          <div class="text-h6">
            <q-icon name="notifications" size="sm" color="primary"></q-icon> {{ !!parseInt(data.id) ? 'Editar' : 'Crear' }} notificación
          </div>
        </q-card-section>
        <q-card-section>
          <div class="row">
            <div class="col-12">
              <q-input type="textarea" v-model="data.message" label="Mensaje" autogrow :rules="[val => !!val || '* Requerido']" outlined hint="Puedes agregar enlaces a contratos usando la estructura: {Contrato:Tipo|####}. Por ejemplo, {Contrato:Parcela|1234} se convierte en un enlace al contrato #1234 de parcelas." autofocus/>
            </div>
            <div class="col-12 text-right q-mt-md">
              <q-checkbox v-model="data.importance" true-value="1" false-value="0" label="Importante" />
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="justify-end q-pt-md" style="border-top: 1px solid #eee">
          <q-btn flat label="Cancelar" />
          <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch} from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { useAppStore } from 'src/stores/app.store';
import { qNotify } from "src/boot/jardines";

const $q = useQuasar()
const appStore = useAppStore()
const isLoadingSubmit = ref(false)

const dialog = ref(false)
const data = ref({
  id: null,
  message: null,
  importance: "0",
})

const openDialog = (id = null) => {
  if (id) {
    api.get('notificaciones')
      .then(response => {
        if (response.data?.notificaciones?.length) {
          let notificacion = response.data.notificaciones.find(n => n.id == id)
          if (notificacion) {
            Object.keys(data.value).forEach((i) => {
              if (data.value.hasOwnProperty(i)) {
                data.value[i] = notificacion[i]
              }
            })

            delete data.value.created_at

            return dialog.value = true
          }
        }

        $q.notify({
          message: 'No se encontró la notificación.',
          color: 'negative',
          icon: 'warning',
        })
      })
      .catch(e => console.log(e))
  } else {
    data.value = {
      id: null,
      message: null,
      importance: "0",
      created_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().replace('T', ' ').substring(0, 19)
    }

    dialog.value = true
  }
}

const handleSubmit = () => {
  isLoadingSubmit.value = true
  let postData = { ...data.value }

  console.log(postData)

  api.post('notificaciones', postData)
    .then(response => {
      if (response.data) {
        dialog.value = false
        appStore.getNotificaciones()
        $q.notify({ message: 'Guardado exitosamente.', color: 'positive' })
      }
    })
    .catch(error => qNotify(error, 'error', { callback: handleSubmit }))
    .finally(() => isLoadingSubmit.value = false)
  }


defineExpose({ openDialog })
</script>
