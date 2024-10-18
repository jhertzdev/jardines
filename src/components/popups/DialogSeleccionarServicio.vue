<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card>
      <q-card-section>
        <div class="text-h6">Seleccionar servicio</div>
      </q-card-section>
      <q-card-section>

        <q-banner class="bg-red-3 q-pb-md q-mb-lg" v-if="servicioSeleccionado && serviciosDisponibles.find(servicio => servicio.id == servicioSeleccionado).estatus == 'Completado'">
          <template v-slot:avatar>
            <q-icon class="q-mt-sm" name="warning" color="black" />
          </template>
          <div class="row">
            <div class="col-12">
              <div class="text-h6">Servicio completado</div>
              <p>El servicio seleccionado está marcado como completado. Puedes elegir modificar el servicio seleccionado o crear uno nuevo.</p>
            </div>
            <div class="col-12 q-gutter-sm">
              <q-btn type="button" color="primary" label="Crear nuevo" icon="add" @click="agregarEditarServicioDialog.openDialog(null, ocupanteData)" />
              <q-btn type="button" color="primary" label="Editar seleccionado" icon="edit" @click="agregarEditarServicioDialog.openDialog(servicioSeleccionado, ocupanteData)" />
            </div>
          </div>
          <template v-slot:action>
          </template>
        </q-banner>

        <q-markup-table>
          <thead>
            <tr>
              <th></th>
              <th>Tipo</th>
              <th class="text-left">Fecha</th>
              <th class="text-left">Hora</th>
              <th class="text-left">Difunto</th>
              <th class="text-left">Estatus</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="servicio in serviciosDisponibles" :key="servicio.id">
              <td>
                <q-radio v-model="servicioSeleccionado" :val="servicio.id" @update:model-value="val => val ? servicio.id : null" />
                <template v-if="servicio.id == servicioSeleccionado">
                  <q-btn dense flat size="sm" icon="close" color="negative" @click="servicioSeleccionado = null"></q-btn>
                </template>
              </td>
              <td class="text-center">
                <q-badge :label="servicio.clase_servicio" />
                <template v-if="servicio.tipo_servicio">
                  <div style="font-size: .6rem; letter-spacing: -0.25px;">{{ servicio.tipo_servicio }}</div>
                </template>
              </td>
              <td>{{ servicio.fecha_servicio }}</td>
              <td>{{ servicio.hora_servicio }}</td>
              <td>{{ servicio.difunto || '-'}}</td>
              <td><q-badge :color="classEstatus[servicio.estatus]" :label="servicio.estatus" /></td>
            </tr>
            <tr>
              <td>
                <q-radio v-model="servicioSeleccionado" :val="0" @update:model-value="val => 0" />
              </td>
              <td colspan="5" class="text-center text-italic text-primary text-bold">-- Crear nuevo servicio --</td>
            </tr>
          </tbody>
        </q-markup-table>

      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn label="Continuar" icon="arrow_forward" color="primary" @click="agregarEditarServicioDialog.openDialog(servicioSeleccionado, ocupanteData)" :disabled="servicioSeleccionado == undefined"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <DialogAgregarEditarServicio ref="agregarEditarServicioDialog" @updated="handleUpdatedServicio"/>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';
import DialogAgregarEditarServicio from 'src/components/popups/DialogAgregarEditarServicio.vue';

const dialog = ref(false)
const serviciosDisponibles = ref([])
const servicioSeleccionado = ref(null)
const ocupanteData = ref({})

const agregarEditarServicioDialog = ref(null)

const classEstatus = {
  'Pendiente': 'yellow-9',
  'Completado': 'primary',
}

const dialogCallback = ref(null)

const openDialog = (parameters = {}, callback = null) => {
  servicioSeleccionado.value = null
  serviciosDisponibles.value = parameters.servicios || []
  ocupanteData.value = parameters.data || {}
  dialog.value = true
  dialogCallback.value = callback
}

const handleUpdatedServicio = () => {
  dialog.value = false;
  if (dialogCallback.value != null) dialogCallback.value()
}

defineExpose({ openDialog })
const emit = defineEmits(['updated'])

</script>
