<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog">
    <q-card class="q-pa-md scroll">
      <template v-if="isLoadingSubmit">
        <div class="text-center">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
      <q-form ref="actualizarFechasForm" @submit="handleSubmitActualizarFechas" v-else @keyup.enter="handleSubmitActualizarFechas">
        <q-card-section>
          <div class="text-h6">Actualizar fechas</div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <q-table class="q-mb-lg" :columns="[
            { name: 'codigo_parcela', label: 'Ubicación', field: 'codigo_parcela', sortable: false, align: 'center' },
            { name: 'pagado_hasta', label: 'Pagado hasta', field: 'pagado_hasta', sortable: false, align: 'center' },
          ]" :rows="props.rows" row-key="id" separator="cell"
            :pagination="{rowsPerPage: -1}" hide-bottom
          >
            <template v-slot:body-cell-pagado_hasta="props">
              <q-td :props="props">
                <q-input type="date"
                  dense outlined
                  v-model="props.row.nuevo_pagado_hasta"
                  @update:model-value="handleUpdateFecha(props.row.nuevo_pagado_hasta)" clearable />
              </q-td>
            </template>
          </q-table>
          <q-checkbox v-model="actualizarTodasFechas" label="Actualizar todas las fechas" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Actualizar fechas" icon="event" :loading="isLoadingSubmit" @click="actualizarFechasForm.submit()"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { qNotify } from 'src/boot/jardines'
import { format } from 'date-fns'
import { api } from 'src/boot/axios'

const $q = useQuasar()
const dialog = ref(false)

const actualizarFechasForm = ref(null)
const actualizarTodasFechas = ref(true)

const props = ref(null)

const isLoadingSubmit = ref(false)
const openDialog = (params = null) => {

  params.rows?.map(row => {
    row.nuevo_pagado_hasta = row.pagado_hasta && new Date(row.pagado_hasta) != 'Invalid Date' ? format(row.pagado_hasta, 'yyyy-MM-dd') : null
    return row
  })

  console.log(params)

  props.value = params

  console.log(params.rows)
  dialog.value = true
}

const handleUpdateFecha = (fecha) => {
  if (actualizarTodasFechas.value) {
    props.value?.rows?.forEach(ubicacion => {
      ubicacion.nuevo_pagado_hasta = fecha
    })
  }
}

const handleSubmitActualizarFechas = () => {

  if (!props.value?.contrato_id) {
    qNotify('Debes seleccionar un contrato.', 'error')
    return
  }

  if (!props.value?.rows?.length) {
    qNotify('Debes seleccionar al menos una ubicación.', 'error')
    return
  }

  isLoadingSubmit.value = true

  let postData = props.value.rows.map(ubicacion => {
    return {
      ubicacion_id: ubicacion.id,
      contrato_id: props.value.contrato_id,
      nuevo_pagado_hasta: ubicacion.nuevo_pagado_hasta,
    }
  })

  api.post('contratos/' + props.value.contrato_id + '/actualizarFechas', postData)
    .then(response => {
      if (response.data) {
        dialog.value = false
        emit('updated', response.data)
        $q.notify({ message: 'Fechas actualizadas exitosamente.', color: 'positive' })
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitActualizarFechas))
    .finally(() => isLoadingSubmit.value = false)
}

const emit = defineEmits(['updated'])

defineExpose({ openDialog })

</script>
