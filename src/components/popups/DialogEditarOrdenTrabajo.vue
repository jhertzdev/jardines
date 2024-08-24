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
              <q-input dense outlined type="date" v-model="data.fecha_vencimiento" label="Fecha de vencimiento" stack-label />
            </div>
            <div class="col-12 col-sm-6 col-lg-3">
              <q-input dense outlined type="date" v-model="data.fecha_completado" label="Fecha completado" stack-label :readonly="data.estatus != 'Completado'" :disable="data.estatus != 'Completado'" />
            </div>
            <div class="col-12 col-sm-6 col-lg-2">
              <QSelectUbicacion dense outlined v-model="data.ubicacion_id" readonly :hide-bottom-space="true"/>
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
                  data.estatus = 'Pendiente';
                  data.fecha_completado = null;
                } else { data.estatus = 'En curso'; data.fecha_completado = null; }
              }"></q-select>
            </div>
            <div class="col-12 col-lg-2">
              <q-select dense outlined v-model="data.estatus" :options="[
                'Completado',
                'Pendiente',
                'En curso',
                'Vencido'
              ]" @update:model-value="val => val != 'Completado' ? data.fecha_completado = null : data.fecha_completado = format(new Date(), 'yyyy-MM-dd')" label="Estatus" stack-label emit-value map-options></q-select>
            </div>
            <div class="col-12">


              <template v-if="data.ubicacion?.tipo_parcela?.tipo_parcela">

                <div class="row q-col-gutter-md">
                  <div class="col-md-6" v-for="observacion in data.observaciones ?? []">

                    <q-card bordered flat style="width: 100%; max-width: 100%;">
                      <q-card-section class="q-py-sm">
                        <div class="text-h6">{{ observacion.title }}</div>
                      </q-card-section>

                      <q-separator />

                      <q-card-section class="q-py-sm q-gutter-y-sm">

                        <q-option-group
                          v-model="observacion.selectedOption"
                          :options="observacion.options.map(option => ({ label: option, value: option }))"
                          color="primary"
                          inline
                          dense
                        />

                        <template v-if="observacion.subOptions && observacion.selectedOption && observacion.subOptions[observacion.selectedOption]">
                          <q-separator />
                          <q-option-group
                            v-model="observacion.selectedSubOption"
                            :options="observacion.subOptions[observacion.selectedOption]?.map(option => ({ label: option, value: option }))"
                            color="primary"
                            inline
                            dense
                          />
                        </template>

                        <q-separator />

                        <q-input type="textarea" v-model="observacion.observacion" label="Observación:" stack-label autogrow />




                      </q-card-section>


                    </q-card>
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
    {
      title: 'Base',
      options: [
        'Concreto',
        'Mármol'
      ],
      subOptions: {
        Concreto: [
          'Bien',
          'Pintada',
          'Sin pintar',
          'Otro',
        ],
        Mármol: [
          'Bien',
          'Lijado',
          'Pulido',
          'Otro',
        ]
      },
      selectedOption: null,
      selectedSubOption: null,
    },
    {
      title: 'Fecha y nombres',
      options: [
        'Bien',
        'Identificados',
        'Deteriorado',
        'Pintados',
        'Otro',
      ],
      selectedOption: null,
    },
    {
      title: 'Fotos',
      options: [
        'Bien',
        'Deteriorado',
        'Sin foto',
        'Otro',
      ],
      selectedOption: null,
    },
    {
      title: 'Placas',
      options: [
        'Bien',
        'Deteriorado',
        'Sin placa',
        'Otro',
      ],
      selectedOption: null,
    },
    {
      title: 'Grama',
      options: [
        'Bien',
        'Nueva',
        'Regular',
        'Gris',
        'Sin grama',
      ],
      selectedOption: null,
    }
  ]
}

const handleSubmit = () => {
  if (data.value.estatus != 'Completado') {
    data.value.fecha_completado = null
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
          data.value.observaciones = JSON.parse(JSON.stringify(observacionesPorTipoUbicacion[data.value.ubicacion.tipo_parcela.tipo_parcela]))
        }
      }
    })
}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
