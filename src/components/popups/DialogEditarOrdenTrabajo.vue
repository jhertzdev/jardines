<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xxl">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section>
          <div class="text-h6">Orden de trabajo</div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6 col-lg-3">
              <q-input label="Mes asignado" dense outlined v-model="data.fecha_vencimiento" mask="####-##" :hide-bottom-space="true" readonly clearable>
                <template v-slot:append>
                  <q-icon v-if="data.fecha_vencimiento" name="close" class="cursor-pointer" @click="data.fecha_vencimiento = ''"></q-icon>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="data.fecha_vencimiento" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                        @update:model-value="filterDateClosePopup = true" @navigation="filterDateClosePopup = false">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6 col-lg-3">
              <q-input dense outlined type="date" v-model="data.fecha_completado" label="Fecha completado" stack-label :readonly="data.estatus != 'Completado'" :disable="data.estatus != 'Completado'" />
            </div>
            <div class="col-12 col-sm-6 col-lg-2">
              <QSelectUbicacion dense outlined v-model="data.ubicacion_id" :hide-bottom-space="true" clearable/>
            </div>
            <div class="col-12 col-sm-6 col-lg-2">
              <q-select dense outlined v-model="data.avance" :options="[
                {label: '100%', value: '100'},
                {label: '75%', value: '75'},
                {label: '50%', value: '50'},
                {label: '25%', value: '25'},
                {label: '0%', value: '0'},
              ]" label="Avance" stack-label emit-value map-options @update:model-value="val => {
                if (val == '100') {
                  data.estatus = 'Completado';
                  data.fecha_completado = format(new Date(), 'yyyy-MM-dd');
                } else if (val == '0') {
                  data.estatus = 'Por entregar';
                  data.fecha_completado = null;
                } else { data.estatus = 'Por ejecutar'; data.fecha_completado = null; }
              }"></q-select>
            </div>
            <div class="col-12">
              <q-input dense outlined v-model="data.notas" label="Notas internas" stack-label />
            </div>
            <div class="col-12 col-lg-2">
              <q-select dense outlined v-model="data.estatus" :options="[
                'Completado',
                'Por entregar',
                'Por ejecutar',
                'Vencido'
              ]" @update:model-value="val => val != 'Completado' ? data.fecha_completado = null : data.fecha_completado = format(new Date(), 'yyyy-MM-dd')" label="Estatus" stack-label emit-value map-options></q-select>
            </div>
            <div class="col-12">


              <template v-if="data.ubicacion?.tipo_parcela?.tipo_parcela">

                <h6 class="q-my-sm text-center">Observaciones</h6>

                <div class="row q-col-gutter-md">
                  <div :class="data.observaciones?.length > 3 ? 'col-md-6' : 'col-md-4'" v-for="observacion in data.observaciones ?? []">
                    <q-input dense type="textarea" outlined v-model="observacion.value" :label="observacion.title" stack-label autogrow />
                  </div>
                </div>

              </template>




            </div>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

import { format, getDate, getMonth, getYear, lastDayOfMonth } from 'date-fns';

import QSelectUbicacion from '../selects/QSelectUbicacion.vue';

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const data = ref({
  id: null,
})

const observacionesPorTipoUbicacion = {
  Parcela: [
    { title: 'Observación', value: ''},
    { title: 'Base', value: ''},
    { title: 'Placas / Fotos / Letras', value: ''},
    { title: 'Grama', value: ''}
  ],
  Nicho: [
    { title: 'Observación', value: ''},
    { title: 'Placas / Nombre', value: ''},
    { title: 'Foto', value: ''},
  ],
  Columbario: [
    { title: 'Observación', value: ''},
    { title: 'Placas / Nombre', value: ''},
    { title: 'Foto', value: ''},
  ]
}

const filterDateClosePopup = ref(false)

const handleSubmit = () => {
  if (data.value.estatus != 'Completado') {
    data.value.fecha_completado = null
  }

  if (data.value.fecha_vencimiento?.length < 10) {
    data.value.fecha_vencimiento = data.value.fecha_vencimiento + '-01'
  }

  api.post('mantenimiento/orden', data.value)
    .then(response => {
      if (response.data) {
        dialog.value = false
        $q.notify({ message: 'Actualizado exitosamente.', color: 'positive' })
        emit('updated', response.data)
      }
    })
    .catch(error => { console.log(error); qNotify(error, 'error', { callback: handleSubmit }) })
    .finally(() => isLoadingSubmit.value = false)

}

const openDialog = (id) => {
  dialog.value = true

  console.log('id', id)

  api.get(`mantenimiento/${id}`)
    .then(response => {
      if (response.data) {
        data.value = response.data
        data.value.fecha_vencimiento = data.value.fecha_vencimiento && new Date(data.value.fecha_vencimiento) != 'Invalid Date' ? format(data.value.fecha_vencimiento, 'yyyy-MM-dd') : null
        data.value.fecha_completado = data.value.fecha_completado && new Date(data.value.fecha_completado) != 'Invalid Date' ? format(data.value.fecha_completado, 'yyyy-MM-dd') : null

        if (!data.value.observaciones?.length) {
          console.log(response.data)
          data.value.observaciones = JSON.parse(JSON.stringify(observacionesPorTipoUbicacion[data.value.ubicacion.tipo_parcela.tipo_parcela]))
        }


        if (!data.value.observaciones?.length) {
          data.value.observaciones = JSON.parse(JSON.stringify(observacionesPorTipoUbicacion[data.value.ubicacion.tipo_parcela.tipo_parcela]))
        } else {
          let observacionesPlantilla = JSON.parse(JSON.stringify(observacionesPorTipoUbicacion[data.value.ubicacion.tipo_parcela.tipo_parcela]))

          observacionesPlantilla.forEach((obs, key) => {
            let rowObservacion = data.value.observaciones.find(o => o.title == obs?.title)
            if (rowObservacion?.value) {
              observacionesPlantilla[key].value = rowObservacion.value
            }
          })

          data.value.observaciones = observacionesPlantilla
        }

      }
    })
}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
