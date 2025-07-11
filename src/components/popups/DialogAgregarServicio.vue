<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section>
          <div class="text-h6">Agregar servicio o producto</div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-md">



          <div class="col-12">
            <q-input outlined v-model="data.nombre_producto" label="Nombre del servicio" placeholder="Escribe el nombre del servicio o producto" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              outlined
              v-model="data.tipo_producto"
              clearable label="Tipo de producto"
              :options="tiposProductos"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              outlined
              v-model="data.tipo_ubicacion"
              clearable label="Tipo de ubicación"
              :options="['Parcela', 'Nicho', 'Columbario']"
            />
          </div>

          <div class="col-12">
            <q-input type="textarea" class="no-resize" outlined v-model="data.descripcion" rows="2" label="Descripción" placeholder="Escribe la descripción de este servicio (aparecerá en los recibos)" clearable/>
          </div>

          <div class="col-12 col-md-7">
            <QSelectEmpresa outlined v-model="data.empresa_id" clearable label="Empresa"/>
          </div>

          <div class="col-12 col-md-5">
            <q-input outlined v-model="data.precio_ref" type="number" label="Precio" placeholder="Escribe el precio de referencia" />
          </div>


          <div class="col-12 col-md-6 q-mt-md">
            <q-checkbox v-model="data.requiere_impuestos" true-value="R" :false-value="null" label="Requerir factura" />
          </div>

          <div class="col-12 col-md-6 q-mt-md">
            <q-checkbox v-model="data.requiere_ubicaciones" true-value="1" false-value="0" label="Requiere ubicaciones" />
          </div>

          <div class="col-12 col-md-6 q-mt-md">
            <q-checkbox v-model="data.pagable_cuotas" true-value="1" false-value="0" label="Permitir pago por cuotas" />
          </div>

          <div class="col-12 col-md-6 q-mt-md" v-if="parseInt(data.pagable_cuotas)">
            <q-input outlined v-model="data.cantidad_cuotas" label="Cantidad de cuotas" placeholder="Escribe la cantidad de cuotas" lazy-rules
              :rules="[val => val && val.length > 0 || '']" />
          </div>

          <div class="col-12 col-md-6 q-mt-md">
            <q-checkbox v-model="data.disponible" true-value="1" false-value="0" label="Mostrar en calculadora" />
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

<style >
.q-checkbox__label.q-anchor--skip {
  font-size: 12px;
}
</style>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { qNotify, $dinero } from 'src/boot/jardines';
// Components
import QSelectMoneda from 'src/components/selects/QSelectMoneda.vue'
import QSelectEmpresa from 'src/components/selects/QSelectEmpresa.vue';
import QSelectMetodosPago from 'src/components/selects/QSelectMetodosPago.vue'
import { useAppStore } from 'src/stores/app.store';

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)
const appStore = useAppStore()

const data = reactive({
  id: null,
  nombre_producto: null,
  tipo_producto: null,
  tipo_ubicacion: null,
  descripcion: null,
  precio_ref: null,
  requiere_impuestos: null,
  incluye_iva: null,
  disponible: null,
  gestiona_stock: null,
  requiere_ubicaciones: null,
  pagable_cuotas: null,
  cantidad_cuotas: null,
  empresa_id: null,
})

const handleSubmit = () => {


  isLoadingSubmit.value = true
  let postData = { ...data }

  if (data.id) {
    api.put('servicios/' + data.id, postData)
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
    api.post('servicios', postData)
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

    switch (i) {
      case 'disponible':
        data[i] = '1';
        break;
      case 'gestiona_stock':
        data[i] = '0';
        break;
      case 'pagable_cuotas':
        data[i] = '0';
        break;
      case 'incluye_iva':
        data[i] = '0';
        break;
      case 'requiere_impuestos':
        data[i] = null;
      default:
        break;
    }

  })

  if (id) {
    isLoadingSubmit.value = true
    api.get('servicios/' + id)
      .then(response => {
        console.log(response)
        if (response.data) {
          Object.keys(response.data).forEach((i) => {
            if (data.hasOwnProperty(i)) {
              data[i] = response.data[i]
            }
          })

          data.precio = parseFloat(appStore.getPrecioProducto(data).toFixed(2))

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

const tiposProductos = [
  'Gastos administrativos',
  'Costos de apertura / cierre',
  'Propiedad / Venta',
  'Mantenimiento',
  'Servicio general',
  'Cremación',
]

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
