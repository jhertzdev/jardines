<style>
.grabado-marmol {
  text-align: center;
  position: relative;
  padding-bottom: 30px;
  z-index: 1;
}

.grabado-marmol .col {
  display: flex;
  flex-flow: column;
  justify-content: center;
}

.grabado-marmol textarea {
  resize: none !important;
}

.grabado-marmol:before {
  position: absolute;
  top: 0;
  left: 8px;
  width: calc(100% - 8px);
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  content: '';
  z-index: 0;
}

</style>
<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md" style="max-width: 800px" >
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section>
          <div class="text-h6">Servicio de grabado de mármol</div>
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="row">
            <div class="col-12 col-lg-6 offset-lg-3 q-mb-lg">
              <QSelectUbicacion class="q-mb-md" :filters="{ tipo_parcela: data.tipo_parcela }"
                dense outlined clearable required hide-bottom-space v-model="data.ubicacion_id"
                label="Selecciona una ubicación"
                :rules="[val => val && val > 0 || 'Debe seleccionar una ubicación']"
                @selected="(val) => handleSelectUbicacion(val)"
                />
            </div>
            <div class="col-12 q-mt-md" v-if="data.ubicacion_id">
              <div class="row grabado-marmol grabado-marmol-parcela q-pr-sm q-pl-md q-col-gutter-sm">
                <div class="col-12">
                  <div class="row q-col-gutter-sm">
                    <div class="col-auto q-gutter-sm flex justify-center q-pt-lg">
                      <q-radio dense v-model="data.tipo_cliente" val="Titular" label="Titular" @update:model-value="() => {
                        data.cliente_id = data.tipo_cliente == 'Titular' && data.ubicacion?.propietario_id || null
                      }" />
                      <q-radio dense v-model="data.tipo_cliente" val="Autorizado" label="Autorizado" @update:model-value="() => {
                        data.cliente_id = data.tipo_cliente == 'Titular' && data.ubicacion?.propietario_id || null
                      }" />
                    </div>
                    <div class="col">
                      <QSelectCliente class="q-mb-xl" dense outlined clearable required hide-bottom-space v-model="data.cliente_id" label="Selecciona un cliente" :disable="data.tipo_cliente == 'Titular'" />
                    </div>
                    <div class="col-12" v-if="data.tipo_cliente != 'Titular'">
                      <div class="text-right text-caption text-grey-6 q-mt-sm">
                        <span>¿El cliente no existe?</span>
                        <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary" @click="agregarClienteDialog.openDialog(null)" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col col-5 q-gutter-sm q-mt-xs">

                  <template v-if="data.ubicacion?.puestos?.length > 1">
                    <q-checkbox v-model="data.difuntos[0].selected" label="Primer puesto" style="justify-content: center" :disable="!parseInt(data.difuntos[0].difunto_id)" />
                    <template v-if="data.difuntos[0].selected">
                      <q-input class="q-mb-lg" type="textarea" rows="3" v-model="data.difuntos[0].nombre" dense outlined label="Nombre"/>
                      <q-input label="Fecha de nacimiento" type="date" dense outlined v-model="data.difuntos[0].fecha_nacimiento" >
                        <template v-slot:prepend>
                          <q-icon name="star" />
                        </template>
                      </q-input>
                      <q-input label="Fecha de muerte" type="date" dense outlined v-model="data.difuntos[0].fecha_muerte" >
                        <template v-slot:prepend>
                          <q-icon name="local_hospital" />
                        </template>
                      </q-input>
                    </template>
                  </template>
                </div>
                <div class="col col-2 q-mt-lg">
                  <q-badge class="text-h6" style="justify-content: center;">{{ data.codigo_parcela }}</q-badge>
                </div>
                <div class="col col-5 q-gutter-sm q-mt-xs">
                  <template v-if="data.ubicacion?.puestos?.length > 1">
                    <q-checkbox v-model="data.difuntos[1].selected" label="Segundo puesto" style="justify-content: center" :disable="!parseInt(data.difuntos[1].difunto_id)" />
                    <template v-if="data.difuntos[1].selected">
                      <q-input class="q-mb-lg" type="textarea" rows="3" v-model="data.difuntos[1].nombre" dense outlined label="Nombre" />
                      <q-input label="Fecha de nacimiento" type="date" dense outlined v-model="data.difuntos[1].fecha_nacimiento" >
                        <template v-slot:prepend>
                          <q-icon name="star" />
                        </template>
                      </q-input>
                      <q-input label="Fecha de muerte" type="date" dense outlined v-model="data.difuntos[1].fecha_muerte" >
                        <template v-slot:prepend>
                          <q-icon name="local_hospital" />
                        </template>
                      </q-input>
                    </template>
                  </template>
                </div>

                <div class="col-12" v-if="data.ubicacion?.puestos?.length == 1">
                  <template v-if="data.difuntos[0].selected">
                    <q-input class="q-mb-lg" type="textarea" rows="3" v-model="data.difuntos[0].nombre" dense outlined label="Nombre"/>
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-input label="Fecha de nacimiento" type="date" dense outlined v-model="data.difuntos[0].fecha_nacimiento" >
                          <template v-slot:prepend>
                            <q-icon name="star" />
                          </template>
                        </q-input>
                      </div>
                      <div class="col-6">
                        <q-input label="Fecha de muerte" type="date" dense outlined v-model="data.difuntos[0].fecha_muerte" >
                          <template v-slot:prepend>
                            <q-icon name="local_hospital" />
                          </template>
                        </q-input>
                      </div>
                    </div>
                  </template>
                </div>

                <div class="col-12 q-mt-md" v-if="data.ubicacion?.puestos?.length > 1">
                  <q-input type="textarea" rows="3" v-model="data.leyenda" dense outlined label="Leyenda" />
                  <div class="q-field__bottom text-right">
                    <div class="q-field__counter">{{ data.leyenda?.replace(/\s/g, "")?.length || 0 }} caracteres</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <DialogAgregarCliente ref="agregarClienteDialog" />
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

import QSelectUbicacion from 'src/components/selects/QSelectUbicacion.vue';
import QSelectCliente from 'src/components/selects/QSelectCliente.vue';

import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const agregarClienteDialog = ref(null)

const handleSelectUbicacion = (item) => {
  data.codigo_parcela = item?.codigo_parcela
  data.cliente_id = item?.propietario_id
  data.ubicacion = item

  item.puestos.forEach( (p, i) => {
    let difuntoData = item.puestos.find(p => p.indice == i)

    data.difuntos[i] = {
      indice: p.indice,
      difunto_id: difuntoData?.ocupante_id || null,
      puesto_id: difuntoData?.id || null,
      nombre: (difuntoData?.ocupante_nombre || '').toUpperCase(),
      selected: !!difuntoData.ocupante_id,
      fecha_nacimiento: (difuntoData?.fecha_nacimiento || '').substr(0, 10),
      fecha_muerte: (difuntoData?.fecha_muerte || '').substr(0, 10),
    }

  });

}

const data = reactive({
  id: 0,
  ubicacion_id: null,
  codigo_parcela: null,
  ubicacion: null,
  difuntos: [],
  leyenda: "",
  tipo_cliente: 'Titular',
  cliente_id: null,
})

const handleSubmit = () => {
  isLoadingSubmit.value = true

  let postData = {
    ubicacion_id: data.ubicacion_id,
    difuntos: data.difuntos.filter(d => d.selected),
    leyenda: data.leyenda,
    tipo_cliente: data.tipo_cliente,
    cliente_id: data.cliente_id,
  }

  if (data.id) {
    postData.id = data.id
  }

  console.log(postData)

  api.post('parcelas/marmol', postData)
    .then((response) => {
      console.log(response);
      qNotify("El servicio de grabado de mármol se ha guardado correctamente.");
      emit('updated', response.data);
      dialog.value = false
    })
    .catch(async (error) => {
      qNotify(error, "error", {
        callback: () => handleSubmit(),
      });
    })
    .finally(() => {
      isLoadingSubmit.value = false
    });
}

const openDialog = (params) => {
  data.id = params?.id
  data.ubicacion_id = params?.ubicacion_id
  data.tipo_parcela = params?.tipo_parcela

  data.codigo_parcela = params?.codigo_parcela
  data.ubicacion = null
  data.difuntos = []
  data.leyenda = ""
  data.tipo_cliente = 'Titular'
  data.cliente_id = null

  if (params?.id) {
    api.get('parcelas/marmol/' + params.id)
      .then(response => {
        if (response.data) {
          console.log(response.data)
          Object.keys(response.data).forEach((i) => {
            data[i] = response.data[i]
          })
        }
        dialog.value = true
      })
      .catch(error => qNotify(error, 'error', { callback: () => openDialog(params) }))
  } else {
    dialog.value = true
  }


}

defineExpose({ openDialog })
const emit = defineEmits(['updated'])

</script>
