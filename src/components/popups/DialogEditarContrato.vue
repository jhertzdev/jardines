<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md scroll">
      <q-form ref="editarContratosForm" @submit="handleSubmitEditarContratos" @validation-error="onValidationError" @keyup.enter="handleSubmitEditarContratos">
        <q-card-section>
          <div class="text-h6">Editar contrato</div>
        </q-card-section>
        <div class="q-pb-lg text-center" v-if="isLoadingContrato">
          <q-spinner size="xl" color="primary" />
        </div>
        <template v-else-if="contratoData?.num_contrato">
          <q-card-section class="q-py-none">
            <template v-if="contratoData.tipo_parcela == 'Cremacion' && !contratoData.cremaciones?.length">

              <q-banner class="bg-red-3 q-pb-md q-mb-lg">
                <template v-slot:avatar>
                  <q-icon class="q-mt-sm" name="warning" color="black" />
                </template>

                <div class="row">
                  <div class="col-md">
                    <div class="text-h6">Asignar cremación</div>
                    <div>No se encontró ninguna cremación asignada a este contrato.</div>
                  </div>
                  <div class="col-md-auto flex">
                    <q-btn color="primary" label="Asignar" icon="add" @click="openDialogCremacion(null, { cliente_id: contratoData.comprador_id })" />
                  </div>

                </div>
                <template v-slot:action>
                </template>
              </q-banner>

            </template>
            <div class="row q-col-gutter-xl">
              <div class="col-md-6">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-5">

                    <template v-if="authStore.user.role_perms.find((role) => role == 'contratos.*' || role == 'contratos.editar')">
                      <q-input class="input-num-parcela" dense stack-label v-model="contratoData.num_contrato" outlined
                      label="Núm. ctto" lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space>
                      <template v-slot:prepend>
                        <span>{{ contratoData.codigo_contrato }}</span>
                      </template>
                      <template v-slot:after>
                        <q-input label="Serie" dense stack-label v-model="contratoData.num_serie" outlined style="width: 50px;"></q-input>
                      </template>
                    </q-input>
                    </template>
                    <template v-else>
                      <q-input class="input-num-parcela" dense stack-label v-model="contratoData.num_contrato" outlined
                        label="Núm. ctto" lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly>
                        <template v-slot:prepend>
                          <span>{{ contratoData.codigo_contrato }}</span>
                        </template>
                        <template v-slot:after v-if="contratoData.num_serie">
                          <q-input label="Serie" dense stack-label v-model="contratoData.num_serie" outlined style="width: 50px;"></q-input>
                        </template>
                      </q-input>
                    </template>
                  </div>
                  <div class="col-12 col-md-3">
                    <QSelectEstatusContrato label="Estatus" dense outlined required v-model="contratoData.estatus" />
                  </div>
                  <div class="col-4">
                    <q-select dense :options="['Donado', 'Entregado', 'Suspendido', 'Anulado', 'Traspasado', 'Removido', 'Unificado', 'Cambio por cremación']" outlined
                      v-model="contratoData.etiqueta" label="Etiqueta" clearable new-value-mode="add-unique" @update:model-value="val => {
                      if (val == 'Donado') {
                        contratoData.valor_cuota_inicial = 0
                        contratoData.valor_cuota_mensual = 0
                        contratoData.numero_cuotas = 1
                        contratoData.valor_total = 0
                        contratoData.valor_venta = 0
                        contratoData.fecha_vencimiento = null
                      }
                    }" />
                  </div>

                  <template v-if="contratoData.tipo_parcela == 'Cremacion'">
                    <div class="col-12 col-md-4">

                      <q-input dense outlined v-model="contratoData.plan_codigo" label="Plan contratado" clearable @change="val => {
                        if (val && val.startsWith('P-')) {
                          contratoData.plan_descripcion = contratoData.plan_descripcion = 'PROMOCIONES DE CREMACIONES ' + val
                          contratoData.plan_cantidad = 1
                        }
                      }" />

                    </div>

                    <div class="col-12 col-md-3">
                      <q-input dense type="number" outlined v-model="contratoData.plan_cantidad" label="Cantidad" />
                    </div>

                    <div class="col-12 col-md-5">
                      <q-input dense outlined v-model="contratoData.plan_descripcion" label="Descripción del plan" />
                    </div>
                  </template>


                  <div class="col-12">
                    <QSelectEmpresa dense outlined required clearable
                      v-model="contratoData.vendedor_id"
                      label="Selecciona una empresa (vendedor)"
                      rule="El campo es requerido."
                      :filters="{ contrato: contratoData.codigo_contrato }"
                      hide-bottom-space
                      />
                  </div>
                  <div class="col-12">
                    <q-input dense type="textarea" class="no-resize" outlined v-model="contratoData.notas" rows="2" label="Notas" clearable autogrow />
                  </div>
                  <div class="col-12">
                    <QSelectCliente dense v-model="contratoData.comprador_id" outlined clearable label="Cliente relacionado"
                      required @update:model-value="val => handleRellenarCamposDeCliente(val)" hide-bottom-space readonly />
                  </div>
                  <div class="col-12 text-right text-caption text-grey-6 q-mt-sm">
                    <template v-if="parseInt(contratoData.comprador_id)">
                      <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                        agregarClienteDialog.openDialog(contratoData.comprador_id, e)"/>
                      <q-btn flat dense class="q-mr-sm" size="sm" label="Cambiar titular" icon="person" color="primary" @click="(e) =>
                        cambiarTitularDialog.openDialog({
                          cliente_id: contratoData.comprador_id,
                          contrato_id: contratoData.id,
                          num_contrato: contratoData.num_contrato,
                          tipo_parcela: contratoData.tipo_parcela,
                        })"/>
                    </template>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <template v-if="contratoData.tipo_parcela == 'Cremacion'">
                      <q-input dense type="number" outlined v-model="contratoData.cremaciones.length" label="Cant. cremaciones"
                        step="1" readonly />
                    </template>
                    <template v-else>
                      <q-input dense type="number" outlined v-model="contratoData.parcelas.length" label="Cant. ubicaciones"
                        step="1" readonly />
                    </template>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratoData.valor_venta" label="Valor de venta" :readonly="contratoData.etiqueta == 'Donado'" :disable="contratoData.etiqueta == 'Donado'" @update:model-value="val => contratoData.valor_total = val"
                      step="0.01" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratoData.numero_cuotas" label="Núm. cuotas" step="1" :readonly="contratoData.etiqueta == 'Donado'" :disable="contratoData.etiqueta == 'Donado'" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratoData.valor_cuota_inicial" label="Cuota inicial" :readonly="contratoData.etiqueta == 'Donado'" :disable="contratoData.etiqueta == 'Donado'"
                      step="0.01" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense type="number" outlined v-model="contratoData.valor_cuota_mensual" label="Cuota mensual" :readonly="contratoData.etiqueta == 'Donado'" :disable="contratoData.etiqueta == 'Donado'"
                      step="0.01" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input dense outlined v-model="contratoData.valor_total" label="Valor total" :readonly="contratoData.etiqueta == 'Donado'" :disable="contratoData.etiqueta == 'Donado'" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input type="date" dense stack-label outlined v-model="contratoData.fecha_emision" label="Fecha de emisión" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input type="date" dense stack-label outlined v-model="contratoData.fecha_vencimiento" label="Fecha de vencimiento"
                      :readonly="contratoData.etiqueta == 'Donado'" :disable="contratoData.etiqueta == 'Donado'" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input type="date" dense stack-label outlined v-model="contratoData.vigente_hasta" label="Vigente hasta" readonly />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input dense outlined v-model="contratoData.direccion_pago" label="Dirección de pago" />
                  </div>
                </div>
              </div>
            </div>

            <template v-if="contratoData.tipo_parcela != 'Cremacion'">
              <div class="text-h6 text-center q-my-sm">
                Ubicaciones
              </div>

              <div class="row">
                <div class="col-md-8 offset-md-2">


                  <q-table :columns="[
                    { name: 'codigo_parcela', label: 'Cód. parcela', field: 'codigo_parcela', sortable: false, align: 'center' },
                    { name: 'estatus', label: 'Estatus', field: 'estatus', sortable: false, align: 'center' },
                    { name: 'pagado_hasta', label: 'Pagado hasta', field: 'pagado_hasta', sortable: false, align: 'center' },
                  ]" :visible-columns="contratoData.tipo_actividad == 'mantenimiento_parcelas' && contratoData.etiqueta != 'Donado' ? ['codigo_parcela', 'estatus', 'pagado_hasta'] : ['codigo_parcela', 'estatus']" :rows="contratoData.parcelas" row-key="id" separator="cell" selection="multiple"
                    v-model:selected="selectedProducts"
                    :pagination="{rowsPerPage: -1}" hide-bottom
                  >
                    <template v-slot:body-cell-pagado_hasta="props">
                      <q-td :props="props">
                        <template v-if="props.row.pagado_hasta && new Date(props.row.pagado_hasta) != 'Invalid Date'">
                          {{ format(props.row.pagado_hasta, 'dd/MM/yyyy') }}
                        </template>
                        <template v-else>
                          <span>-</span>
                        </template>
                      </q-td>
                    </template>
                  </q-table>
                </div>

                <div class="col-md-12 text-center q-gutter-sm q-mt-sm q-mb-lg">
                  <q-btn color="primary" label="Agregar" icon="add" @click="dialogAgregarProductos = true" />
                  <q-btn color="primary" label="Actualizar fecha" icon="event" @click="openDialogActualizarFechas()" :disable="selectedProducts.length < 1" v-if="contratoData.tipo_actividad == 'mantenimiento_parcelas'" />
                  <q-btn color="primary" label="Liberar" icon="lock_open" @click="handleLiberarProductos()" :disable="selectedProducts.length < 1">
                    <q-tooltip anchor="top middle" self="bottom middle" max-width="240px"
                      v-if="selectedProducts.length < 1">
                      Debes selecciona 1 o más ubicaciones para liberar.
                    </q-tooltip>
                  </q-btn>
                  <q-btn color="primary" label="Desligar" icon="eject" @click="handleDesligarProductos()" :disable="selectedProducts.length < 1">
                    <q-tooltip anchor="top middle" self="bottom middle" max-width="240px"
                      v-if="selectedProducts.length < 1">
                      Debes selecciona 1 o más ubicaciones para desligar.
                    </q-tooltip>
                  </q-btn>
                </div>

                <div class="col-12">


                </div>
              </div>
            </template>

            <template v-else-if="contratoData.cremaciones?.length">
              <div class="text-h6 text-center q-my-sm">
                Cremaciones
              </div>
              <div class="row">
                <div class="col-md-8 offset-md-2">
                  <q-table :columns="[
                    { name: 'num_cremacion', label: 'N° cremación', field: 'num_cremacion', sortable: false, align: 'center' },
                    { name: 'fecha_servicio', label: 'Fecha del servicio', field: 'fecha_servicio', sortable: false, align: 'center' },
                    { name: 'difunto_nombre', label: 'Difunto', field: 'difunto_nombre', sortable: false, align: 'center' },
                    { name: 'acciones', label: 'Acciones', field: 'acciones', sortable: false, align: 'center' },
                  ]" :rows="contratoData.cremaciones" row-key="id" separator="cell"
                    :pagination="{rowsPerPage: -1}" hide-bottom
                  >
                    <template v-slot:body-cell-num_cremacion="props">
                      <q-td :props="props">
                        <a href="javascript:void(0)" @click="(e) => handleVerCremacionPdf(props.row.id)">{{ props.row.num_cremacion }}</a>
                      </q-td>
                    </template>
                    <template v-slot:body-cell-fecha_servicio="props">
                      <q-td :props="props">
                        <template v-if="props.row.fecha_servicio">
                          {{ format(props.row.fecha_servicio, 'dd/MM/yyyy') }}
                        </template>
                        <template v-else>
                          <span>-</span>
                        </template>
                      </q-td>
                    </template>
                    <template v-slot:body-cell-difunto_nombre="props">
                      <q-td :props="props">
                        <template v-if="props.row.difunto_id">
                          <a href="javascript:void(0)" @click="(e) => agregarClienteDialog.openDialog(props.row.difunto_id)">{{ props.row.difunto_nombre }}</a>
                        </template>
                        <template v-else>
                          <span>-</span>
                        </template>
                      </q-td>
                    </template>
                    <template v-slot:body-cell-acciones="props">
                      <q-td :props="props">
                        <q-btn-dropdown dense size="sm" color="primary" flat icon="more_horiz">
                          <q-list>
                            <q-item clickable @click="openDialogCremacion(props.row.id)" v-close-popup>
                              <q-item-section side>
                                <q-icon color="black" name="edit" />
                              </q-item-section>
                              <q-item-section>Editar</q-item-section>
                            </q-item>
                            <q-item clickable @click="handleEliminarCremacion(props.row.id)" v-close-popup>
                              <q-item-section side>
                                <q-icon color="black" name="delete" />
                              </q-item-section>
                              <q-item-section>Eliminar</q-item-section>
                            </q-item>
                          </q-list>
                        </q-btn-dropdown>
                      </q-td>
                    </template>
                  </q-table>

                  <div class="col-md-12 text-center q-gutter-sm q-mt-sm q-mb-lg">
                    <q-btn color="primary" label="Asignar cremación" icon="add" @click="openDialogCremacion(null, { cliente_id: contratoData.comprador_id })" />
                  </div>
                </div>
              </div>
            </template>

          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn color="primary" label="Guardar" icon="description" :loading="isLoadingSubmit"
              @click="editarContratosForm.submit()" />
          </q-card-actions>
        </template>
        <q-card-section v-else>
          <p class="text-center">Contrato no encontrado.</p>
        </q-card-section>


      </q-form>

    </q-card>
  </q-dialog>

  <q-dialog allow-focus-outside v-model="dialogAgregarProductos" class="j-dialog">

    <q-card class="q-pa-md scroll">
      <q-form>

        <q-card-section>
          <div class="text-h6">Agregar ubicaciones</div>
        </q-card-section>

        <q-card-section class="q-py-none">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <QSelectParcelas dense v-model="addProducts" outlined clearable
                :label="`Selecciona las ubicaciones a asignar`" required
                :rule="`Debes seleccionar al menos una ubicación`"

                 />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Agregar" icon="add" :loading="isLoadingSubmit" @click="handleSubmitAgregarProductos"/>
        </q-card-actions>

      </q-form>
    </q-card>

  </q-dialog>

  <q-dialog allow-focus-outside v-model="dialogAgregarCremacion" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md scroll">
      <q-form ref="agregarCremacionForm" @submit="handleSubmitAgregarCremacion" @validation-error="onValidationError">
        <q-card-section>
          <div class="text-h6">Agregar cremación</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-6 col-md-3">
              <q-input dense v-model="agregarCremacionData.num_cremacion" outlined label="Núm. cremación" required :rules="[val => val && val.length > 0]" hide-bottom-space />
            </div>
            <div class="col-6 col-md-3">
              <q-input dense v-model="agregarCremacionData.libro_registro" outlined label="Año registro" required :rules="[val => val && val.length > 0]" hide-bottom-space />
            </div>
            <div class="col-12 col-md-6">
              <q-input type="datetime-local" dense stack-label outlined v-model="agregarCremacionData.fecha_servicio" label="Fecha del servicio"></q-input>
            </div>
            <div class="col-12 col-md-8 text-right text-caption text-grey-6">
              <QSelectCliente dense v-model="agregarCremacionData.cliente_id" outlined label="Cliente" required @selected="val => handleCremacionSelectCliente(val)" readonly />
              <template v-if="parseInt(agregarCremacionData.cliente_id)">
                <q-btn flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                  agregarClienteDialog.openDialog(agregarCremacionData.cliente_id, null, {
                    onUpdate: (data) => handleCremacionSelectCliente(data),
                    onCreate: (data) => handleCremacionSelectCliente(data),
                  })"/>
              </template>
            </div>
            <div class="col-12 col-md-4">
              <q-input dense v-model="agregarCremacionData.relacion_fallecido" outlined label="Relación con el fallecido" lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space />
            </div>
            <div class="col-12 col-md-12">
              <q-input type="textarea" rows="2" autogrow dense v-model="agregarCremacionData.cliente_direccion_habitacion" outlined label="Dirección del cliente" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space />
            </div>

            <div class="col-12">
              <q-separator class="q-my-sm" size="2px" />
            </div>

            <div class="col-12 text-right text-caption text-grey-6">
              <QSelectCliente dense v-model="agregarCremacionData.difunto_id" outlined clearable label="Difunto" required @selected="val => handleCremacionSelectDifunto(val)" @clear="handleCremacionSelectDifunto(null)" />
              <template v-if="parseInt(agregarCremacionData.difunto_id)">
                <q-btn flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                  agregarClienteDialog.openDialog(agregarCremacionData.difunto_id, null, {
                    onUpdate: (data) => handleCremacionSelectDifunto(data),
                    onCreate: (data) => handleCremacionSelectDifunto(data),
                  })"/>
              </template>
              <span>¿El difunto no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                color="primary" @click="agregarDifuntoDialog.openDialog()" />
            </div>
            <div class="col-6 col-md-3">
              <q-input dense v-model="agregarCremacionData.difunto_doc_identidad" outlined label="Nacionalidad" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly />
            </div>
            <div class="col-6 col-md-4">
              <q-input dense v-model="agregarCremacionData.difunto_doc_numero" outlined label="N° ident. (difunto)" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly />
            </div>
            <div class="col-6 col-md-5">
              <QSelectDatetime dense stack-label outlined v-model="agregarCremacionData.difunto_fecha_nacimiento" label="Fecha nacim." ref="difuntoCremacionFechaNacimiento" />
            </div>
            <div class="col-12 col-md-4">
              <QSelectDatetime dense stack-label outlined v-model="agregarCremacionData.difunto_fecha_muerte" label="Fecha muerte" ref="difuntoCremacionFechaMuerte"/>
            </div>
            <div class="col-6 col-md-4">
              <q-input dense v-model="agregarCremacionData.difunto_certificado_defuncion" outlined label="N° de certificado" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space />
            </div>
            <div class="col-6 col-md-4">
              <q-input dense v-model="agregarCremacionData.difunto_doctor_firmante" outlined label="Doctor firmante" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space />
            </div>
            <div class="col-12 col-md-12">
              <q-input type="textarea" rows="2" autogrow dense v-model="agregarCremacionData.difunto_causa_muerte" outlined label="Causa de muerte" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space />
            </div>

            <div class="col-12">
              <q-input dense outlined v-model="agregarCremacionData.difunto_direccion_habitacion" label="Dirección del difunto" hide-bottom-space />
            </div>

            <div class="col-12">
              <q-separator class="q-my-sm" size="2px" />
            </div>

            <div class="col-12 col-md-8 text-right text-caption text-grey-6">
              <QSelectCliente dense v-model="agregarCremacionData.testigo_1_id" outlined clearable label="Testigo 1" required @selected="val => handleCremacionSelectTestigo1(val)" @clear="handleCremacionSelectTestigo1(null)" />
              <template v-if="parseInt(agregarCremacionData.testigo_1_id)">
                <q-btn flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                  agregarClienteDialog.openDialog(agregarCremacionData.testigo_1_id, null, {
                    onUpdate: (data) => handleCremacionSelectTestigo1(data),
                  })"/>
              </template>
              <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                color="primary" @click="agregarClienteDialog.openDialog(null, null, {
                    onCreate: (data) => handleCremacionSelectTestigo1(data),
                  })" />
            </div>
            <div class="col-12 col-md-4">
              <q-input dense v-model="agregarCremacionData.testigo_1_identidad" outlined label="#1) N° de identidad" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly ref="testigo1Identidad" />
            </div>
            <div class="col-12 col-md-8">
              <q-input dense v-model="agregarCremacionData.testigo_1_nombre" outlined label="#1) Nombre del testigo" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly ref="testigo1Nombre" />
            </div>
            <div class="col-12 col-md-4">
              <q-input dense v-model="agregarCremacionData.testigo_1_telefono" outlined label="#1) N° de teléfono" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly ref="testigo1Telefono" />
            </div>

            <div class="col-12">
              <q-separator class="q-my-sm" size="2px" />
            </div>

            <div class="col-12 col-md-8 text-right text-caption text-grey-6">
              <QSelectCliente dense v-model="agregarCremacionData.testigo_2_id" outlined clearable label="Testigo 2" required @selected="val => handleCremacionSelectTestigo2(val)" @clear="handleCremacionSelectTestigo2(null)" />
              <template v-if="parseInt(agregarCremacionData.testigo_2_id)">
                <q-btn flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit" color="primary" @click="(e) =>
                  agregarClienteDialog.openDialog(agregarCremacionData.testigo_2_id, null, {
                    onUpdate: (data) => handleCremacionSelectTestigo2(data),
                  })"/>
              </template>
              <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                color="primary" @click="agregarClienteDialog.openDialog(null, null, {
                    onCreate: (data) => handleCremacionSelectTestigo2(data),
                  })" />
            </div>
            <div class="col-12 col-md-4">
              <q-input dense v-model="agregarCremacionData.testigo_2_identidad" outlined label="#1) N° de identidad" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly ref="testigo2Identidad" />
            </div>
            <div class="col-12 col-md-8">
              <q-input dense v-model="agregarCremacionData.testigo_2_nombre" outlined label="#1) Nombre del testigo" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly ref="testigo2Nombre" />
            </div>
            <div class="col-12 col-md-4">
              <q-input dense v-model="agregarCremacionData.testigo_2_telefono" outlined label="#1) N° de teléfono" required lazy-rules :rules="[val => val && val.length > 0]" hide-bottom-space readonly ref="testigo2Telefono" />
            </div>

            <div class="col-12">
              <q-checkbox v-model="agregarCremacionData.generar_servicio" color="primary" dense>
                Generar servicio de cremación
                <q-icon name="help_outline" />
                <q-tooltip max-width="240px">
                  Al marcar esta opción, se generará un registro de la cremación en el módulo de servicios del Parque.
                </q-tooltip>
              </q-checkbox>
            </div>


          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Agregar cremación" :loading="isLoadingSubmit" @click="agregarCremacionForm.submit()"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog allow-focus-outside v-model="dialogActualizarFechas" class="j-dialog">
    <q-card class="q-pa-md scroll">
      <q-form ref="actualizarFechasForm" @submit="handleSubmitActualizarFechas" @keyup.enter="handleSubmitActualizarFechas">
        <q-card-section>
          <div class="text-h6">Actualizar fechas</div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <q-table class="q-mb-lg" :columns="[
            { name: 'codigo_parcela', label: 'Cód. parcela', field: 'codigo_parcela', sortable: false, align: 'center' },
            { name: 'pagado_hasta', label: 'Pagado hasta', field: 'pagado_hasta', sortable: false, align: 'center' },
          ]" :rows="selectedProducts" row-key="id" separator="cell"
            :pagination="{rowsPerPage: -1}" hide-bottom
          >
            <template v-slot:body-cell-pagado_hasta="props">
              <q-td :props="props">
                <q-input type="date"
                  dense outlined
                  v-model="props.row.nuevo_pagado_hasta"
                  @update:model-value="handleUpdateFecha(props.row.nuevo_pagado_hasta)" />
              </q-td>
            </template>
          </q-table>
          <q-checkbox v-model="contratoData.actualizarTodasFechas" label="Actualizar todas las fechas" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Actualizar fechas" icon="event" :loading="isLoadingSubmit" @click="actualizarFechasForm.submit()"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <DialogAgregarCliente ref="agregarClienteDialog" />
  <DialogAgregarDifunto ref="agregarDifuntoDialog" :difunto="true" />
  <DialogCambiarTitular ref="cambiarTitularDialog" @updated="openDialog(contratoData.id); emit('updated')" />
  <DialogSeleccionarServicio ref="seleccionarServicioDialog"/>

</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, watch, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, scroll } from 'quasar';
import { qNotify } from 'src/boot/jardines';
import { format } from 'date-fns';
import { useAuthStore } from 'stores/auth.store'

// Components
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
import QSelectEmpresa from 'src/components/selects/QSelectEmpresa.vue'
import QSelectEstatusContrato from 'src/components/selects/QSelectEstatusContrato.vue'
import QSelectParcelas from 'src/components/selects/QSelectParcelas.vue'
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogAgregarDifunto from "src/components/popups/DialogAgregarCliente.vue";
import DialogCambiarTitular from "src/components/popups/DialogCambiarTitular.vue";
import DialogSeleccionarServicio from 'src/components/popups/DialogSeleccionarServicio.vue';
import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';

const $q = useQuasar()
const dialog = ref(false)
const dialogAgregarProductos = ref(false)
const dialogAgregarCremacion = ref(false)
const dialogActualizarFechas = ref(false)
const step = ref(0)
const route = useRoute()
const authStore = useAuthStore()

const agregarClienteDialog = ref(null)
const agregarDifuntoDialog = ref(null)
const cambiarTitularDialog = ref(null)
const seleccionarServicioDialog = ref(null)
const editarContratosForm = ref(null)
const actualizarFechasForm = ref(null)
const agregarCremacionForm = ref(null)

const cremacionFechaServicio = ref(null)
const difuntoCremacionFechaNacimiento = ref(null)
const difuntoCremacionFechaMuerte = ref(null)

const selectedProducts = ref([])
const addProducts = ref([])

const openDialogCremacion = (cremacionId = null, params = {}) => {
  for (let key in agregarCremacionData.value) {
    agregarCremacionData.value[key] = ''
    agregarCremacionData.value.generar_servicio = true
  }

  if (cremacionId === null) {
    if (params.cliente_id) {
      agregarCremacionData.value.cliente_id = params.cliente_id
      api.get('clientes/' + params.cliente_id)
        .then(response => {
          if (response.data) {
            agregarCremacionData.value.cliente_direccion_habitacion = response.data.direccion_habitacion || ''
          }
        })
    }
  } else {

    api.get('cremaciones/' + cremacionId)
      .then(response => {
        if (response.data) {
          for (let key in response.data) {
            if (Object.keys(agregarCremacionData.value).includes(key)) {
              agregarCremacionData.value[key] = response.data[key]
            }

            if (key === 'difunto_fecha_nacimiento') {
              difuntoCremacionFechaNacimiento.value.setDateValue(response.data[key] || '')
            }

            if (key === 'difunto_fecha_muerte') {
              difuntoCremacionFechaMuerte.value.setDateValue(response.data[key] || '')
            }
          }
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => openDialogCremacion(cremacionId, params) }))

  }

  dialogAgregarCremacion.value = true;
}

const agregarCremacionData = ref({
  id: '',
  num_cremacion: '',
  libro_registro: '',
  fecha_servicio: '',
  cliente_id: '',
  relacion_fallecido: '',
  cliente_direccion_habitacion: '',
  difunto_id: '',
  difunto_doc_numero: '',
  difunto_doc_identidad: '',
  difunto_fecha_nacimiento: '',
  difunto_fecha_muerte: '',
  difunto_causa_muerte: '',
  difunto_certificado_defuncion: '',
  difunto_doctor_firmante: '',
  difunto_direccion_habitacion: '',
  testigo_1_id: '',
  testigo_1_nombre: '',
  testigo_1_identidad: '',
  testigo_1_telefono: '',
  testigo_2_id: '',
  testigo_2_nombre: '',
  testigo_2_identidad: '',
  testigo_2_telefono: '',
  generar_servicio: true,
})

const props = defineProps({
  propietarioId: {
    type: String,
    default: null
  },
  parcelas: {
    type: Object,
    default: {}
  },
  params: {
    type: Object,
    default: []
  }
})

const selectEditarContratos = ref([])
const contratoData = ref(null)

const { getScrollTarget, setVerticalScrollPosition } = scroll
const onValidationError = (ref) => {
  const el = ref.$el
  setVerticalScrollPosition(getScrollTarget(el), el.offsetTop, 200)
}

watch(contratoData, (value) => {
  /*if (!Object.keys(value).includes(step.value)) {
    step.value = Object.keys(value)[0] || null;
  }

  // Auto-calcular precios
  Object.keys(value).forEach(codigo => {
    let cantidadParcelas = value[codigo].parcelas?.length || 0
    let valorVenta = parseFloat(value[codigo].valor_venta || 0)
    let numeroCuotas = parseInt(value[codigo].numero_cuotas || 1)
    let cuotaInicial = parseFloat(value[codigo].valor_cuota_inicial || 0)
    let cuotaMensual = parseFloat(value[codigo].valor_cuota_mensual || 0)

    if (value[codigo].autocalcular_total) {
      contratosData.value[codigo].valor_total = cantidadParcelas * (valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual)
    } else {
      contratosData.value[codigo].valor_total = valorVenta + cuotaInicial + (numeroCuotas - 1) * cuotaMensual
    }
  });

  // Autoeditar código de contrato
  Object.keys(value).forEach(codigo => {
    if (contratosData.value[codigo].autoeditar_numero) {
      contratosData.value[codigo].num_contrato = contratosParams.value?.siguiente_num_contrato
    }
  });*/

}, { deep: true })

const handleRellenarCamposDeCliente = (value, codigo) => {

  console.log('Rellenar');
  api.get('clientes/' + value)
    .then(response => {
      if (response.data) {
        ['nombre', 'doc_numero', 'doc_identidad', 'apellido', 'fecha_nacimiento', 'direccion_habitacion', 'direccion_trabajo',
          'estado_civil', 'genero', 'email', 'telefono_principal', 'telefono_secundario'].forEach(key => {
            contratoData['cliente'][key] = response.data[key]
          });
      }
    })
}

const handleSubmitEditarContratos = (e) => {
  if (e?.target?.tagName === 'TEXTAREA') {
    return
  }

  isLoadingSubmit.value = true

  if (!parseInt(contratoData.value?.num_serie)) {
    contratoData.value.num_serie = null
  }

  api.put('contratos/' + contratoData.value.id, contratoData.value)
    .then(response => {
      if (response.data) {
        dialog.value = false
        $q.notify({ message: 'Contrato editado exitosamente.', color: 'positive' })
        emit('updated', response.data)
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitEditarContratos))
    .finally(() => isLoadingSubmit.value = false)

}

const handleEliminarCremacion = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Eliminar cremación',
      message: '¿Estás seguro de que quieres eliminar esta cremación?',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Eliminar',
        color: 'primary',
        flat: true,
        icon: 'delete'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      handleEliminarCremacion(id, true)
    })
  } else {
    isLoadingSubmit.value = true
    api.delete('cremaciones/' + id)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
          emit('updated', response.data)
          openDialog(contratoData.value.id)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEliminarCremacion(id) }))
      .finally(() => isLoadingSubmit.value = false)
  }
}

const handleSubmitAgregarCremacion = () => {
  isLoadingSubmit.value = true

  api.post('contratos/' + contratoData.value.id + '/agregarCremacion', agregarCremacionData.value)
    .then(response => {
      if (response.data) {
        for (let key in agregarCremacionData.value) {
          agregarCremacionData.value[key] = ''
        }

        dialogAgregarCremacion.value = false
        emit('updated', response.data)

        openDialog(contratoData.value.id)
        $q.notify({ message: 'Cremación agregada exitosamente.', color: 'positive' })
      }
    })


    .catch((error) => {
      console.log(error)
      if (error?.response?.data?.messages?.generar_servicio) {
        seleccionarServicioDialog.value.openDialog(error.response.data.messages, () => {
          agregarCremacionData.value.generar_servicio = false;
          handleSubmitAgregarCremacion()
        })
      } else {
        qNotify(error, "error", { callback: handleSubmitAgregarCremacion })
      }
    })


    .catch((error) => qNotify(error, 'error', handleSubmitAgregarCremacion))
    .finally(() => isLoadingSubmit.value = false)
}

const handleVerCremacionPdf = (cremacionId) => {
  api
    .get("cremaciones/" + cremacionId + "/pdf", { responseType: "blob" })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async (error) => {
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, "error", {
        callback: () => handleVerCremacionPdf(cremacionId),
      });
    });
};

const handleCremacionSelectCliente = (cliente) => {
  agregarCremacionData.value.cliente_direccion_habitacion = cliente?.direccion_habitacion || ''
}

const handleCremacionSelectDifunto = (difunto) => {
  agregarCremacionData.value.difunto_doc_numero = difunto?.doc_numero || ''
  agregarCremacionData.value.difunto_doc_identidad = difunto?.doc_identidad || ''

  if (difuntoCremacionFechaNacimiento.value) {
    agregarCremacionData.value.difunto_fecha_nacimiento = difunto?.fecha_nacimiento || ''
    difuntoCremacionFechaNacimiento.value.setDateValue(difunto?.fecha_nacimiento || '')
  }

  if (difuntoCremacionFechaMuerte.value) {
    agregarCremacionData.value.difunto_fecha_muerte = difunto?.fecha_muerte || ''
    difuntoCremacionFechaMuerte.value.setDateValue(difunto?.fecha_muerte || '')
  }

  agregarCremacionData.value.difunto_causa_muerte = difunto?.causa_muerte || ''
  agregarCremacionData.value.difunto_certificado_defuncion = difunto?.certificado_defuncion || ''
  agregarCremacionData.value.difunto_doctor_firmante = difunto?.doctor_firmante || ''
  agregarCremacionData.value.difunto_direccion_habitacion = difunto?.direccion_habitacion || ''
}

const handleCremacionSelectTestigo1 = (cliente) => {
  agregarCremacionData.value.testigo_1_id = cliente?.id || ''
  agregarCremacionData.value.testigo_1_nombre = cliente?.nombre_completo || ''
  agregarCremacionData.value.testigo_1_identidad = cliente?.num_identidad || ''
  agregarCremacionData.value.testigo_1_telefono = cliente?.telefono_principal || ''
}

const handleCremacionSelectTestigo2 = (cliente) => {
  agregarCremacionData.value.testigo_2_id = cliente?.id || ''
  agregarCremacionData.value.testigo_2_nombre = cliente?.nombre_completo || ''
  agregarCremacionData.value.testigo_2_identidad = cliente?.num_identidad || ''
  agregarCremacionData.value.testigo_2_telefono = cliente?.telefono_principal || ''
}

const openDialogActualizarFechas = () => {
  dialogActualizarFechas.value = true
  contratoData.value.actualizarTodasFechas = true
}

const handleUpdateFecha = (fecha) => {
  if (contratoData.value.actualizarTodasFechas) {
    selectedProducts.value.forEach(ubicacion => {
      ubicacion.nuevo_pagado_hasta = fecha
    })
  }
}

const handleSubmitActualizarFechas = () => {
  isLoadingSubmit.value = true

  let postData = selectedProducts.value.map(ubicacion => {
    return {
      ubicacion_id: ubicacion.id,
      contrato_id: contratoData.value.id,
      nuevo_pagado_hasta: ubicacion.nuevo_pagado_hasta,
    }
  })

  console.log('postData', postData)

  api.post('contratos/' + contratoData.value.id + '/actualizarFechas', postData)
    .then(response => {
      if (response.data) {
        dialogActualizarFechas.value = false
        selectedProducts.value = []
        openDialog(contratoData.value.id)
        emit('updated', response.data)
        $q.notify({ message: 'Fechas actualizadas exitosamente.', color: 'positive' })
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitActualizarFechas))
    .finally(() => isLoadingSubmit.value = false)

}

const handleSubmitAgregarProductos = () => {
  isLoadingSubmit.value = true

  let postData = Object.values(addProducts.value)

  api.post('contratos/' + contratoData.value.id + '/agregarProductos', postData)
    .then(response => {
      if (response.data) {
        dialogAgregarProductos.value = false
        addProducts.value = []
        openDialog(contratoData.value.id)
        emit('updated', response.data)
        $q.notify({ message: 'Agregados exitosamente.', color: 'positive' })
      }
    })
    .catch((error) => qNotify(error, 'error', handleSubmitAgregarProductos))
    .finally(() => isLoadingSubmit.value = false)

}

const handleDesligarProductos = (confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Desligar ubicaciones',
      message: '¿Estás seguro de que quieres desligar las ubicaciones del contrato seleccionado?',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Desligar ubicaciones',
        color: 'primary',
        flat: true,
        icon: 'eject'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      handleDesligarProductos(true)
    })
  } else {
    isLoadingSubmit.value = true

    let postData = selectedProducts?.value?.map(parcela => {
      return parcela.id
    }) || []

    api.post('contratos/' + contratoData.value.id + '/desligarProductos', postData)
      .then(response => {
        if (response.data) {
          console.log(response.data);
          selectedProducts.value = []
          openDialog(contratoData.value.id)
          emit('updated', response.data)
          $q.notify({ message: 'Desligados exitosamente.', color: 'positive' })
        }
      })
      .catch((error) => qNotify(error, 'error', handleDesligarProductos(false)))
      .finally(() => isLoadingSubmit.value = false)
  }


}

const handleLiberarProductos = (confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Liberar ubicaciones',
      message: '¿Estás seguro de que quieres liberar las ubicaciones? Se desligarán de cualquier contrato que tenga, y quedarán en estatus "Disponible", para poder ser asignadas a otro contrato o titular, incluso si tienen fallecidos. Esta acción no se puede deshacer.',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Liberar ubicaciones',
        color: 'primary',
        flat: true,
        icon: 'eject'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      handleLiberarProductos(true)
    })
  } else {

    isLoadingSubmit.value = true

    let postData = selectedProducts?.value?.map(parcela => {
      return parcela.id
    }) || []

    api.post('contratos/' + contratoData.value.id + '/liberarProductos', postData)
      .then(response => {
        if (response.data) {
          console.log('contratos/' + contratoData.value.id + '/liberarProductos', postData);
          selectedProducts.value = []
          openDialog(contratoData.value.id)
          emit('updated', response.data)
          $q.notify({ message: 'Liberados exitosamente.', color: 'positive' })
        }
      })
      .catch((error) => qNotify(error, 'error', handleLiberarProductos(false)))
      .finally(() => isLoadingSubmit.value = false)
    }
}

const isLoadingSubmit = ref(false)
const isLoadingContrato = ref(true)

const openDialog = (id) => {
  isLoadingContrato.value = true
  selectedProducts.value = []

  api.get('contratos/' + id)
    .then(response => {
      if (response.data) {

      console.log('contratos', response.data);


        contratoData.value = response.data
        console.log(response.data);
        if (!contratoData.value.cliente) contratoData.value.cliente = {}

        console.log(contratoData.value);

        if (contratoData.value.fecha_emision && new Date(contratoData.value.fecha_emision) != 'Invalid Date') {
          contratoData.value.fecha_emision =  format(contratoData.value.fecha_emision, 'yyyy-MM-dd')
        }

        if (contratoData.value.fecha_vencimiento && new Date(contratoData.value.fecha_vencimiento) != 'Invalid Date') {
          contratoData.value.fecha_vencimiento =  format(contratoData.value.fecha_vencimiento, 'yyyy-MM-dd')
        }

        if (contratoData.value.vigente_hasta && new Date(contratoData.value.vigente_hasta) != 'Invalid Date') {
          contratoData.value.vigente_hasta =  format(contratoData.value.vigente_hasta, 'yyyy-MM-dd')
        }

        contratoData.value.parcelasIds = contratoData.value.parcelas?.map(parcela => {
          console.log(parcela.id);
          return parcela.id
        }) || []
        contratoData.value.autocalcular_total = false


      }
    })
    .finally(() => isLoadingContrato.value = false)
  dialog.value = true
}

defineExpose({ openDialog })
const emit = defineEmits(['created', 'updated'])

const contratosParams = ref(null)
const siguienteNumContrato = ref('');

onMounted(() => {
  api.get('parcelas/params')
    .then(response => {
      if (response.data) {
        contratosParams.value = response.data
      }
    })
})

</script>
