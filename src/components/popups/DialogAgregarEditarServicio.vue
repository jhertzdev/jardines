<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card>
      <q-form @submit="handleSubmit">
        <q-card-section>
          <div class="text-h6">{{ data.id ? 'Editar servicio' : 'Agregar servicio' }}</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-select dense v-model="data.clase_servicio" outlined label="Categoría de servicio"
              :options="['Inhumación', 'Exhumación', 'Cremación']"
              @update:model-value="(val) => {
                if (val == 'Cremación') data.ubicacion_id = null
              }" lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona una categoría']" hide-hint hide-bottom-space></q-select>
            </div>
            <div class="col-6">
              <QSelectUbicacion dense v-model="data.ubicacion_id" outlined
                :disable="!data.clase_servicio || data.clase_servicio == 'Cremación'"
                @selected="handleSelectUbicacion" clearable required lazy-rules="true" :rules="[val => val > 0 || ' ']"
              />
            </div>
            <div class="col-6">
              <q-input dense v-model="data.tipo_contrato" outlined label="Tipo de contrato" readonly />
            </div>
            <div class="col-6">
              <q-select dense v-model="data.tipo_servicio" outlined label="Tipo de servicio"
                :options="['1er Cuerpo', '2do Cuerpo']" :disable="data.tipo_contrato != 'Parcela'"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona un tipo de servicio']" hide-bottom-space></q-select>
            </div>
            <div class="col-4">
              <q-input dense type="date" v-model="data.fecha_servicio" outlined label="Fecha"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona una fecha']" hide-bottom-space />
            </div>
            <div class="col-4">
              <q-input dense type="time" v-model="data.hora_servicio" outlined label="Hora" step="60"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona una hora']" hide-bottom-space/>
            </div>
            <div class="col-4">
              <q-select dense v-model="data.estatus" outlined label="Estatus" :options="['Pendiente', 'Completado']"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Selecciona un estatus']" hide-hint hide-bottom-space></q-select>
            </div>
            <div class="col-4">
              <q-input dense v-model="data.num_contrato" outlined label="Núm. contrato" lazy-rules="true" :rules="[val => val && val.length > 0 || '']" hide-bottom-space/>
              <div style="font-size: 10px;" v-if="data.contratos?.length" class="q-mt-xs">
                <q-btn size="sm" dense outline color="primary" v-for="num_contrato in data.contratos" @click="data.num_contrato = num_contrato">{{ num_contrato }}</q-btn>
              </div>
            </div>
            <div class="col-8">
              <q-input dense v-model="data.difunto" outlined label="Nombre del difunto"
                lazy-rules="true" :rules="[val => val && val.length > 0 || 'Escribe del nombre del difunto/a']" hide-bottom-space/>
            </div>
            <div class="col-12">
              <q-input dense outlined type="textarea" rows="2" label="Observaciones" v-model="data.observaciones"></q-input>
            </div>
            <div class="col-12" v-if="data.tipo_contrato && data.tipo_contrato != 'Cremación'">
              <q-checkbox v-model="data.incluir_mantenimiento" label="Incluir en mantenimiento del mes" />
              <q-checkbox v-model="data.entrega_parcela" :label="'Hace entrega de ' + data.tipo_contrato?.toLowerCase()"  />
            </div>

          </div>

        </q-card-section>
        <q-card-actions align="right">
          <q-btn type="button" label="Cerrar" flat @click="showDialogAgregarServicio = false" />
          <q-btn type="submit" :label="data.id ? 'Editar' : 'Agregar'" color="primary" :loading="isLoadingSubmit"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

// Components
import QSelectUbicacion from 'src/components/selects/QSelectUbicacion.vue';

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const data = ref({
  incluir_mantenimiento: false,
  entrega_parcela: false
})

const handleSelectUbicacion = (val) => {
  data.value.tipo_contrato = val?.tipo_parcela?.tipo_parcela;

  if (!val || val?.tipo_parcela?.tipo_parcela == 'Cremación') {
    data.value.tipo_servicio = null
    data.value.incluir_mantenimiento = false
    data.value.entrega_parcela = false
  }
}

const params = ref({})

const openDialog = (id = null, parameters = {}) => {

  if (id) {
    api.get('parque/servicios/' + id).then((response) => {
      data.value = response.data
      loadDataFromParams(parameters)
      dialog.value = true
    })
  } else {
    loadDataFromParams(parameters)
    dialog.value = true
  }

}

const loadDataFromParams = (parameters) => {
  if (parameters.fecha_asignado) {
    data.value.fecha_servicio = parameters.fecha_asignado.substr(0, 10)
    data.value.hora_servicio = parameters.fecha_asignado.substr(11, 5)
  }

  if (parameters.difunto_id) {
    api.get('clientes/' + parameters.difunto_id)
      .then(response => {
        if (response.data) {
          console.log(response.data);
          data.value.difunto = response.data.nombre_completo
        }
      })
  }

  if (parameters.contratos?.length) {
    data.contratos = parameters.contratos
    if (parameters.contratos.length == 1) {
      data.value.num_contrato = parameters.contratos[0]
    }
  }

  if ( (parameters.tipo_servicio?.toUpperCase() || '') == '2DO CUERPO' && parameters.difuntos.length) {
    data.value.observaciones = '(1er Cuerpo): ' + parameters.difuntos[0].ocupante_nombre
  }

  ['clase_servicio', 'tipo_servicio', 'tipo_contrato', 'ubicacion_id'].forEach(key => {
    if (parameters[key]) data.value[key] = parameters[key]
  });

  params.value = parameters
}

const handleSubmit = () => {
  isLoadingSubmit.value = true;

  api.post('parque/servicios', data.value).then((response) => {
    qNotify('Servicio guardado', 'positive')
    data.value = {
      incluir_mantenimiento: false,
      entrega_parcela: false
    }

    dialog.value = false
    emit('updated', data.value)
  })
  .catch((error) => {
    console.log(error);
    qNotify(error, 'error')
  })
  .finally(() => {
    isLoadingSubmit.value = false;
  });

}

defineExpose({ openDialog })
const emit = defineEmits(['updated'])

</script>
