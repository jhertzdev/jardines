<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md">
      <div class="text-h6 text-center">
        Parcela {{ parcelaDetalles.codigo_seccion }}-{{
          parcelaDetalles.num_parcela
        }}
      </div>
      <q-splitter v-model="splitterModel" horizontal>
        <template v-slot:before>
          <q-tabs v-model="tab" class="text-grey-5" active-color="primary">
            <q-tab name="detalles" icon="view_timeline" label="Detalles" />
            <q-tab name="puestos" icon="crop_landscape" label="Puestos" />
            <q-tab name="contratos" icon="attach_money" label="Contratos" />
          </q-tabs>
        </template>

        <template v-slot:after>
          <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up">
            <q-tab-panel name="detalles">
              <q-card class="q-pa-md">
                <q-form @submit="handleSubmitDetalles" :class="isLoadingDetalles && 'form-disabled'">
                  <q-card-section>
                    <div class="text-h6">Detalles de la parcela</div>
                    <!--<div class="text-right" v-if="parcelaData.contratos?.length">
                      <q-btn size="md" label="Traspasar parcela" icon="move_up" color="primary"
                        @click="asignarParcelaDialog.openDialog(parcelaData.id)" />
                    </div>-->
                  </q-card-section>

                  <q-card-section>
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
                              Opcional. Es el principal beneficiario de la parcela y
                              controla los derechos de entierro del propietario
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
                        <span class="text-grey-8">Estatus de la parcela</span>
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
                              <th>Tipo de parcela</th>
                              <th>Largo &times; Ancho &times; Alto</th>
                              <th>Puestos</th>
                            </tr>
                          </thead>
                          <tbody>
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
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </q-card-section>

                  <q-card-actions class="justify-end">
                    <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingDetalles" />
                  </q-card-actions>
                </q-form>
              </q-card>
            </q-tab-panel>
            <q-tab-panel name="puestos">
              <div class="full-width q-pa-lg text-center" v-if="!parcelaData.puestos?.length">
                <p>No hay puestos asociados a esta parcela.</p>
              </div>

              <q-card class="q-pa-md" v-else>
                <q-card-section>
                  <div class="text-h6">Puestos de la parcela</div>
                </q-card-section>
                <q-card-section>
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
                      </span>
                    </div>
                    <div class="col-sm col-12">
                      <div class="row q-col-gutter-sm">
                        <div class="col-12 col-md-6">
                          <template v-if="parseInt(puestosData[puesto.id].ocupado)">
                            <q-input readonly dense outlined label="Ocupante" :model-value="`${puestosData[puesto.id].ocupante_nombre} (${puestosData[puesto.id].ocupante_identidad
                              })`" stack-label />
                          </template>
                        </div>
                        <div class="col-12 col-md">
                          <QSelectDatetime readonly dense outlined stack-label label="Fecha de inhumación"
                            v-model="puestosData[puesto.id].fecha_inhumacion"
                            v-if="parseInt(puestosData[puesto.id].ocupado)" />
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
                              <q-item clickable @click="reasignarFallecidoOpenDialog(puesto.id)" v-close-popup>
                                <q-item-section side>
                                  <q-icon color="black" name="wrong_location" />
                                </q-item-section>
                                <q-item-section>Reasignar fallecido</q-item-section>
                              </q-item>
                            </q-list>
                          </q-btn-dropdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
                <q-card-actions class="justify-end">
                  <q-btn @click="liberarParcelaDialog = true" label="Liberar parcela" icon="lock_open" color="primary"
                    :loading="isLoadingPuestos" />
                  <q-btn @click="agregarOcupanteDialog = true" label="Agregar ocupante" icon="add" color="primary"
                    :loading="isLoadingPuestos" />
                </q-card-actions>
              </q-card>
            </q-tab-panel>
            <q-tab-panel name="contratos">
              <div class="full-width q-pa-lg text-center" v-if="!parcelaData.contratos?.length">
                <p>No hay contratos asociados a esta parcela.</p>
                <q-btn color="primary" label="Generar contratos" to="/contratos" />
                <!--<q-btn color="primary" label="Generar contratos" @click="openDialogGenerarContratos" />-->
              </div>
              <q-card class="q-pa-md" v-else>
                <q-form @submit="handleSubmitDetalles" :class="isLoadingDetalles && 'form-disabled'">
                  <q-card-section>
                    <div class="text-h6">Contratos</div>
                  </q-card-section>

                  <q-card-section>
                    <div class="row q-col-gutter-md">
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
                  </q-card-section>

                  <q-card-actions class="justify-end">
                    <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingDetalles" />
                  </q-card-actions>
                </q-form>
              </q-card>
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </q-card>



    <!-- Dialogs -->
    <DialogAgregarCliente ref="agregarClienteDialog" @created="handleCreatedCliente" @updated="handleUpdatedCliente" />
    <DialogAgregarCliente ref="agregarDifuntoDialog" @created="handleCreatedCliente" @updated="handleUpdatedCliente"
      :difunto="true" />
    <DialogAsignarParcela ref="asignarParcelaDialog" />
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
              <QSelectDatetime dense outlined stack-label label="Fecha de inhumación"
                v-model="agregarOcupanteData.fecha_inhumacion" />
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
              <QSelectDatetime dense outlined stack-label label="Fecha de inhumación"
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
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Desocupar" icon="eject" :loading="isLoadingPuestos"
            @click="handleSubmitExhumarPuesto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { useRoute } from "vue-router";
import { qNotify, obtenerParcelaExhumableId } from "src/boot/jardines";
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogAsignarParcela from "src/components/popups/DialogAsignarParcela.vue";
import DialogGenerarContratosIndividual from "src/components/popups/DialogGenerarContratosIndividual.vue";
import QSelectDatetime from "src/components/selects/QSelectDatetime.vue";

// Components
import QSelectCliente from "src/components/selects/QSelectCliente.vue";
import QSelectEstatusParcela from "src/components/selects/QSelectEstatusParcela.vue";
import QSelectSeccion from "src/components/selects/QSelectSeccion.vue";

const route = useRoute();
const $q = useQuasar();
const splitterModel = ref(20);
const tab = ref("detalles");

const dialog = ref(false)
const dataId = ref(null)

const openDialog = (id, event = null) => {
  dataId.value = id;
  getData();
  dialog.value = true
}

defineExpose({ openDialog })

const handleCreatedCliente = (data, targetId) => {
  if (targetId === 'btnAddNewOccupant' && data.id) {
    agregarOcupanteData.value.ocupante_id = data.id
  }
  //getData();
}

const handleUpdatedCliente = (data, targetId) => {
  console.log('UPDATED', data, targetId)
  console.log('Updated', data, targetId)
  getData();
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
});

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

  api
    .post("parcelas/" + dataId.value + "/ocupar", postData)
    .then((response) => {
      if (response.data) {
        getData();
        $q.notify({
          message: "Fallecido asignado exitosamente.",
          color: "positive",
        });
      }
    })
    .catch((error) => qNotify(error, "error", { callback: handleOcuparPuesto }))
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
          message: "Parcela liberada exitosamente.",
          color: "positive",
        });
      }
    })
    .catch((error) =>
      qNotify(error, "error", { callback: handleSubmitLiberarParcela })
    )
    .finally(() => (isLoadingPuestos.value = false));
};

const exhumarPuestoDialog = ref(null);
const exhumarPuestoId = ref(null);

const exhumarPuestoOpenDialog = (puestoId) => {
  exhumarPuestoId.value = puestoId;
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

  let postData = { id: exhumarPuestoId.value };

  api
    .post("parcelas/" + dataId.value + "/exhumar", postData)
    .then((response) => {
      console.log(postData);
      if (response.data) {
        getData();
        $q.notify({
          message: "Puesto liberado exitosamente.",
          color: "positive",
        });
      }
    })
    .catch((error) =>
      qNotify(error, "error", { callback: handleSubmitExhumarPuesto })
    )
    .finally(() => (isLoadingPuestos.value = false));
};

function getData() {
  isLoadingDetalles.value = true;

  api
    .get("parcelas/" + dataId.value)
    .then((response) => {
      parcelaData.value = response.data;

      Object.keys(response.data).forEach((i) => {
        if (parcelaDetalles.value.hasOwnProperty(i))
          parcelaDetalles.value[i] = response.data[i];
      });

      if (response.data?.puestos) {
        response.data.puestos.forEach((puesto) => {
          puestosData.value[puesto.id] = puesto;
        });
      }
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
</script>
