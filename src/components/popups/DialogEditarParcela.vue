<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md">
      <div class="text-h6 text-center">
        {{ parcelaData?.tipo_parcela?.tipo_parcela || 'Ubicación' }} {{ parcelaDetalles.codigo_seccion }}-{{
          parcelaDetalles.num_parcela
        }}


      </div>
      <q-splitter v-model="splitterModel" horizontal>
        <template v-slot:before>
          <q-tabs v-model="tab" class="text-grey-5" active-color="primary">
            <q-tab name="detalles" icon="view_timeline" label="Detalles" />
            <q-tab name="puestos" icon="crop_landscape" label="Puestos" />
            <q-tab name="contratos" icon="attach_money" label="Contratos" />
            <q-tab name="recibos" icon="receipt" label="Recibos" />
            <q-tab name="mantenimiento" icon="handyman" label="Mantenimiento" />
          </q-tabs>
        </template>

        <template v-slot:after>
          <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up">
            <q-tab-panel name="detalles">

              <q-form class="q-pa-md" @submit="handleSubmitDetalles" :class="isLoadingDetalles && 'form-disabled'">

                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-sm-4 col-12 flex column justify-center">
                      <span class="text-grey-8">Propietario</span>
                    </div>
                    <div class="col-sm-8 col-12">
                      <QSelectCliente dense outlined clearable v-model="parcelaDetalles.propietario_id" />
                    </div>
                  </div>
                  <div class="row q-mb-md">
                    <div class="col-12 text-right text-caption text-grey-6">
                      <template v-if="parseInt(parcelaDetalles.propietario_id)">
                        <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit"
                          color="primary" @click="(e) =>
                            agregarClienteDialog.openDialog(parcelaDetalles.propietario_id, e)" />
                      </template>
                      <span>¿El cliente no existe?</span>
                      <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary"
                        @click="agregarClienteDialog.openDialog()" />
                    </div>
                  </div>
                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-sm-4 col-12 flex column justify-center">
                      <span class="text-grey-8">Pariente más cercano
                        <q-icon name="help_outline">
                          <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                            Opcional. Es el principal beneficiario de esta ubicación y
                            controla los derechos de inhumación del propietario
                            después de su muerte.
                          </q-tooltip>
                        </q-icon>
                      </span>
                    </div>
                    <div class="col-sm-8 col-12">
                      <QSelectCliente dense outlined clearable v-model="parcelaDetalles.pariente_mas_cercano" />
                    </div>
                  </div>
                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-sm-4 col-12 flex column justify-center">
                      <span class="text-grey-8">Estatus</span>
                    </div>
                    <div class="col-sm-8 col-12">
                      <QSelectEstatusParcela dense outlined required v-model="parcelaDetalles.estatus" />
                    </div>
                  </div>
                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-sm-4 col-12 flex column justify-center">
                      <span class="text-grey-8">Descripción</span>
                    </div>
                    <div class="col-sm-8 col-12">
                      <q-input dense outlined v-model="parcelaDetalles.descripcion" placeholder="Escribe una descripción"
                        autogrow />
                    </div>
                  </div>
                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-sm-4 col-12 flex column justify-center">
                      <span class="text-grey-8">Ubicación</span>
                    </div>
                    <div class="col-sm-8 col-12">
                      <div class="row q-col-gutter-sm">
                        <div class="col-12 col-md-5">
                          <QSelectSeccion dense outlined required clearable v-model="parcelaDetalles.codigo_seccion"
                            label="Sector" />
                        </div>
                        <div class="col-6 col-md">
                          <q-input class="input-num-parcela" dense outlined v-model="parcelaDetalles.num_parcela"
                            :stack-label="!!parcelaDetalles.codigo_seccion" label="Parcela">
                            <template v-slot:prepend v-if="parcelaDetalles.codigo_seccion">
                              <span>{{ parcelaDetalles.codigo_seccion }}</span>
                            </template>
                          </q-input>
                        </div>
                        <div class="col-auto text-grey-8 flex column justify-center">
                          |
                        </div>
                        <div class="col-6 col-md">
                          <q-input dense outlined v-model="parcelaDetalles.num_fila" label="Fila" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-sm-4 col-12 flex column justify-center">
                      <span class="text-grey-8">Características</span>
                    </div>
                    <div class="col-sm-8 col-12">
                      <table class="full-width text-center">
                        <thead>
                          <tr>
                            <th>Tipo de ubicación</th>
                            <th>Largo &times; Ancho &times; Alto</th>
                            <th>Puestos</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              {{ parcelaData.tipo_parcela?.nombre }}
                            </td>
                            <td>
                              {{
                                parseFloat(parcelaData.tipo_parcela?.largo).toFixed(
                                  2
                                )
                              }}
                              &times;
                              {{
                                parseFloat(parcelaData.tipo_parcela?.ancho).toFixed(
                                  2
                                )
                              }}
                              &times;
                              {{
                                parseFloat(
                                  parcelaData.tipo_parcela?.profundidad
                                ).toFixed(2)
                              }}
                            </td>
                            <td>
                              {{ parcelaData.puestos?.length }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="text-right">
                    <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingDetalles" />
                  </div>
              </q-form>

            </q-tab-panel>
            <q-tab-panel name="puestos">
              <div class="full-width q-pa-lg text-center" v-if="!parcelaData.puestos?.length">
                <p>No hay puestos asociados a esta ubicación.</p>
              </div>

              <div class="q-pa-md" v-else>
                <div class="row q-col-gutter-sm q-mb-md" v-for="(puesto, key) in parcelaData.puestos || []">
                  <div class="col-sm-auto col-12 flex column justify-center" :draggable="true"
                    @dragstart="onDragStart(i, $event)" @dragend="onDragEnd($event)" @dragover.prevent
                    @dragenter="onDragEnter(i, $event)" @dragleave="onDragLeave(i, $event)" @drop="onDrop(i, $event)">
                    <span class="text-grey-8">{{ puesto.nombre }}</span>
                    <span>
                      <q-badge color="negative" v-if="parseInt(puesto.ocupado)">
                        Ocupado
                      </q-badge>
                      <q-badge color="positive" v-else> Disponible </q-badge>
                      <div class="text-grey-8" style="font-size: 0.6rem">
                        {{ puesto.puesto_nombre }}
                      </div>
                    </span>
                  </div>
                  <div class="col-sm col-12">
                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-md-6">



                        <q-field label="Ocupante" outlined dense stack-label v-if="parseInt(puestosData[puesto.id].ocupado)">
                          <template v-slot:control>
                            {{ `${puestosData[puesto.id].ocupante_nombre} (${puestosData[puesto.id].ocupante_identidad })` }}
                          </template>
                          <template v-slot:append>
                            <q-btn flat dense icon="edit" color="primary" @click="(e) => agregarDifuntoDialog.openDialog(puestosData[puesto.id].ocupante_id, e)" />
                          </template>
                        </q-field>


                      </div>
                      <div class="col-12 col-md">
                        <q-field label="Fecha de inhumación" outlined dense stack-label v-if="parseInt(puestosData[puesto.id].ocupado)">
                          <template v-slot:control>
                            {{ puestosData[puesto.id]?.fecha_inhumacion && new Date(puestosData[puesto.id].fecha_inhumacion) != 'Invalid Date' ?
                              format(new Date(puestosData[puesto.id].fecha_inhumacion), 'dd/MM/yyyy hh:mm aaaa') : null
                             }}
                          </template>
                          <template v-slot:append>
                            <q-btn flat dense icon="edit" color="primary" @click="modificarPuestoOpenDialog(puesto.id)"/>
                          </template>
                        </q-field>
                      </div>
                      <div class="col-12 col-md-auto flex flex-column items-center">
                        <q-btn-dropdown dense size="sm" color="primary" :loading="isLoadingPuestos"
                          v-if="parseInt(puestosData[puesto.id].ocupado)">
                          <q-list v-if="!isLoadingPuestos">
                            <q-item clickable @click="exhumarPuestoOpenDialog(puesto.id)" :disable="obtenerParcelaExhumableId(parcelaData.puestos) !=
                              puesto.id
                              " v-close-popup>
                              <q-item-section side>
                                <q-icon color="black" name="eject" />
                              </q-item-section>
                              <q-item-section>Exhumar</q-item-section>
                            </q-item>
                            <q-item id="btnEditPlotOccupant" clickable
                              @click="(e) => agregarDifuntoDialog.openDialog(puestosData[puesto.id].ocupante_id, e)"
                              v-close-popup>
                              <q-item-section side>
                                <q-icon color="black" name="manage_accounts" />
                              </q-item-section>
                              <q-item-section>Editar ocupante</q-item-section>
                            </q-item>
                            <q-item clickable @click="modificarPuestoOpenDialog(puesto.id)" v-close-popup>
                              <q-item-section side>
                                <q-icon color="black" name="edit" />
                              </q-item-section>
                              <q-item-section>Modificar puesto</q-item-section>
                            </q-item>
                          </q-list>
                        </q-btn-dropdown>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-right q-gutter-sm">
                  <q-btn @click="liberarParcelaDialog = true" label="Liberar ubicación" icon="lock_open" color="primary"
                    :loading="isLoadingPuestos" :disabled="!parcelaData.contratos?.length">
                      <q-tooltip v-if="!parcelaData.contratos?.length">
                        No hay contratos asociados a esta ubicación.
                      </q-tooltip>
                  </q-btn>
                  <q-btn @click="agregarOcupanteDialog = true; agregarOcupanteData.generar_servicio = true" label="Agregar ocupante" icon="add" color="primary"
                    :loading="isLoadingPuestos" :disabled="!parcelaData.contratos?.length">
                    <q-tooltip v-if="!parcelaData.contratos?.length">
                      No hay contratos asociados a esta ubicación.
                    </q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="contratos">
              <div class="full-width q-pa-lg text-center" v-if="!parcelaData.contratos?.length">
                <p>No hay contratos asociados a esta ubicación.</p>
                <q-btn color="primary" label="Generar contratos" to="/app/contratos" />
                <!--<q-btn color="primary" label="Generar contratos" @click="openDialogGenerarContratos" />-->
              </div>
              <q-form class="q-pa-md" @submit="handleSubmitDetalles" :class="isLoadingDetalles && 'form-disabled'" v-else>
                <div class="row q-col-gutter-sm">
                  <div class="col-md-6 col-12" v-for="contrato in parcelaData.contratos">
                    <q-card class="my-card">
                      <q-card-section class="bg-primary text-white">
                        <q-badge class="float-right" color="white" text-color="primary">
                          {{ contrato.estatus }}
                        </q-badge>
                        <div class="text-h5">
                          {{ contrato.codnum_contrato }}
                        </div>
                        <p class="q-mb-none">{{ contrato.nombre_contrato }}</p>
                      </q-card-section>
                      <q-card-section>
                        <table class="full-width">
                          <tbody>
                            <tr>
                              <th>Comprador</th>
                              <td class="text-right">
                                {{ contrato.comprador_nombre }} ({{
                                  contrato.comprador_identidad
                                }})
                              </td>
                            </tr>
                            <tr>
                              <th>Vendedor</th>
                              <td class="text-right">
                                {{ contrato.razon_social }}
                              </td>
                            </tr>
                            <tr>
                              <th>Fecha de emisión</th>
                              <td class="text-right">
                                {{ contrato.fecha_emision || "-" }}
                              </td>
                            </tr>
                            <tr>
                              <th>Fecha de vencimiento</th>
                              <td class="text-right">
                                {{ contrato.fecha_vencimiento || "-" }}
                              </td>
                            </tr>
                            <tr>
                              <th>Valor total</th>
                              <td class="text-right">
                                {{ $money.$bs(contrato.valor_total) || "-" }}
                              </td>
                            </tr>
                            <tr>
                              <th>Número de cuotas</th>
                              <td class="text-right">
                                {{ contrato.numero_cuotas || "-" }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </q-card-section>

                      <q-separator />

                      <q-card-actions class="justify-end">
                        <q-btn label="Ver" icon="picture_as_pdf" color="primary"
                          @click="handleDownloadPdf(contrato.id)" />
                        <!--<q-btn label="Editar" icon="edit" color="primary" />
                        <q-btn label="Borrar" icon="delete" color="negative" />-->
                      </q-card-actions>
                    </q-card>
                  </div>
                </div>
                <div class="text-right">
                  <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingDetalles" />
                </div>
              </q-form>
            </q-tab-panel>
            <q-tab-panel name="recibos">
              <q-markup-table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Contrato</th>
                    <th>Fecha</th>
                    <th>Estatus</th>
                    <th>Pagado hasta</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="recibo in parcelaData.recibos" :key="recibo.id" :class="recibo.deleted_at ? 'bg-red-3 text-red-9' : ''">
                    <td style="max-width: 120px; white-space: wrap">{{ recibo.num_transaccion }}
                      <q-badge v-if="recibo.deleted_at" class="bg-red-9 text-white" style="font-size: 10px; margin-left: 5px;">ANULADO</q-badge>
                      <q-badge v-if="!!parseInt(recibo.pago_fraccionado)" class="bg-purple-9 text-white" style="font-size: 10px; margin-left: 5px;">FRACCIONADO</q-badge>
                    </td>
                    <td>{{ recibo.num_contrato }}</td>
                    <td>{{ new Date(recibo.created_at).toLocaleDateString() }}</td>
                    <td>{{ recibo.estatus }}</td>
                    <td>{{ recibo.pagado_hasta ? new Date(recibo.pagado_hasta).toLocaleDateString() : '-'}}</td>
                    <td style="white-space: pre-wrap;">{{ recibo.descripcion }}</td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-tab-panel>
            <q-tab-panel name="mantenimiento">
              <q-markup-table>
                <thead>
                  <tr>
                    <th>Mes asignado</th>
                    <th>Estatus</th>
                    <th>Completado el</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in parcelaData.mantenimientos" :key="m.id">
                    <td class="text-center">{{ m.fecha_vencimiento ? getYMD(new Date(m.fecha_vencimiento)).substr(0, 7) : '-' }}</td>
                    <td class="text-center">{{ m.estatus }}</td>
                    <td class="text-center">{{ m.fecha_completado ? getDMY(new Date(m.fecha_completado)) : '-' }}</td>
                    <td>
                      <ul class="q-pl-xs" v-if="m.observaciones?.length" style="list-style: square">
                        <li v-for="o in m.observaciones.filter(o => o.value)" :key="o.id">
                          <b>{{ o.title }}:</b> {{ o.value }}
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </q-card>



    <!-- Dialogs -->
    <DialogAgregarCliente ref="agregarClienteDialog" @created="handleCreatedCliente" @updated="handleUpdatedCliente" />
    <DialogAgregarCliente ref="agregarDifuntoDialog" @created="handleCreatedCliente" @updated="handleUpdatedCliente"
      :difunto="true" />
    <DialogGenerarContratosIndividual ref="generarContratosDialog" @created="handleGenerarContratos"
      :params="contratosParams" />
    <q-dialog allow-focus-outside v-model="agregarOcupanteDialog" class="j-dialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Agregar ocupante</div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <QSelectCliente dense outlined clearable v-model="agregarOcupanteData.ocupante_id"
                label="Selecciona un ocupante" />
            </div>
            <div class="col-12 text-right text-caption text-grey-6">
              <template v-if="parseInt(agregarOcupanteData.ocupante_id)">
                <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit"
                  color="primary" @click="(e) =>agregarDifuntoDialog.openDialog(agregarOcupanteData.ocupante_id, e)"
                />
              </template>
              <span>¿El difunto no existe?</span>
              <q-btn id="btnAddNewOccupant" flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary"
                @click="(e) => agregarDifuntoDialog.openDialog(null, e)" />
            </div>
            <div class="col-12">
              <q-input type="datetime-local" dense outlined stack-label label="Fecha de inhumación"
                v-model="agregarOcupanteData.fecha_inhumacion" />
            </div>
            <div class="col-12">
              <q-checkbox v-model="agregarOcupanteData.generar_servicio" color="primary" dense>
                Generar servicio de inhumación
                <q-icon name="help_outline" />
                <q-tooltip max-width="240px">
                  Al marcar esta opción, se generará un registro de la inhumación en el módulo de servicios del Parque.
                </q-tooltip>
              </q-checkbox>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Agregar" icon="add" :loading="isLoadingPuestos" @click="handleOcuparPuesto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog allow-focus-outside v-model="modificarPuestoDialog" class="j-dialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Modificar puesto</div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <QSelectCliente dense outlined clearable v-model="modificarPuestoData.ocupante_id"
                label="Selecciona un ocupante" />
            </div>
            <div class="col-12 text-right text-caption text-grey-6">
              <span>¿El difunto no existe?</span>
              <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary"
                @click="agregarDifuntoDialog.openDialog()" />
            </div>
            <div class="col-12">
              <q-input type="datetime-local" dense outlined stack-label label="Fecha de inhumación"
                v-model="modificarPuestoData.fecha_inhumacion" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Agregar" icon="add" :loading="isLoadingPuestos" @click="handleModificarPuesto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog allow-focus-outside v-model="reasignarFallecidoDialog" class="j-dialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Reasignar fallecido</div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <QSelectCliente dense outlined clearable v-model="reasignarFallecidoData.ocupante_id"
                label="Selecciona un ocupante" />
            </div>
            <div class="col-12 text-right text-caption text-grey-6">
              <span>¿El difunto no existe?</span>
              <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary"
                @click="agregarDifuntoDialog.openDialog()" />
            </div>
            <div class="col-12">
              <QSelectDatetime dense outlined stack-label label="Fecha de inhumación"
                v-model="reasignarFallecidoData.fecha_inhumacion" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Agregar" icon="add" :loading="isLoadingPuestos" @click="handleModificarPuesto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog allow-focus-outside v-model="liberarParcelaDialog" class="j-dialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Liberar ubicación</div>
        </q-card-section>
        <q-card-section>
          <p>
            ¿Estás seguro de liberar esta ubicación? Se desvinculará de todo
            contrato previamente asociado, y los puestos ocupados quedarán
            disponibles.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Liberar" icon="lock_open" :loading="isLoadingPuestos"
            @click="handleSubmitLiberarParcela" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="exhumarPuestoDialog" class="j-dialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Exhumar puesto</div>
        </q-card-section>
        <q-card-section>
          <p>¿Estás seguro de desocupar este puesto?</p>

          <q-checkbox v-model="exhumarPuestoData.generar_servicio" color="primary" dense>
            Generar servicio de exhumación
            <q-icon name="help_outline" />
            <q-tooltip max-width="240px">
              Al marcar esta opción, se generará un registro de la exhumación en el módulo de servicios del Parque.
            </q-tooltip>
          </q-checkbox>

          <q-input class="q-mt-md" outlined dense type="datetime-local" v-model="exhumarPuestoData.fecha_asignado" label="Fecha de exhumación" clearable
            lazy-rules :rules="[val => val && val.length > 0 || 'Selecciona una fecha']" :disable="!exhumarPuestoData.generar_servicio" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Desocupar" icon="eject" :loading="isLoadingPuestos"
            @click="handleSubmitExhumarPuesto" />
        </q-card-actions>
      </q-card>
    </q-dialog>


  </q-dialog>

  <DialogSeleccionarServicio ref="seleccionarServicioDialog"/>
  <DialogCambiarTitular ref="cambiarTitularDialog" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { useRoute } from "vue-router";
import { qNotify, obtenerParcelaExhumableId } from "src/boot/jardines";
import { format } from 'date-fns';
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogGenerarContratosIndividual from "src/components/popups/DialogGenerarContratosIndividual.vue";
import DialogCambiarTitular from "src/components/popups/DialogCambiarTitular.vue";
import DialogSeleccionarServicio from "src/components/popups/DialogSeleccionarServicio.vue";
import QSelectDatetime from "src/components/selects/QSelectDatetime.vue";

// Components
import QSelectCliente from "src/components/selects/QSelectCliente.vue";
import QSelectEstatusParcela from "src/components/selects/QSelectEstatusParcela.vue";
import QSelectSeccion from "src/components/selects/QSelectSeccion.vue";

const seleccionarServicioDialog = ref(null)

const route = useRoute();
const $q = useQuasar();
const splitterModel = ref(20);
const tab = ref("detalles");

function getDMY(date) {
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero based
  let day = ("0" + date.getDate()).slice(-2);
  let ymd = `${day}/${month}/${year}`;
  return ymd;
}

function getYMD(date) {
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero based
  let day = ("0" + date.getDate()).slice(-2);
  let ymd = `${year}-${month}-${day}`;
  return ymd;
}

const dialog = ref(false)
const dataId = ref(null)

const cambiarTitularDialog = ref(null)

const closeDialog = () => dialog.value = false;

const openDialog = (id, event = null) => {
  dataId.value = id;
  getData();
  dialog.value = true
}

defineExpose({ openDialog, closeDialog })

const handleCreatedCliente = (data, targetId) => {
  if (targetId === 'btnAddNewOccupant' && data.id) {
    agregarOcupanteData.value.ocupante_id = data.id
  }
  //getData();
  emit('updated', data)
}

const handleUpdatedCliente = (data, targetId) => {
  console.log('UPDATED', data, targetId)
  console.log('Updated', data, targetId)
  getData();
  emit('updated', data)
}

/**
 * DETALLES
 */

const parcelaDetalles = ref({
  propietario_id: null,
  pariente_mas_cercano: null,
  estatus: null,
  descripcion: null,
  codigo_seccion: null,
  num_parcela: null,
  num_fila: null,
});

const puestosData = ref({});

const agregarOcupanteData = ref({
  ocupante_data: null,
  fecha_inhumacion: null,
  generar_servicio: true,
});

const exhumarPuestoData = ref({
  id: null,
  generar_servicio: true,
})

const agregarClienteDialog = ref(null);
const asignarParcelaDialog = ref(null);
const agregarDifuntoDialog = ref(null);
const agregarOcupanteDialog = ref(null);
const liberarParcelaDialog = ref(null);
const generarContratosDialog = ref(null);

const openDialogGenerarContratos = () => {
  generarContratosDialog.value.openDialog();
};

const contratosParams = ref([]);

const parcelaData = ref([]);

const isLoadingDetalles = ref(true);
const isLoadingPuestos = ref(false);

const handleGenerarContratos = () => {
  getData();
};

const handleSubmitDetalles = () => {
  isLoadingDetalles.value = true;

  let postData = { ...parcelaDetalles.value };

  api
    .post("parcelas/" + dataId.value + "/detalles", postData)
    .then((response) => {
      if (response.data) {
        getData();
        $q.notify({ message: "Guardado exitosamente.", color: "positive" });
        emit('updated', response.data)
      }
    })
    .catch((error) =>
      qNotify(error, "error", { callback: handleSubmitDetalles })
    )
    .finally(() => (isLoadingDetalles.value = false));
};

const handleOcuparPuesto = () => {
  isLoadingPuestos.value = true;

  let postData = agregarOcupanteData.value;

  console.log('handleOcuparPuesto', dataId.value, postData)

  api
    .post("parcelas/" + dataId.value + "/ocupar", postData)
    .then((response) => {
      if (response.data) {
        getData();
        $q.notify({
          message: "Fallecido asignado exitosamente.",
          color: "positive",
        });
        agregarOcupanteDialog.value = false;
        emit('updated', response.data)
      }
    })
    .catch((error) => {
      console.log(error)
      if (error?.response?.data?.messages?.ocupante_id?.includes('propietario de un contrato')) {
        cambiarTitularDialog.value.openDialog({
          cliente_id: agregarOcupanteData.value.ocupante_id,
          select_all: true
        })
      } else if (error?.response?.data?.messages?.generar_servicio) {
        seleccionarServicioDialog.value.openDialog(error.response.data.messages, () => {
          agregarOcupanteData.value.generar_servicio = false;
          handleOcuparPuesto()
        })
      } else {
        qNotify(error, "error", { callback: handleOcuparPuesto })
      }
    })
    .finally(() => (isLoadingPuestos.value = false));
};

const handleModificarPuesto = () => {
  isLoadingPuestos.value = true;

  let postData = modificarPuestoData.value;

  api
    .put("parcelas/puestos/" + postData.id, postData)
    .then((response) => {
      if (response.data) {
        getData();
        $q.notify({
          message: "Puesto modificado exitosamente.",
          color: "positive",
        });
        modificarPuestoDialog.value = false
        emit('updated', response.data)
      }
    })
    .catch((error) => qNotify(error, "error", { callback: handleOcuparPuesto }))
    .finally(() => (isLoadingPuestos.value = false));
};

const handleSubmitLiberarParcela = () => {
  isLoadingPuestos.value = true;

  api
    .post("parcelas/" + dataId.value + "/liberar")
    .then((response) => {
      if (response.data) {
        getData();
        $q.notify({
          message: "Ubicación liberada exitosamente.",
          color: "positive",
        });
        liberarParcelaDialog.value = false
        emit('updated', response.data)
      }
    })
    .catch((error) =>
      qNotify(error, "error", { callback: handleSubmitLiberarParcela })
    )
    .finally(() => (isLoadingPuestos.value = false));
};

const exhumarPuestoDialog = ref(null);

const exhumarPuestoOpenDialog = (puestoId) => {
  exhumarPuestoData.value.id = puestoId;
  exhumarPuestoData.value.generar_servicio = true;
  exhumarPuestoDialog.value = true;
};

function onDragStart(columnIndex, event) {
  event.stopPropagation();

  console.log('onDragStart', columnIndex, event, this.$props.header);
  this.draggedColumnIndex = columnIndex;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', columnIndex);
  event.currentTarget.classList.add('dragging');
}

function onDragEnd(event) {
  event.stopPropagation();

  console.log('onDragEnd', event);
  this.draggedColumnIndex = null;
  event.currentTarget.classList.remove('dragging');
}

function onDragEnter(columnIndex, event) {
  event.stopPropagation();

  console.log('onDragEnter', columnIndex, event);
  this.draggedOverIndex = columnIndex;
  event.currentTarget.classList.add('drag-over');
}

function onDragLeave(columnIndex, event) {
  event.stopPropagation();

  console.log('onDragLeave', columnIndex, event);
  this.draggedOverIndex = null;
  event.currentTarget.classList.remove('drag-over');
}

function onDrop(columnIndex, event) {
  event.stopPropagation();

  console.log('onDrop', columnIndex, event);
  const data = event.dataTransfer.getData('text/plain');
  const sourceIndex = parseInt(data, 10);
  if (sourceIndex !== columnIndex) {
    const columns = [...this.$props.header];
    const column = columns.splice(sourceIndex, 1)[0];
    columns.splice(columnIndex, 0, column);
    this.$emit('on-reorder-columns', columns);
  }
  this.draggedOverIndex = null;
  event.currentTarget.classList.remove('drag-over');
}

const modificarPuestoDialog = ref(null);

const modificarPuestoData = ref({
  id: null,
  ocupante_id: null,
  fecha_inhumacion: null,
});

const modificarPuestoOpenDialog = (puestoId) => {
  Object.keys(modificarPuestoData.value).forEach((i) => {
    modificarPuestoData.value[i] = null;
  });

  if (puestoId) {
    api.get("parcelas/puestos/" + puestoId).then((response) => {
      if (response.data) {
        console.log(response.data);
        Object.keys(response.data).forEach((i) => {
          if (modificarPuestoData.value.hasOwnProperty(i)) {
            modificarPuestoData.value[i] = response.data[i];
          }
        });
        modificarPuestoDialog.value = true;
      }
    });
  }
};

const reasignarFallecidoDialog = ref(null);

const reasignarFallecidoData = ref({
  id: null,
  ocupante_id: null,
  fecha_inhumacion: null,
});

const reasignarFallecidoOpenDialog = (puestoId) => {
  Object.keys(reasignarFallecidoData.value).forEach((i) => {
    reasignarFallecidoData.value[i] = null;
  });

  if (puestoId) {
    api.get("parcelas/puestos/" + puestoId).then((response) => {
      if (response.data) {
        console.log(response.data);
        Object.keys(response.data).forEach((i) => {
          if (reasignarFallecidoData.value.hasOwnProperty(i)) {
            reasignarFallecidoData.value[i] = response.data[i];
          }
        });
        reasignarFallecidoDialog.value = true;
      }
    });
  }
};

const handleSubmitExhumarPuesto = () => {
  isLoadingPuestos.value = true;

  api
    .post("parcelas/" + dataId.value + "/exhumar", exhumarPuestoData.value)
    .then((response) => {
      console.log(exhumarPuestoData.value);
      if (response.data) {
        getData();
        $q.notify({
          message: "Puesto liberado exitosamente.",
          color: "positive",
        });
        emit('updated', response.data)
      }
    })
    .catch((error) => {
      console.log(error)
      if (error?.response?.data?.messages?.generar_servicio) {
        seleccionarServicioDialog.value.openDialog(error.response.data.messages, () => {
          exhumarPuestoData.value.generar_servicio = false;
          handleSubmitExhumarPuesto()
        })
      } else {
        qNotify(error, "error", { callback: handleSubmitExhumarPuesto })
      }
    })

    .finally(() => (isLoadingPuestos.value = false));
};

function getData() {
  isLoadingDetalles.value = true;

  parcelaData.value.recibos = []
  parcelaData.value.mantenimientos = []

  if (!dataId.value) return;

  api
    .get("parcelas/" + dataId.value)
    .then((response) => {
      parcelaData.value = response.data;

      parcelaData.value.puestos = parcelaData.value.puestos.reverse();

      Object.keys(response.data).forEach((i) => {
        if (parcelaDetalles.value.hasOwnProperty(i))
          parcelaDetalles.value[i] = response.data[i];
      });

      if (response.data?.puestos) {
        response.data.puestos.forEach((puesto) => {
          puestosData.value[puesto.id] = puesto;
        });
      }

      api.get("caja/recibos/ubicacion/" + dataId.value).then((response) => {
        if (response.data) {
          parcelaData.value.recibos = response.data
        }
      })

      api.get("mantenimiento/ubicacion/" + dataId.value).then((response) => {
        if (response.data) {
          parcelaData.value.mantenimientos = response.data
        }
      })

    })
    .finally(() => (isLoadingDetalles.value = false));

  api.get("parcelas/params").then((response) => {
    if (response.data) {
      contratosParams.value = response.data;
    }
  });
}

const handleDownloadPdf = (contratoId) => {
  api
    .get("contratos/" + contratoId + "/pdf", { responseType: "blob" })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async (error) => {
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, "error", {
        callback: () => handleDownloadPdf(contratoId),
      });
    });
};

onMounted(() => getData());
const emit = defineEmits(['updated'])

</script>
