<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md scroll">
      <q-form @submit="handleSubmit" class="no-bottoms" :class="isLoadingSubmit && 'form-disabled'" ref="editarClienteForm" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">{{ data.id ? 'Editar' : 'Agregar' }} {{ props.difunto ? 'difunto' : (props.relacionado ? 'relacionado' : 'cliente') }}</div>
        </q-card-section>

        <q-card-section v-if="titularFallecidoContratosActivos">
          <q-banner class="bg-red-3 q-pb-md q-mb-lg">
            <template v-slot:avatar>
              <q-icon class="q-mt-sm" name="warning" color="black" />
            </template>
            <div class="row">
              <div class="col-md">
                <div class="text-h6">Titular fallecido</div>
                <div>Antes de guardar la información del cliente, debes reasignar los contratos activos que tenga.</div>
                <q-checkbox v-model="ignorarContratosActivos" label="Ignorar contratos activos" type="checkbox"  />
              </div>
              <div class="col-md-auto flex items-center">
                <q-btn type="button" color="primary" label="Cambiar" icon="person" @click="cambiarTitularDialog.openDialog({ cliente_id: data.id })" />
              </div>
            </div>
            <template v-slot:action>
            </template>
          </q-banner>
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
                    <div class="col-12">
                        <div class="row">
                          <div class="col-sm-6 col-12">
                            <q-checkbox v-model="data.estado_gerencia" true-value="1" false-value="0" label="Estado de gerencia"
                              :disable="!authStore.can('clientes.gerencia')">
                              <q-tooltip max-width="200px" class="text-center bg-black">
                                Al marcar esta opción, solo un usuario con permisos para editar clientes bloqueados podrá editarlo.
                              </q-tooltip>
                            </q-checkbox>
                          </div>
                          <div class="col-sm-6 col-12 text-right">
                            <q-checkbox v-model="data.difunto" true-value="1" false-value="0" label="¿Fallecido?"
                              :disable="!!(props.difunto || data.fecha_muerte || data.certificado_defuncion || data.causa_muerte)">
                              <q-tooltip max-width="200px" class="text-center bg-black"
                                v-if="!!(data.fecha_muerte || data.certificado_defuncion || data.causa_muerte)">
                                Para desmarcar esta opción, debes eliminar la información de fecha y causa de muerte, y número de
                                certificado.
                              </q-tooltip>
                            </q-checkbox>
                          </div>

                        </div>

                      </div>
                    <template v-if="props.difunto">
                      <div class="col-sm-6 col-12">
                        <q-input type="date" dense outlined v-model="data.fecha_nacimiento" label="Fecha de nacimiento *" lazy-rules :rules="[val => val && val.length > 0 || '']" />
                      </div>
                      <div class="col-sm-6 col-12">
                        <q-input type="datetime-local" dense outlined v-model="data.fecha_muerte" label="Fecha de muerte *" lazy-rules :rules="[val => val && val.length > 0 || '']" />
                      </div>
                      <div class="col-12">
                        <q-input dense outlined v-model="data.certificado_defuncion" label="Número de certificado *" lazy-rules :rules="[val => val && val.length > 0 || '']" />
                      </div>
                      <div class="col-12">
                        <q-input dense outlined v-model="data.causa_muerte" label="Causa de muerte *" lazy-rules :rules="[val => val && val.length > 0 || '']" />
                      </div>
                      <div class="col-12">
                        <q-separator class="q-my-sm"></q-separator>
                      </div>
                    </template>
                    <template v-if="!props.difunto">
                      <template v-if="parseInt(data.difunto)">
                        <div class="col-sm-6 col-12">
                          <q-input type="datetime-local" dense outlined stack-label label="Fecha de muerte *" v-model="data.fecha_muerte" lazy-rules :rules="[val => val && val.length > 0 || '']" />
                        </div>
                        <div class="col-sm-6 col-12">
                          <q-input dense outlined v-model="data.certificado_defuncion" label="Número de certificado *" lazy-rules :rules="[val => val && val.length > 0 || '']" />
                        </div>
                        <div class="col-12">
                          <q-input dense outlined v-model="data.causa_muerte" label="Causa de muerte *" lazy-rules :rules="[val => val && val.length > 0 || '']" />
                        </div>
                        <div class="col-12">
                          <q-separator class="q-my-sm"></q-separator>
                        </div>
                      </template>
                      <div class="col-sm-6 col-12">
                        <q-input type="date" dense outlined v-model="data.fecha_nacimiento" label="Fecha de nacimiento" />
                      </div>
                    </template>




                    <div :class="props.difunto ? 'col-12' : 'col-sm-6 col-12'">
                      <q-input dense outlined v-model="data.email"
                      :label="`Email ${!esDifunto ? '*' : ''}`"
                      :rules="[val => (esDifunto) || (val && val.length > 0 || '')]" />
                    </div>
                    <div class="col-sm-6 col-12">
                      <q-input dense outlined v-model="data.telefono_principal"
                      :label="`Teléfono principal ${!esDifunto ? '*' : ''}`"
                      :rules="[val => (esDifunto) || (val && val.length > 0 || '')]" />
                    </div>
                    <div class="col-sm-6 col-12">
                      <q-input dense outlined v-model="data.telefono_secundario"
                      :label="`Teléfono secundario ${!esDifunto ? '*' : ''}`"
                      :rules="[val => (esDifunto) || (val && val.length > 0 || '')]" />
                    </div>
                    <div class="col-12">
                      <q-input dense outlined v-model="data.direccion_habitacion"
                      :label="`Dirección de habitación ${!esDifunto ? '*' : ''}`"
                      :rules="[val => (esDifunto) || (val && val.length > 0 || '')]" />
                    </div>
                    <div class="col-sm-6 col-12">
                      <q-select dense :options="['Soltero/a ', 'Casado/a', 'Divorciado/a', 'Viudo/a']" outlined
                        v-model="data.estado_civil"
                        :label="`Estado civil ${!esDifunto ? '*' : ''}`"
                        :rules="[val => (esDifunto) || (val && val.length > 0 || '')]"
                        clearable />
                    </div>
                    <div class="col-sm-6 col-12">
                      <q-select dense :options="['Masculino', 'Femenino']" outlined v-model="data.genero"
                        :label="`Género ${!esDifunto ? '*' : ''}`"
                        :rules="[val => (esDifunto) || (val && val.length > 0 || '')]"
                        clearable />
                    </div>

                  </div>

                <q-separator class="q-mt-lg q-mb-md"/>

                <p class="text-primary text-h6">
                  <q-icon name="work" size="sm"></q-icon> Información laboral </p>
                <div class="row q-col-gutter-sm">
                  <div class="col-12">
                    <q-input dense outlined v-model="data.direccion_trabajo"
                    :label="`Dirección de trabajo ${!esDifunto ? '*' : ''}`"
                    :rules="[val => esDifunto || (val && val.length > 0 || '')]" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.telefono_trabajo"
                    :label="`Teléfono de trabajo ${!esDifunto ? '*' : ''}`"
                    :rules="[val => esDifunto || (val && val.length > 0 || '')]" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.puesto_empresa"
                    :label="`Posición / Cargo ${!esDifunto ? '*' : ''}`"
                    :rules="[val => esDifunto || (val && val.length > 0 || '')]" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.nombre_empresa"
                    :label="`Nombre de la empresa ${!esDifunto ? '*' : ''}`"
                    :rules="[val => esDifunto || (val && val.length > 0 || '')]" />
                  </div>
                  <div class="col-sm-6 col-12">
                    <q-input dense outlined v-model="data.rif_empresa"
                    :label="`RIF (empresa) ${!esDifunto ? '*' : ''}`"
                    :rules="[val => esDifunto || (val && val.length > 0) || '']" />
                  </div>
                </div>
              </q-card>
            </div>

            <div class="col-md-6">
              <q-card flat bordered class="q-pa-sm q-mb-md" style="max-width: 100%">
                <p class="text-primary text-h6 flex justify-between items-center">
                  <div>
                    <q-icon name="share" size="sm"></q-icon> Redes sociales
                  </div>
                  <q-btn dense size="sm" class="btn-agregar-item" icon="add" outline color="primary" @click="handleAgregarRedSocial()">
                    <q-tooltip class="bg-black" anchor="top middle" self="bottom middle" max-width="240px">
                      Agregar una nueva red social.
                    </q-tooltip>
                  </q-btn>
                </p>

                <div class="row q-col-gutter-sm q-mb-sm" v-for="(redes, index) in data.redes_sociales" :key="'redes' + index">
                  <div class="col-4">
                    <q-select dense :options="['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 'WhatsApp', 'Telegram', 'Otra']" outlined
                      v-model="data.redes_sociales[index].plataforma" label="Red social" ref="socialNetworksSelectRefs" clearable />
                  </div>
                  <div class="col-7">
                    <q-input dense outlined v-model="data.redes_sociales[index].enlace" label="Enlace" />
                  </div>
                  <div class="col-1 flex flex-center">
                    <q-btn dense size="sm" class="btn-eliminar-item" icon="delete" outline color="negative" @click="data.redes_sociales.splice(index, 1)" />
                  </div>
                </div>

                <div class="text-center bg-green-1 flex flex-center q-mb-md" style="border: 1px dashed var(--q-primary);  border-radius: 5px; min-height: 140px;" v-if="!data.redes_sociales?.length">
                  <q-btn type="button" color="primary" label="Agregar red social" icon="add" @click="handleAgregarRedSocial()">
                  </q-btn>
                </div>

                <q-separator class="q-mt-lg q-mb-md"></q-separator>

                <p class="text-primary text-h6">
                  <q-icon name="note" size="sm"></q-icon> Notas</p>
                  <div class="row q-col-gutter-sm">

                    <div class="col-12 col-sm-6">
                      <q-select dense :options="['Activo', 'Inactivo', 'Fallecido', 'Suspendido', 'Retirado']" outlined
                      v-model="data.estado_cliente" label="Estado de cliente" clearable />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-select dense :options="['Activo', 'En mora']" outlined
                        v-model="data.estado_cuenta" label="Estado de cuenta" clearable />
                    </div>

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
                      <q-input dense type="textarea" class="no-resize" outlined v-model="data.notas" rows="2" label="Observaciones" clearable autogrow />
                    </div>
                    <div class="col-12">
                      <q-separator class="q-my-lg" />
                    </div>
                    <div class="col-12">
                      <template v-if="data?.notas_cobro?.length">
                        <div style="border: 1px solid rgba(0,0,0,.24); border-radius: 4px; padding: 3px;">
                          <div style="max-height: 250px; overflow-y: auto; ">
                            <q-chat-message
                              class="cursor-pointer"
                              :name="`<span class='q-badge text-${getColorFromStatus(nota.estatus)} bg-transparent font-bold' style='font-size: 0.65rem'>${nota.estatus} • <span class='text-grey-8'>${nota.nombre_completo}</span></span>`"
                              name-html
                              :text="[nota.nota]"
                              :stamp="format(new Date(nota.fecha_creado), 'dd/MM/yyyy HH:mm aaaa')"
                              :bg-color="`${getColorFromStatus(nota.estatus)}-1`"
                              v-for="(nota, index) in data.notas_cobro || []"
                              :key="'nota' + index"
                              @click="(e) => agregarNotasCobroDialog.openDialog(data.id, { nombre_completo: `${data.nombre} ${data.apellido}` })"
                            ></q-chat-message>
                          </div>
                        </div>
                      </template>

                      <template v-else>
                        <div class="text-center bg-green-1 flex flex-center" style="border: 1px dashed var(--q-primary); border-radius: 5px; min-height: 140px;">
                          <q-btn type="button" color="primary" label="Agregar nota" icon="add" @click="agregarNotasCobroDialog.openDialog(data.id)" :disable="!data.id">
                            <q-tooltip anchor="top middle" self="bottom middle" max-width="240px" v-if="!data.id">
                              Guarda primero al cliente para agregar una nota.
                            </q-tooltip>
                          </q-btn>
                        </div>
                      </template>



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

        <q-card-section v-if="titularFallecidoContratosActivos">
          <q-banner class="bg-red-3 q-pb-md q-mb-lg">
            <template v-slot:avatar>
              <q-icon class="q-mt-sm" name="warning" color="black" />
            </template>
            <div class="row">
              <div class="col-md">
                <div class="text-h6">Titular fallecido</div>
                <div>Antes de guardar la información del cliente, debes reasignar los contratos activos que tenga.</div>
                <q-checkbox v-model="ignorarContratosActivos" label="Ignorar contratos activos" type="checkbox"  />
              </div>
              <div class="col-md-auto flex items-center">
                <q-btn type="button" color="primary" label="Cambiar" icon="person" @click="cambiarTitularDialog.openDialog({ cliente_id: data.id })" />
              </div>
            </div>
            <template v-slot:action>
            </template>
          </q-banner>
        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" icon="save" :label="data.id ? 'Guardar' : 'Agregar'" color="primary" :loading="isLoadingSubmit" :disable="isLoadingSubmit" />
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
    <DialogCambiarTitular ref="cambiarTitularDialog" :relacionado="true" />
    <DialogAgregarNotasCobro ref="agregarNotasCobroDialog" @created="() => loadNotasCliente()" @updated="() => loadNotasCliente() "/>

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
import { ref, reactive, computed, nextTick } from 'vue';
import { useQuasar, scroll } from 'quasar';
import { qNotify } from 'src/boot/jardines';
import { useAuthStore } from 'src/stores/auth.store';
import QSelectCliente from 'src/components/selects/QSelectCliente.vue';
import DialogAgregarRelacionado from './DialogAgregarCliente.vue';
import DialogCambiarTitular from "src/components/popups/DialogCambiarTitular.vue";
import DialogAgregarNotasCobro from "src/components/popups/DialogAgregarNotasCobro.vue";

import { format } from 'date-fns';

const $q = useQuasar()
const dialog = ref(false)
const dialogAgregarRelacion = ref(false)
const authStore = useAuthStore()

const { getScrollTarget, setVerticalScrollPosition } = scroll
const onValidationError = (ref) => {
  const el = ref.$el
  setVerticalScrollPosition(getScrollTarget(el), el.offsetTop, 200)
}

const loadNotasCliente = () => {
  console.log('Loading notas clientes!')
  api.get('clientes/' + data.id + '/notas')
    .then(response => {
      if (response.data) {
        data.notas_cobro = response.data
      }
    })
    .catch(error => qNotify(error, 'error'))
}

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

const getColorFromStatus = (estatus) => {
  let colors = {
    'Contactado': 'blue',
    'No contactado': 'red',
    'Respondido': 'green',
  }

  return colors[estatus] || 'grey'
}

const customParams = ref({})
const agregarRelacionadoDialog = ref(null)
const cambiarTitularDialog = ref(null)
const agregarNotasCobroDialog = ref(null)

const titularFallecidoContratosActivos = computed(() => {
  return tieneContratosActivos.value && !!parseInt(props.difunto || data.difunto)
})

const esDifunto = computed(() => {
  return !!parseInt(props.difunto || data.difunto)
})

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

  if (titularFallecidoContratosActivos.value && !ignorarContratosActivos.value) {
    cambiarTitularDialog.value.openDialog({
      cliente_id: data.id,
      select_all: true
    })
    return;
  }

  isLoadingSubmit.value = true
  let postData = { ...data }

  postData.relaciones = data.relaciones.map(contacto => {
    return {
      relacion_id: contacto.relacion.id,
      tipo_relacion: contacto.tipo_relacion
    }
  });

  // Redes sociales
  postData.redes_sociales = data.redes_sociales.filter(redes => redes.plataforma && redes.enlace)

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

          if (customParams.value.onCreate) {
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
  notas_cobro: [],
  redes_sociales: [],
  etiqueta_color: null,
  etiqueta_texto: null,
  // Contacto
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
  relaciones: [],
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
const tieneContratosActivos = ref(false)
const ignorarContratosActivos = ref(false)

const buttonTargetId = ref(null)

const socialNetworksSelectRefs = ref([])

const handleAgregarRedSocial = () => {
  data.redes_sociales.push({
    plataforma: null,
    enlace: null
  })

  nextTick(() => {
    if (socialNetworksSelectRefs.value.length == 1) {
      socialNetworksSelectRefs.value[0].showPopup()
    }
  })

}

const openDialog = (id, event = null, params = {}) => {

  console.log('openDialog', id, event, params);

  buttonTargetId.value = event?.target?.closest('.q-btn, .q-item--clickable')?.id || null;

  Object.keys(data).forEach((i) => {
    data[i] = (i === 'relaciones' || i === 'notas_cobro' || i === 'redes_sociales') ? [] :
      (i === 'difunto' ? (props.difunto ? '1' : '0') :
        (i === 'estado_gerencia' ? '0' : null)
      )
  })

  ignorarContratosActivos.value = false

  if (id) {
    isLoadingSubmit.value = true
    api.get('clientes/' + id + '?with[]=data')
      .then(response => {
        if (response.data) {



          if (response.data.contratos.filter(contrato => contrato.estatus != 'Inactivo').length) {
            tieneContratosActivos.value = true
          }


          Object.keys(response.data).forEach((i) => {
            if (data.hasOwnProperty(i)) {
              data[i] = response.data[i]
            }
          })

          data.fecha_nacimiento = response.data.fecha_nacimiento ? response.data.fecha_nacimiento.split(' ')[0] : null

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
