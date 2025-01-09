<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" class="no-bottoms" :class="isLoadingSubmit && 'form-disabled'">
        <q-card-section>
          <div class="flex justify-between items-center q-gutter-sm">
            <span class="text-h6">Notas</span>
            <span class="text-grey-8 text-right" v-if="clienteData?.nombre_completo">
              {{ clienteData.nombre_completo }}
            </span>
          </div>
        </q-card-section>
        <q-card-section>
          <q-chat-message
            :name="`<span class='q-badge text-${getColorFromStatus(data.estatus)} bg-transparent font-bold' style='font-size: 0.65rem'>${data.estatus} • <span class='text-grey-8'>${data.nombre_completo}</span></span>`"
            name-html
            :text="[data.nota]"
            :stamp="format(new Date(data.fecha_creado), 'dd/MM/yyyy h:m aaaa')"
            :bg-color="`${getColorFromStatus(data.estatus)}-1`"
            v-if="data?.id"
            :key="'nota' + index"
          ></q-chat-message>


          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-select dense outlined :options="[
                'Contactado',
                'No contactado',
                'Respondido'
              ]" v-model="data.estatus" label="Estatus"></q-select>
            </div>
            <div class="col-8">
              <q-input dense outlined type="datetime-local" v-model="data.fecha_creado" label="Fecha de contacto" required :rules="[val => !!val || '']" hide-bottom></q-input>
            </div>
            <div class="col-12">
              <q-input dense outlined type="textarea" rows="2" v-model="data.nota" placeholder="Escribe más detalles sobre la nota" autofocus ref="detallesNotaTextarea" label="Notas" required :rules="[val => !!val || 'Debes escribir una nota']"></q-input>
            </div>
            <div class="col-12 text-right">
              <q-btn type="submit" :icon="data.id ? 'save' : 'add'" :label="data.id ? 'Guardar' : 'Agregar'" color="primary" :loading="isLoadingSubmit" :disable="isLoadingSubmit" />
            </div>
          </div>

          <q-separator class="q-my-md"/>

          <template v-if="isLoadingNotas">
            <div class="text-center">
              <q-spinner size="xl" color="primary" />
            </div>
          </template>

          <template v-else>
            <div style="max-height: 300px; overflow-y: auto;">
              <q-chat-message
                :name="`<span class='q-badge text-${getColorFromStatus(nota.estatus)} bg-transparent font-bold' style='font-size: 0.65rem'>${nota.estatus} • <span class='text-grey-8'>${nota.nombre_completo}</span></span>`"
                name-html
                :text="[nota.nota]"
                :stamp="format(new Date(nota.fecha_creado), 'dd/MM/yyyy HH:mm aaaa')"
                :bg-color="`${getColorFromStatus(nota.estatus)}-1`"
                v-for="(nota, index) in notas"
                :key="'nota' + index"
              >
              <template v-slot:avatar>
                <q-btn-dropdown dense dropdown-icon="more_horiz" flat color="primary" size="sm" class="q-mr-sm">
                  <q-list>
                    <q-item clickable v-close-popup @click="() => { handleClickEditarNota(nota) }">
                      <q-item-section side class="q-pr-sm">
                        <q-icon name="edit" size="xs" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Editar</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup @click="() => { handleEliminarNota(nota.id) }">
                      <q-item-section side class="q-pr-sm">
                        <q-icon name="delete" size="xs" color="negative" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Eliminar</q-item-label>
                      </q-item-section>
                    </q-item>

                  </q-list>
                </q-btn-dropdown>
              </template>
              </q-chat-message>

              <div v-if="!notas.length">
                <div class="text-center text-grey-8">No hay notas.</div>
              </div>
            </div>
          </template>


        </q-card-section>

      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';
import { useAuthStore } from 'src/stores/auth.store';
import { format } from 'date-fns';

const $q = useQuasar()
const dialog = ref(false)

const notas = ref([])
const detallesNotaTextarea = ref(null)

const handleClickEditarNota = (nota) => {
  data.value = JSON.parse(JSON.stringify(nota))
  setTimeout(() => {
    detallesNotaTextarea.value.focus()
  }, 100)
}

const handleEliminarNota = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Eliminar nota',
      message: '¿Estás seguro de que quieres eliminar esta nota?',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Eliminar',
        color: 'primary',
        flat: true,
        icon: 'delete'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      handleEliminarNota(id, true)
    })
  } else {
    isLoadingSubmit.value = true
    api.delete('clientes/eliminarNota/' + id)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
          openDialog(data.value.cliente_id, clienteData.value)
          emit('updated', response.data)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEliminarNota(id) }))
      .finally(() => isLoadingSubmit.value = false)
  }
}

const isLoadingSubmit = ref(false)
const isLoadingNotas = ref(true)

const getColorFromStatus = (estatus) => {
  let colors = {
    'Contactado': 'blue',
    'No contactado': 'red',
    'Respondido': 'green',
  }

  return colors[estatus] || 'grey'
}

const data = ref({
  cliente_id: null,
  estatus: 'Contactado',
  nota: '',
  fecha_creado: null,
})

const handleSubmit = () => {
  isLoadingSubmit.value = true

  api.post(`clientes/${data.value.cliente_id}/notas`, data.value)
    .then(response => {
      if (response.data) {
        $q.notify({ message: 'Nota agregada exitosamente.', color: 'positive' })
        openDialog(data.value.cliente_id, clienteData.value)

        if (data.value.id) emit('updated', response.data)
        else emit('created', response.data)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => {
      isLoadingSubmit.value = false
    })
}

const clienteData = ref({})

const openDialog = (clienteId, info = null) => {
  data.value = {
    cliente_id: clienteId,
    estatus: 'Contactado',
    nota: '',
    fecha_creado: format(new Date(), 'yyyy-MM-dd HH:mm'),
  }

  clienteData.value = info

  getNotasCliente(data.value.cliente_id)

  dialog.value = true;
}

const getNotasCliente = (clienteId) => {
  isLoadingNotas.value = true;

  api.get('clientes/' + clienteId + '/notas')
  .then(response => {
    console.log('clientes/' + clienteId + '/notas')
    console.log(response)
    if (response.data) {
      notas.value = response.data
    }
  })
  .catch(error => qNotify(error, 'error'))
  .finally(() => isLoadingNotas.value = false)

}

defineExpose({ openDialog })
const emit = defineEmits(['created', 'updated'])

</script>
