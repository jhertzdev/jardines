<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" class="no-bottoms" :class="isLoadingSubmit && 'form-disabled'">
        <q-card-section>
          <div class="text-h6">{{ data.id ? 'Editar' : 'Agregar' }} {{ props.difunto ? 'difunto' : (props.relacionado ? 'relacionado' : 'cliente') }}</div>
        </q-card-section>

        <q-card-section>

          <div class="row q-col-gutter-lg">
            <div class="col-md-6">
              <q-card flat bordered class="q-pa-sm" style="max-width: 100%">
                <p class="text-primary text-h6">
                  <q-icon name="person" size="sm"></q-icon> Información básica </p>

                  <div class="row q-col-gutter-sm">
                    <div class="col-sm-6 col-12">
                      <q-input dense outlined v-model="data.nombre" label="Nombre *" lazy-rules
                        :rules="[val => val && val.length > 0 || '']" />
                    </div>
                    <div class="col-sm-6 col-12">
                      <q-input dense outlined v-model="data.apellido" label="Apellido *" lazy-rules
                        :rules="[val => val && val.length > 0 || '']" />
                    </div>
                    <div class="col-sm-5 col-4">
                      <q-select dense outlined v-model="data.doc_identidad" :options="tiposDocIdentidad" label="Documento" clearable
                        @clear="data.doc_numero = null" :rules="[val => props.relacionado || (val && val.length > 0 || '')]" />
                    </div>
                    <div class="col-sm-7 col-8">
                      <q-input dense outlined v-model="data.doc_numero" label="Núm. identidad" lazy-rules
                        :rules="[val => val && val.length > 0 || '']" :disable="!data.doc_identidad"
                        :class="!data.doc_identidad && 'bg-grey-3'" />
                    </div>
                    <template v-if="props.difunto">
                      <div class="col-sm-6 col-12">
                        <QSelectDatetime dense outlined stack-label label="Fecha de nacimiento" v-model="data.fecha_nacimiento"/>
                      </div>
                      <div class="col-sm-6 col-12">
                        <QSelectDatetime dense outlined stack-label label="Fecha de muerte" v-model="data.fecha_muerte"/>
                      </div>
                      <div class="col-12">
                        <q-input dense outlined v-model="data.certificado_defuncion" label="Número de certificado" />
                      </div>
                      <div class="col-12">
                        <q-input dense outlined v-model="data.causa_muerte" label="Causa de muerte" />
                      </div>
                    </template>
                    <template v-if="!props.difunto">
                      <div class="col-12">
                        <q-input dense outlined v-model="data.email" label="Email" />
                      </div>
                      <div class="col-sm-6 col-12">
                        <q-input dense outlined v-model="data.telefono_principal" label="Teléfono principal" />
                      </div>
                      <div class="col-sm-6 col-12">
                        <q-input dense outlined v-model="data.telefono_secundario" label="Teléfono secundario" />
                      </div>
                      <div class="col-12">
                        <q-input dense outlined v-model="data.direccion_habitacion" label="Dirección de habitación" />
                      </div>
                    </template>
                    <div class="col-4">
                      <q-select dense :options="[
                        '#33572f',
                        '#c5653b',
                        '#9C27B0',
                        '#21BA45',
                        '#C10015',
                        '#31CCEC',
                        '#F2C037',
                        '#000'
                      ]" outlined v-model="data.etiqueta_color" label="Color" clearable>
                        <template v-slot:option="scope">
                          <q-item v-bind="scope.itemProps">
                            <q-badge :style="`background-color: ${scope.opt || '#000'};`" />
                          </q-item>
                        </template>
                        <template v-slot:selected>
                          <q-badge v-if="data.etiqueta_color" :style="`background-color: ${data.etiqueta_color};`" />
                        </template>
                      </q-select>
                    </div>
                    <div class="col-8">
                      <q-input dense outlined v-model="data.etiqueta_texto" label="Etiqueta" clearable @clear="data.etiqueta_color = null"/>
                    </div>
                    <div class="col-12">
                      <q-input dense type="textarea" class="no-resize" outlined v-model="data.notas" rows="2" label="Notas" clearable autogrow />
                    </div>
                    <div class="col-12">
                      <q-checkbox v-model="data.estado_gerencia" true-value="1" false-value="0" label="Estado de gerencia"
                        :disable="!authStore.can('clientes.gerencia')" class="q-mt-sm">
                        <q-tooltip max-width="200px" class="text-center bg-black">
                          Al marcar esta opción, solo un usuario con permisos para editar clientes bloqueados podrá editarlo.
                        </q-tooltip>
                      </q-checkbox>
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-select dense :options="['Activo', 'Inactivo', 'Fallecido', 'Suspendido', 'Retirado']" outlined
                      v-model="data.estado_cliente" label="Estado de cliente" clearable />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-select dense :options="['Activo', 'En mora']" outlined
                        v-model="data.estado_cuenta" label="Estado de cuenta" clearable />
                    </div>
                  </div>
              </q-card>
            </div>

            <div class="col-md-6">
              <q-card flat bordered class="q-pa-sm q-mb-md" style="max-width: 100%">
                <p class="text-primary text-h6">
                  <q-icon name="person_add" size="sm"></q-icon> Información adicional </p>
                  <div class="row q-col-gutter-sm">
                  <template v-if="props.difunto">
                    <div class="col-12">
                      <q-input dense outlined v-model="data.email" label="Email" />
                    </div>
                    <div class="col-sm-6 col-12">
                      <q-input dense outlined v-model="data.telefono_principal" label="Teléfono principal" />
                    </div>
                    <div class="col-sm-6 col-12">
                      <q-input dense outlined v-model="data.telefono_secundario" label="Teléfono secundario" />
                    </div>
                    <div class="col-12">
                      <q-input dense outlined v-model="data.direccion_habitacion" label="Dirección de habitación" />
                    </div>
                  </template>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.pais" label="País" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.estado" label="Estado" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.ciudad" label="Ciudad" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <QSelectDatetime dense outlined stack-label label="Fecha de nacimiento" v-model="data.fecha_nacimiento"/>
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-select dense :options="['Soltero/a ', 'Casado/a', 'Divorciado/a', 'Viudo/a']" outlined
                      v-model="data.estado_civil" label="Estado civil" clearable />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-select dense :options="['Masculino', 'Femenino']" outlined v-model="data.genero" label="Género" clearable />
                  </div>
                  <template v-if="!props.difunto">
                    <div class="col-12 text-right">
                      <q-checkbox v-model="data.difunto" true-value="1" false-value="0" label="¿Fallecido?"
                        :disable="!!(data.fecha_muerte || data.certificado_defuncion || data.causa_muerte)">
                        <q-tooltip max-width="200px" class="text-center bg-black"
                          v-if="!!(data.fecha_muerte || data.certificado_defuncion || data.causa_muerte)">
                          Para desmarcar esta opción, debes eliminar la información de fecha y causa de muerte, y número de
                          certificado.
                        </q-tooltip>
                      </q-checkbox>
                    </div>
                    <template v-if="parseInt(data.difunto)">
                      <div class="col-sm-6 col-12">
                        <QSelectDatetime dense outlined stack-label label="Fecha de muerte" v-model="data.fecha_muerte"/>
                      </div>
                      <div class="col-sm-6 col-12">
                        <q-input dense outlined v-model="data.certificado_defuncion" label="Número de certificado" />
                      </div>
                      <div class="col-12">
                        <q-input dense outlined v-model="data.causa_muerte" label="Causa de muerte" />
                      </div>
                    </template>
                  </template>
                </div>
              </q-card>

              <q-separator class="q-my-lg"/>

              <q-card flat bordered class="q-pa-sm" style="max-width: 100%">
                <p class="text-primary text-h6">
                  <q-icon name="work" size="sm"></q-icon> Información laboral </p>
                <div class="row q-col-gutter-sm">
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.nombre_empresa" label="Nombre de la empresa" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.telefono_trabajo" label="Teléfono de trabajo" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.rif_empresa" label="RIF (empresa)" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.puesto_empresa" label="Posición / Cargo" />
                  </div>
                  <div class="col-12">
                    <q-input dense outlined v-model="data.direccion_trabajo" label="Dirección de trabajo" />
                  </div>
                </div>
              </q-card>
            </div>
          </div>

          <template v-if="!relacionado">
            <q-separator class="q-my-lg" />

            <div class="row">
              <div class="col-12">
                <q-card flat bordered class="q-pa-sm" style="max-width: 100%">
                  <p class="text-primary text-h6">
                    <q-icon name="family_restroom" size="sm"></q-icon> Relaciones y parentesco </p>

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
                          <td><a href="javascript:void(0)" @click="agregarRelacionadoDialog.openDialog(contacto.relacion.id)">{{ contacto.relacion.nombre_completo }}</a>
                            <template v-if="contacto.relacion.num_identidad">
                              <br /> ({{ contacto.relacion.num_identidad }})
                            </template>
                            <br />
                          </td>
                          <td>
                            <q-badge color="primary">{{ contacto.tipo_relacion }}</q-badge>
                          </td>
                          <td><a href="javascript:void(0)" @click="agregarRelacionadoDialog.openDialog(contacto.cliente.id)">{{ contacto.cliente.nombre_completo }}</a>
                            <template v-if="contacto.cliente.num_identidad">
                              <br /> ({{ contacto.cliente.num_identidad }})
                            </template>
                            <br />
                          </td>
                          <td>
                            <q-btn dense size="sm" class="btn-eliminar-item" icon="delete" outline color="negative"
                              @click="handleEliminarRelacion(index)" :loading="isLoadingEliminarRelacion" />
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p v-else class="text-center q-pt-lg text-grey">No hay relaciones registradas.</p>

                    <div class="text-center q-pa-lg">
                      <q-btn icon="add" label="Agregar relación" color="primary" @click="dialogAgregarRelacion = true" />
                    </div>

                </q-card>


              </div>
            </div>
          </template>


        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" icon="save" :label="data.id ? 'Guardar' : 'Agregar'" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <template v-if="!relacionado">
    <q-dialog allow-focus-outside v-model="dialogAgregarRelacion" class="j-dialog">
      <q-card class="q-pa-md">
        <q-form @submit="handleAgregarRelacion" :class="isLoadingSubmitRelacion && 'form-disabled'">
          <q-card-section>
            <div class="text-h6">Agregar relación</div>
          </q-card-section>
          <q-card-section class="q-gutter-sm">
            <QSelectCliente dense outlined v-model="relacionData.relacion_id" clearable label="Cliente relacionado" rule="Este campo es requerido." :hide-bottom-space="true" />
            <div class="col-12 text-right text-caption text-grey-6">
              <template v-if="parseInt(relacionData.relacion_id)">
                <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                  agregarRelacionadoDialog.openDialog(relacionData.relacion_id, e)"/>
              </template>
              <span>¿La persona relacionada no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                color="primary" @click="agregarRelacionadoDialog.openDialog()" />
            </div>
            <q-select dense outlined v-model="relacionData.tipo_relacion" :options="opcionesParentesco" label="Tipo de relación"
              clearable use-input @filter="filterFn" new-value-mode="add-unique" input-debounce="200"
              :rules="[val => !!val || 'Este campo es requerido']">
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

    <DialogAgregarRelacionado ref="agregarRelacionadoDialog" :relacionado="true" @created="(cliente) => relacionData.relacion_id = cliente.id" />
  </template>

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
import { qNotify } from 'src/boot/jardines';
import { useAuthStore } from 'src/stores/auth.store';
import QSelectCliente from 'src/components/selects/QSelectCliente.vue';
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';
import DialogAgregarRelacionado from './DialogAgregarCliente.vue';

const $q = useQuasar()
const dialog = ref(false)
const dialogAgregarRelacion = ref(false)
const step = ref(1)
const authStore = useAuthStore()

const props = defineProps({
  difunto: {
    type: Boolean,
    default: false
  },
  relacionado: {
    type: Boolean,
    default: false,
  }
})

const customParams = ref({})
const agregarRelacionadoDialog = ref(null)

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

const handleSubmit = () => {

  isLoadingSubmit.value = true
  let postData = { ...data }

  postData.relaciones = data.relaciones.map(contacto => {
    return {
      relacion_id: contacto.relacion.id,
      tipo_relacion: contacto.tipo_relacion
    }
  });

  if (props.difunto) postData.difunto

  if (props.relacionado) postData.relacionado

  if (data.id) {

    api.put('clientes/' + data.id, postData)
      .then(response => {
        if (response.data) {
          Object.keys(data).forEach((i) => data[i] = null)
          dialog.value = false
          $q.notify({ message: 'Editado exitosamente.', color: 'positive' })

          if (customParams.value.onUpdate) {
            customParams.value.onUpdate(response.data)
          }

          emit('updated', response.data, buttonTargetId.value)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleSubmit }))
      .finally(() => isLoadingSubmit.value = false)

  } else {

    api.post('clientes', postData)
      .then(response => {
        if (response.data) {
          Object.keys(data).forEach((i) => data[i] = null)
          dialog.value = false
          $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })

          console.log('Created!!', response.data, customParams.value.onCreate || 'nada');

          if (customParams.value.onCreate) {
            console.log('Created!!', response.data);
            customParams.value.onCreate(response.data)
          }

          emit('created', response.data, buttonTargetId.value)
        }
      })
      .catch(error => {
        console.log(error)
        qNotify(error, 'error', { callback: handleSubmit })
      })
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
          Object.keys(relacionData).forEach((i) => relacionData[i] = null)
          data.relaciones.push(response.data)
          $q.notify({ message: 'Relación agregada.', color: 'positive' })
          dialogAgregarRelacion.value = false
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleAgregarRelacion }))
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
      .catch(error => qNotify(error, 'error', { callback: handleAgregarRelacion }))
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
        .catch(error => qNotify(error, 'error', { callback: () => handleEliminarRelacion(index) }))
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
  estado_gerencia: null,
  estado_cuenta: null,
  estado_cliente: null,
  notas: null,
  etiqueta_color: null,
  etiqueta_texto: null,
  // Contacto
  pais: null,
  estado: null,
  ciudad: null,
  email: null,
  telefono_principal: null,
  telefono_secundario: null,
  telefono_trabajo: null,
  direccion_habitacion: null,
  // Laboral
  nombre_empresa: null,
  rif_empresa: null,
  puesto_empresa: null,
  direccion_trabajo: null,
  // Adicional
  fecha_nacimiento: null,
  difunto: props.difunto ? 1 : 0,
  fecha_muerte: null,
  causa_muerte: null,
  certificado_defuncion: null,
  estado_civil: null,
  genero: null,
  // Relaciones y parentesco
  relaciones: []
})

const relacionData = reactive({
  relacion_id: null,
  tipo_relacion: null
})

const tiposDocIdentidad = ['V', 'E', 'P', 'J', 'G', 'PN']
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

const buttonTargetId = ref(null)

const openDialog = (id, event = null, params = {}) => {

  console.log('openDialog', id, event, params);

  buttonTargetId.value = event?.target?.closest('.q-btn, .q-item--clickable')?.id || null;

  Object.keys(data).forEach((i) => {
    data[i] = (i === 'relaciones') ? [] :
      (i === 'difunto' ? (props.difunto ? '1' : '0') :
        (i === 'estado_gerencia' ? '0' : null)
      )
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
      .finally(() => {
        isLoadingSubmit.value = false
        dialog.value = true
      })
  } else {
    dialog.value = true
  }

  console.log('openDialogParams', params)

  customParams.value = params;

}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
