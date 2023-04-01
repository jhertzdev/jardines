<template>
  <!-- Crear cliente -->
  <q-dialog v-model="dialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" class="no-bottoms" :class="isLoadingSubmit && 'form-disabled'">
        <q-card-section>
          <div class="text-h6">Agregar cliente</div>
        </q-card-section>
        <q-stepper flat v-model="step" vertical ref="stepper" color="primary" animated header-nav>
          <q-step :name="1" title="Información básica" icon="person" done-icon="person" active-icon="person"
            :done="step > 1">
            <div class="row q-col-gutter-sm">
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.nombre" label="Nombre *" lazy-rules
                  :rules="[val => val && val.length > 0 || '']" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.apellido" label="Apellido *" lazy-rules
                  :rules="[val => val && val.length > 0 || '']" />
              </div>
              <div class="col-sm-5 col-4">
                <q-select outlined v-model="data.doc_identidad" :options="tiposDocIdentidad" label="Documento" clearable
                  @clear="data.doc_numero = null" />
              </div>
              <div class="col-sm-7 col-8">
                <q-input outlined v-model="data.doc_numero" label="Núm. identidad" lazy-rules
                  :rules="[val => val && val.length > 0 || '']" :disable="!data.doc_identidad"
                  :class="!data.doc_identidad && 'bg-grey-3'" />
              </div>
              <div class="col-12">
                <q-select outlined v-model="data.tipo_cliente" :options="tiposCliente" label="Tipo de cliente *" clearable
                  lazy-rules :rules="[val => val && val.length > 0 || '']" />
              </div>
            </div>
          </q-step>
          <q-step name="2" title="Información de contacto" icon="contact_phone" done-icon="contact_phone"
            active-icon="contact_phone" :done="step > 2">
            <div class="row q-col-gutter-sm">
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.pais" label="País" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.estado" label="Estado" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.ciudad" label="Ciudad" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.email" label="Email" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.telefono_principal" label="Teléfono principal" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.telefono_secundario" label="Teléfono secundario" />
              </div>
              <div class="col-12">
                <q-input outlined v-model="data.direccion_habitacion" label="Dirección de habitación" />
              </div>
            </div>
          </q-step>
          <q-step name="3" title="Información laboral" icon="work" done-icon="work" active-icon="work" :done="step > 3">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input outlined v-model="data.nombre_empresa" label="Nombre de la empresa" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.rif_empresa" label="RIF (empresa)" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input outlined v-model="data.puesto_empresa" label="Posición / Cargo" />
              </div>
              <div class="col-12">
                <q-input outlined v-model="data.direccion_trabajo" label="Dirección de trabajo" />
              </div>
            </div>
          </q-step>
          <q-step name="4" title="Información adicional" icon="person_add" done-icon="person_add" active-icon="person_add"
            :done="step > 4">
            <div class="row q-col-gutter-sm">
              <div class="col-sm-6 col-12">
                <q-input type="datetime-local" stack-label outlined v-model="data.fecha_nacimiento"
                  label="Fecha de nacimiento" />
              </div>
              <div class="col-sm-6 col-12">
                <q-input type="datetime-local" stack-label outlined v-model="data.fecha_muerte" label="Fecha de muerte" />
              </div>
              <div class="col-md-4 col-12">
                <q-select :options="['Soltero/a ', 'Casado/a', 'Divorciado/a', 'Viudo/a']" outlined
                  v-model="data.estado_civil" label="Estado civil" clearable />
              </div>
              <div class="col-md-4 col-12">
                <q-input outlined v-model="data.religion" label="Religión" />
              </div>
              <div class="col-md-4 col-12">
                <q-select :options="['Masculino', 'Femenino']" outlined v-model="data.genero" label="Género" clearable />
              </div>
            </div>
          </q-step>
          <q-step name="5" title="Relaciones y parentesco" icon="family_restroom" done-icon="family_restroom"
            active-icon="family_restroom" :done="step > 5">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <table class="full-width text-center j-table" v-if="data.relaciones.length">
                  <thead>
                    <tr>
                      <th style="width: 35%">Es...</th>
                      <th style="width: 20%">(relación)</th>
                      <th style="width: 35%">...de</th>
                      <th style="width: 10%"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(contacto, index) in data.relaciones">
                      <td>{{ contacto.relacion.nombre_completo }}
                        <template v-if="contacto.relacion.num_identidad">
                          <br/> ({{contacto.relacion.num_identidad }})
                        </template>
                        <br/>
                      </td>
                      <td>
                        <q-badge color="primary">{{ contacto.tipo_relacion }}</q-badge>
                      </td>
                      <td>{{ contacto.cliente.nombre_completo }}
                        <template v-if="contacto.cliente.num_identidad">
                          <br/> ({{contacto.cliente.num_identidad }})
                        </template>
                        <br/>
                      </td>
                      <td>
                        <q-btn dense size="sm" class="btn-eliminar-item" icon="delete" outline
                          color="negative" @click="handleEliminarRelacion(index)" :loading="isLoadingEliminarRelacion" />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-else class="text-center q-pt-lg text-grey">No hay relaciones registradas.</p>
              </div>
              <div class="col-12 text-center q-pa-lg">
                <q-btn icon="add" label="Agregar relación" color="primary" @click="dialogAgregarRelacion = true"/>
              </div>
            </div>
          </q-step>
        </q-stepper>


        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="dialogAgregarRelacion" class="j-dialog">
    <q-card class="q-pa-md">
      <q-form @submit="handleAgregarRelacion" :class="isLoadingSubmitRelacion && 'form-disabled'">
        <q-card-section>
          <div class="text-h6">Agregar relación</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <QSelectCliente outlined v-model="relacionData.relacion_id" clearable label="Cliente relacionado"
            required rule="Este campo es requerido."/>
          <q-select outlined v-model="relacionData.tipo_relacion" :options="opcionesParentesco"
            label="Tipo de relación" clearable use-input @filter="filterFn" new-value-mode="add-unique"
            input-debounce="200" :rules="[val => !!val || 'Este campo es requerido' ]">
            <template v-slot:option="scope">
              <q-item-label header v-if="scope.opt.group" v-bind="scope.itemProps" class="bg-primary text-white"
                :key="scope.opt.group">
                <q-icon name="arrow_forward_ios" /> {{ scope.opt.group }}
              </q-item-label>
              <q-item v-else v-bind="scope.itemProps" v-on="scope" :key="scope.opt">
                <q-item-section>
                  <q-item-label>{{ scope.opt }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-italic text-grey">
                  <span>Pulsa <q-badge color="primary"><q-icon name="keyboard_return" />Enter</q-badge> para agregar esta
                    opción.</span>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>




  </q-dialog>
</template>

<style lang="scss">
.parcela-item-actions {
  padding-bottom: 20px;
}

.parcela-item-actions .q-btn {
  

  &:first-child {
    margin-right: 6px;
  }
}

@media (min-width: 600px) {
  .parcela-item-actions {
    padding-bottom: 0;
  }
}
</style>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import QSelectCliente from 'src/components/selects/QSelectCliente.vue';

const $q = useQuasar()
const dialog = ref(false)
const dialogAgregarRelacion = ref(false)
const step = ref(1)

let stringOpcionesParentesco = [
  {
    group: 'Ascendencia directa',
    disable: true
  },
  'Padre',
  'Madre',
  'Abuelo/a',
  'Bisabuelo/a',
  'Tatarabuelo/a',
  'Trastatarabuelo/a',
  {
    group: 'Descendencia directa',
    disable: true
  },
  'Hijo',
  'Hija',
  'Nieto/a',
  'Bisnieto/a',
  'Tataranieto/a',
  'Trastataranieto/a',
  {
    group: 'Parientes laterales',
    disable: true
  },
  'Tío/a',
  'Tío-abuelo/a',
  'Tío-bisabuelo/a',
  'Tío-tatarabuelo/a',
  'Tío segundo/a',
  'Tío tercero/a',
  'Tío cuarto/a',
  'Hermano',
  'Hermana',
  'Medio-hermano/a',
  'Primo/a',
  'Medio-primo/a',
  'Primo segundo/a',
  'Primo tercero/a',
  'Primo cuarto/a',
  'Sobrino/a',
  'Sobrino-nieto/a',
  'Sobrino-bisnieto/a',
  'Sobrino-tataranieto/a',
  'Medio-sobrino/a',
  'Sobrino segundo/a',
  'Sobrino tercero/a',
  'Sobrino cuarto/a',
  {
    group: 'Parentescos por afinidad',
    disable: true
  },
  'Cónyuge',
  'Concubino/a',
  'Suegro/a',
  'Abuelo político/a',
  'Bisabuelo político/a',
  'Padrastro/a',
  'Abuelastro/a',
  'Bisabuelastro/a',
  'Yerno',
  'Nuera',
  'Nieto político/a',
  'Bisnieto político/a',
  'Hijastro/a',
  'Nietastro/a',
  'Bisnietastro/a',
  {
    group: 'Parentescos afines laterales',
    disable: true
  },
  'Tíastro/a',
  'Tío-abuelastro/a',
  'Tío político/a',
  'Cuñado/a',
  'Medio-cuñado/a',
  'Hermanastro/a',
  'Primastro/a',
  'Primo político/a',
  'Sobrino político/a',
  'Sobrinastro/a',
  'Sobrino-nietastro/a',
  'Concuñado/a',
  'Medio-concuñado/a',
  'Consuegro/a',
];

const opcionesParentesco = ref(stringOpcionesParentesco);

const filterFn = (val, update) => {
  if (val === '') {
    update(() => {
      opcionesParentesco.value = stringOpcionesParentesco
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    opcionesParentesco.value = stringOpcionesParentesco.filter(v => {
      return typeof v === 'string' && v.toLowerCase().indexOf(needle) > -1;
    })
  })
}

function qNotifyError(error) {
  let message = !!error?.response?.data?.messages ?
    Object.values(error.response.data.messages).join(' ') :
    'Ha ocurrido un error.'
  $q.notify({ message, color: 'negative' })
}

const handleSubmit = () => {
  isLoadingSubmit.value = true
  let postData = { ...data }

  postData.relaciones = data.relaciones.map(contacto => {
    return {
      relacion_id: contacto.relacion.id,
      tipo_relacion: contacto.tipo_relacion
    }    
  });

  if (data.id) {

    api.put('clientes/' + data.id, postData)
      .then(response => {
        if (response.data) {
          Object.keys(data).forEach((i) => data[i] = null)
          dialog.value = false
          $q.notify({ message: 'Editado exitosamente.', color: 'positive' })
          emit('updated', response.data)
        }
      })
      .catch(error => qNotifyError(error))
      .finally(() => isLoadingSubmit.value = false)

  } else {

    api.post('clientes', postData)
      .then(response => {
        if (response.data) {
          Object.keys(data).forEach((i) => data[i] = null)
          dialog.value = false
          $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
          emit('created', response.data)
        }
      })
      .catch(error => qNotifyError(error))
      .finally(() => isLoadingSubmit.value = false)

  }
}

const handleAgregarRelacion = () => {


  if (data.id) {

    isLoadingSubmitRelacion.value = false;
    let postData = { ...relacionData }
    api.post('clientes/' + data.id + '/relaciones', postData)
      .then(response => {
        if (response.data) {
          console.log(response.data);
          Object.keys(relacionData).forEach((i) => relacionData[i] = null)
          data.relaciones.push(response.data)
          $q.notify({ message: 'Relación agregada.', color: 'positive' })
        }
      })
      .catch(error => qNotifyError(error))
      .finally(() => isLoadingSubmitRelacion.value = false)

  } else {

    api.get('clientes/' + relacionData.relacion_id)
      .then(response => {
        if (response.data) {

          data.relaciones.push({
            relacion: response.data,
            tipo_relacion: relacionData.tipo_relacion,
            cliente: {
              nombre_completo: '(este cliente)',
            },
          })

          Object.keys(relacionData).forEach((i) => relacionData[i] = null)

        }
      })
      .catch(error => qNotifyError(error))
      .finally(() => isLoadingSubmitRelacion.value = false)    

  }

}

const handleEliminarRelacion = (index) => {
  let contacto = data.relaciones[index]

  if (contacto !== undefined) {

    if (contacto.relacion?.id && contacto.cliente?.id) {

      isLoadingEliminarRelacion.value = true;

      api.post('clientes/relaciones/delete', {
        relacion_id: contacto.relacion.id, cliente_id: contacto.cliente.id
      })
      .then(response => {
        if (response.status === 200) {
          data.relaciones.splice(index, 1)
        }
      })
      .catch(error => qNotifyError(error))
      .finally(() => isLoadingEliminarRelacion.value = false) 


    } else {
      data.relaciones.splice(index, 1)
    }
  }

}

const data = reactive({
  // Básica
  id: null,
  nombre: null,
  apellido: null,
  doc_identidad: null,
  doc_numero: null,
  tipo_cliente: null,
  // Contacto
  pais: null,
  estado: null,
  ciudad: null,
  email: null,
  telefono_principal: null,
  telefono_secundario: null,
  direccion_habitacion: null,
  // Laboral
  nombre_empresa: null,
  rif_empresa: null,
  puesto_empresa: null,
  direccion_trabajo: null,
  // Adicional
  fecha_nacimiento: null,
  fecha_muerte: null,
  estado_civil: null,
  religion: null,
  genero: null,
  // Relaciones y parentesco
  relaciones: []
})

const relacionData = reactive({
  relacion_id: null,
  tipo_relacion: null
})

const tiposDocIdentidad = ['V', 'E', 'P', 'J', 'G']
const tiposCliente = [
  'Propietario',
  'Prospecto',
  'Contacto',
  'Ocupante',
  'Organización',
  'Otro',
]

const isLoadingSubmit = ref(false)
const isLoadingSubmitRelacion = ref(false)
const isLoadingEliminarRelacion = ref(false)

const openDialog = (id) => {

  Object.keys(data).forEach((i) => {
    data[i] = (i === 'relaciones') ? [] : null
  })

  if (id) {
    isLoadingSubmit.value = true
    api.get('clientes/' + id)
      .then(response => {
        if (response.data) {
          Object.keys(response.data).forEach((i) => {
            if (data.hasOwnProperty(i)) {
              data[i] = response.data[i]
            }
          })
        }
      })
      .finally(() => isLoadingSubmit.value = false)
  }

  dialog.value = true

}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>