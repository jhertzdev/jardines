<style>
  .q-table .q-field__native {
    font-size: 13px;
    color: #000;
  }

  .q-table .q-select .q-chip__content {
    overflow: hidden;
  }

  .q-table .q-select .q-field__control {
    width: 100%;
    max-width: 230px;
  }

  .q-select.select-ubicaciones-linea .q-field__control {
    max-width: 100%;
  }

  .select-ubicaciones-linea .q-field__marginal {
    height: 20px;
  }

  .select-ubicaciones-linea .q-field__native {
    padding: 1px 0 0 0;
  }

  .select-ubicaciones-linea .q-field__control,
  .select-ubicaciones-linea .q-field__native {
    min-height: 20px !important;
  }

  .select-ubicaciones-linea .q-placeholder {
    font-size: 11px;
    min-height: 20px;
  }

  .select-ubicaciones-linea .q-chip--dense {
    margin: 0 1px 1px 0;
    font-size: 11px;
    letter-spacing: -0.5px;

  }
</style>
<template>
  <q-form @submit="handleSubmitGenerarRecibo" class="no-bottoms">
    <!--<q-card class="q-pa-md q-mb-lg">
      <q-card-section class="q-py-sm">
        <div class="row q-col-gutter-md q-mb-md">

        </div>
        <div class="row q-col-gutter-md">
          <div class="col-md-6">
            <div class="row q-col-gutter-md">
              <div class="col-6 col-sm-auto flex items-center">
                <div class="text-weight-bold" style="width: 120px">Tipo de recibo</div>
              </div>
              <div class="col-6 col-sm">
                <q-option-group class="q-gutter-sm" dense v-model="reciboData.tipo_factura" :options="tiposFactura"
                  color="primary" @update:model-value="handleChangeTipoFactura" />
              </div>
            </div>
          </div>
          <div class="col-md-6">

          </div>
          <div class="col-md-6" v-if="['mantenimiento_propiedad'].includes(reciboData.tipo_factura)">
            <div class="row q-col-gutter-md">
              <div class="col-6 col-sm-auto flex items-center">
                <div class="text-weight-bold" style="width: 120px">Copiar desde otro contrato</div>
              </div>
              <div class="col-6 col-sm">
                <QSelectContratos :multiple="false" dense outlined v-model="reciboData.copiar_contrato_id" clearable />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>-->

    <q-card class="q-pa-md q-mb-lg" v-show="['venta_propiedad', 'mantenimiento_propiedad'].includes(reciboData.tipo_factura)">
      <div class="q-card-section">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md flex items-center">
            <div class="text-weight-bold">Tipo de ubicación</div>
          </div>
          <div class="col-12 col-md-auto">
            <q-option-group class="q-gutter-sm" dense inline v-model="reciboData.tipo_ubicacion"
              :options="tiposUbicacion" color="primary" @update:model-value="parcelasSelected = []; tableData = []" />
          </div>
        </div>
      </div>
      <div class="q-card-section q-mt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-table :rows="parcelas" flat :columns="parcelasColumnas" row-key="id"
              :class="!$q.screen.lt.md && 'text-wrap'" ref="parcelasTableRef"
              v-model:pagination="parcelasTablePagination" :loading="parcelasTableLoading" :filter="parcelasTableFilter"
              @request="parcelasTableRequest" selection="multiple" v-model:selected="parcelasSelected">
              <template v-slot:top-right>
                <q-input dense debounce="300" v-model="parcelasTableFilter" placeholder="Buscar...">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>
              <template v-slot:body-cell-codigo_parcela="props">
                <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
                  {{ props.value }}
                </q-td>
              </template>
              <template v-slot:body-cell-propietario="props">
                <q-td :props="props" class="q-gutter-xs">
                  <template v-if="props.row.cliente_nombre || props.row.cliente_identidad">
                    {{ props.row.cliente_nombre }} ({{ props.row.cliente_identidad }})
                  </template>
                  <template v-else>-</template>
                </q-td>
              </template>
              <template v-slot:body-cell="props">
                <q-td :props="props">
                  {{ props.value || '-' }}
                </q-td>
              </template>
            </q-table>
          </div>
          <div class="col-12 col-md-4 flex items-center justify-center">
            <q-list bordered v-if="parcelasSelected.length">
              <q-item v-for="(parcela, index) in parcelasSelected" :key="index">
                <q-item-section>
                  {{ parcela.codigo_parcela }}
                </q-item-section>
                <q-item-section side>
                  <q-btn icon="delete" color="red" dense @click="parcelasSelected.splice(index, 1);" />
                </q-item-section>
              </q-item>
              <q-item>
                <q-btn icon="assignment" color="primary" @click="openDialogAsignarPuestos()" label="Asignar puestos" />
              </q-item>
            </q-list>
            <q-list bordered v-else>
              <q-item>
                <q-item-section>
                  <div class="text-grey-5">No hay ubicaciones seleccionadas</div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>
    </q-card>

    <q-card v-if="reciboData.tipo_factura && reciboData.empresa_id && (reciboData.tipo_factura == 'venta_propiedad' ? parcelasSelected.length : true)">
      <div class="q-card-section">
        <q-card-section>
          <div class="text-h6">Nuevo recibo {{ siguienteNumeroRecibo }} </div>
        </q-card-section>
        <q-card-section>

          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-4">
              <QSelectCliente dense outlined v-model="reciboData.cliente_id" clearable required
                rule="Este campo es requerido." :filters="{ difunto: 0 }" label="Cliente relacionado" />
              <div class="text-right text-caption text-grey-6">
                <template v-if="parseInt(reciboData.cliente_id)">
                  <q-btn id="btnEditInvoiceClient" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit"
                    color="primary" @click="(e) =>
                      agregarClienteDialog.openDialog(reciboData.cliente_id, e)" />
                </template>
                <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                  color="primary" @click="agregarClienteDialog.openDialog()" />
              </div>
            </div>
            <div class="col-md-4">
              <q-input dense outlined :model-value="appStore.cajaSeleccionada.razon_social || '-'" label="Razón social" readonly/>
            </div>
            <div class="col-md-4">
              <QSelectMoneda dense outlined v-model="reciboData.moneda_id" required
                rule="Este campo es requerido." label="Moneda" />
            </div>
            <div class="col-md-4">
              <q-input type="number" dense outlined v-model="reciboData.num_transaccion"
                :class="reciboData.autogenerar_numero && 'bg-grey-3'" :disable="reciboData.autogenerar_numero"
                lazy-rules :rules="[val => val && val.length > 0 || '']" label="Número de recibo" />
                <div class="text-right">
                  <q-checkbox size="sm" dense v-model="reciboData.autogenerar_numero" label="Autogenerar"
                    style="font-size: 12px" @update:model-value="handleChangeAutogenerarNumero" >
                    <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                      Al marcar esta opción, el número de recibo se genera automáticamente siguiendo la secuencia
                      del número anterior.
                    </q-tooltip>
                  </q-checkbox>
                </div>
            </div>
            <div class="col-md-4">
              <template v-if="['venta_propiedad', 'mantenimiento_propiedad'].includes(reciboData.tipo_factura)">
                <q-input dense outlined v-model="reciboData.contrato_num"
                  :class="reciboData.tipo_factura == 'venta_propiedad' && 'bg-grey-3'" lazy-rules
                  :rules="[val => val && val.length > 0 || '']">
                  <template v-slot:prepend>
                    <span style="font-size: 12px;">{{ reciboData.contrato_codigo }}</span>
                  </template>
                </q-input>
              </template>
              <template v-else>
                <QSelectContratos :multiple="false" dense outlined v-model="reciboData.contrato_id" clearable label="Número de contrato"
                  @selected="handleSelectContrato" @clear="handleSelectContrato(null)" :filters="{ vendedor_id: reciboData.empresa_id, comprador_id: reciboData.cliente_id, tipo_actividad: appStore.cajaSeleccionada.tipo_actividad }" :rule="[val => val && val.length > 0 || '']" />
              </template>
            </div>
            <div class="col-md-4">
              <q-input type="date" dense outlined v-model="reciboData.fecha_emision" label="Fecha de emisión"
                @change="reciboData.fecha_vencimiento = reciboData.fecha_emision" />
            </div>
          </div>
        </q-card-section>
        <q-card-section class="q-px-none" v-if="reciboData.cliente_id && (reciboData.contrato_id || reciboData.contrato_num)">
          <q-table flat hide-bottom="false" table-header-class="bg-green-1" :rows="tableData" :columns="tableColumns"
            row-key="id" hide-no-data>
            <template v-slot:header-cell-impuesto="props">
              <q-th :props="props">
                <span>{{ props.col.label }}</span>
                <q-checkbox size="sm" class="q-ml-xs" dense v-model="reciboData['aplicar_impuestos']" />
              </q-th>
            </template>
            <template v-slot:header-cell-descuento="props">
              <q-th :props="props">
                <span>{{ props.col.label }}</span>
                <q-checkbox size="sm" class="q-ml-xs" dense v-model="reciboData['aplicar_descuentos']" />
              </q-th>
            </template>
            <template v-slot:bottom-row>
              <q-td colspan="100%" class="text-center">
                <q-btn label="Agregar servicio" class="q-my-md" icon="add" color="primary" @click="agregarServicio" />
              </q-td>
            </template>
            <template v-slot:body-cell-tipo="props">
              <q-td :props="props" style="padding-left: 0; padding-right: 0;"
                :class="{'highlighted': hoveredRow === props.row}">
                <q-select v-model="props.row[props.col.name]" dense borderless :options="filteredServicios"
                  option-value="id" option-label="nombre_producto" map-options
                  :hide-dropdown-icon="!!props.row[props.col.name]"
                  @update:model-value="handleChangeTipoServicio(props.row)">
                  <template v-slot:prepend>
                    <q-btn icon="delete" size="sm" dense color="red" flat class="q-ml-xs" @click="deleteRow(props.row)"
                      @mouseover="hoveredRow = props.row" @mouseleave="hoveredRow = null" />
                  </template>
                  <template v-slot:selected>
                    <q-chip removable v-if="props.row[props.col.name]" @remove="props.row[props.col.name] = null; handleChangeTipoServicio(props.row)">
                      {{ props.row[props.col.name]?.nombre_producto }}
                    </q-chip>
                    <span class="text-grey-5" v-else>
                      -- Línea personalizada --
                    </span>
                  </template>
                </q-select>
              </q-td>
            </template>
            <template v-slot:body-cell-descripcion="props">
              <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
                <q-input type="textarea" rows="1" autogrow dense v-model="props.row.descripcion" style="margin-bottom: 20px;" readonly>
                  <template v-slot:append>
                    <q-btn flat color="primary" dense size="sm" icon="edit">
                      <q-popup-proxy @hide="props.row.descripcion = props.row.descripcion_plantilla; handleRellenarDescripcion(props.row)">
                        <q-banner>
                          <q-input type="textarea" autogrow dense outlined v-model="props.row.descripcion_plantilla" label="Descripción" style="width: 300px" />
                          <div class="q-mt-xs q-gutter-xs">
                            <q-btn outline dense size="sm" color="primary" label="Fecha desde" class="q-pa-xs" @click="props.row.descripcion_plantilla += '__DESDE__'" />
                            <q-btn outline dense size="sm" color="primary" label="Fecha hasta" class="q-pa-xs" @click="props.row.descripcion_plantilla += '__HASTA__'"/>
                            <q-btn outline dense size="sm" color="primary" label="Ubicaciones" class="q-pa-xs" @click="props.row.descripcion_plantilla += '__UBICACIONES__'"/>
                          </div>
                        </q-banner>
                      </q-popup-proxy>
                    </q-btn>
                  </template>
                </q-input>
                <div class="text-right" style="min-height: 20px; margin-top: -15px; margin-bottom: 20px" v-if="props.row['tipo']?.requiere_ubicaciones == 1">
                  <QSelectParcelasLinea class="q-select-parcelas-linea" :hint="contratoSelected?.fecha_emision ? `Emit: ${format(new Date(contratoSelected.fecha_emision), 'dd/MM/yyyy')} | Vence: ${format(new Date(contratoSelected.fecha_vencimiento), 'dd/MM/yyyy')}` : ''" dense options-dense v-model="props.row['ubicaciones']"
                    :use-input="!props.row['ubicaciones']?.length" placeholder="Asignar ubicaciones" :ubicaciones="parcelasSelected" @update:model-value="handleRecalcularLinea(props.row)"/>
                </div>
                <div class="q-mt-xs" style="min-height: 20px;" v-if="props.row.tipo?.requiere_ubicaciones == true">
                  <div class="flex q-gutter-sm" v-for="ubicacion in props.row.ubicaciones" :key="ubicacion.id">
                    <div style="flex: 1 0 4em">
                      <q-input label="Ubicación" dense v-model="ubicacion.codigo_parcela" readonly />
                    </div>
                    <div style="flex: 1 0 5em">
                      <q-input type="date" label="Últ. pago" stack-label placeholder="--" dense :model-value="ubicacion.pagado_hasta?.substr(0, 10) " readonly />
                    </div>
                    <div style="flex: 1 0 5em" v-if="props.row.tipo?.tipo_producto == 'Mantenimiento'">
                      <q-input class="bg-green-1 text-white" style="border-radius: 3px !important" label="Nuevo pago" type="date" stack-label placeholder="--" dense v-model="ubicacion.nuevo_pagado_hasta" @update:model-value="val => handleRellenarDescripcion(props.row)" />
                    </div>
                    <div style="flex: 1 0 3em" v-if="props.row.tipo?.tipo_producto == 'Mantenimiento'">
                      <q-input class="bg-green-1 text-white" style="border-radius: 3px !important" :label="props.row['pago_por_cuotas'] ? 'Meses' : 'Años'" type="number" step="1" min="0" stack-label dense v-model="ubicacion.cuotas" @update:model-value="val => handleRecalcularLinea(props.row, val)" required />
                    </div>
                  </div>

                  <div class="q-mt-xs q-gutter-x-sm" v-if="props.row.tipo?.tipo_producto == 'Mantenimiento'">

                      <q-checkbox size="sm" dense v-model="props.row['separar_pagos']" @update:model-value="handleRecalcularLinea(props.row)" />
                      <span style="font-size:.6rem; color:#444; margin-left: 2px">Separar pagos</span>

                      <q-checkbox size="sm" dense v-model="props.row['pago_por_cuotas']" @update:model-value="handleRecalcularLinea(props.row)" />
                      <span style="font-size:.6rem; color:#444; margin-left: 2px">Pago por cuotas</span>

                  </div>


                  <!--div class="row">
                    <div class="col-12 col-md" style="flex-basis:80px">
                      <q-input class="q-field--date" type="date" dense stack-label label="Fecha emisión" v-model="contratoSelectedFechaEmision" readonly />
                     </div>
                     <div class="col-12 col-md" style="flex-basis:80px">
                      <q-input class="q-field--date" type="date" dense stack-label label="Último pago" v-model="contratoSelectedFechaUltimoPago" readonly />
                     </div>
                    <div class="col-12 col-md-auto">
                      <q-input class="q-field--date" type="date" outlined filled dense stack-label label="Pagado hasta" v-model="props.row.pagado_hasta" />
                    </div>
                  </div>-->
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-cantidad="props">
              <q-td :props="props" :class="{'highlighted': hoveredRow === props.row, 'td-cantidad-cuotas': props.row['tipo']?.pagable_cuotas == 1 }">
                <q-input dense v-model="props.row[props.col.name]" type="number" step="1" min="1" style="margin-bottom: 20px;" :disable="!!parseInt(props.row.tipo?.requiere_ubicaciones)" @update:model-value="handleRecalcularLinea(props.row)" />
              </q-td>
            </template>
            <template v-slot:body-cell-precio="props">
              <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
                <template v-if="props.row.tipo">
                  {{ $dinero(props.row[props.col.name]) }}
                </template>
                <template v-else>
                  <q-input dense v-model="props.row[props.col.name]" type="number" step="0.01" min="0" @update:model-value="handleRecalcularLinea(props.row)" />
                </template>
                <div class="text-left" style="height: 20px;">
                  <template v-if="selectedMoneda">
                    <span class="text-grey-5">{{ selectedMoneda?.simbolo }} {{ $dinero(selectedMoneda?.tasa * props.row[props.col.name]) }}</span>
                  </template>
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-total="props">
              <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}" class="text-right">
                {{ $dinero(props.row[props.col.name]) }}
                <div class="text-right" style="height: 20px; margin-bottom: -10px; margin-top: 5px;">
                  <template v-if="selectedMoneda">
                    <span class="text-grey-5">{{ selectedMoneda?.simbolo }} {{ $dinero(selectedMoneda?.tasa * props.row[props.col.name]) }}</span>
                  </template>
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-impuesto="props">
              <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
                <template v-if="reciboData.aplicar_impuestos">
                  <span class="text-grey text-italic">{{ parseFloat(reciboData.impuesto_total || 0).toFixed(2)
                    }}%</span>
                </template>
                <template v-else>
                  <q-checkbox size="sm" dense v-model="props.row['impuesto_incluido']"
                    v-if="!props.row['impuesto_incluido']"  style="margin-bottom: 20px;"/>
                  <q-input dense v-model="props.row[props.col.name]" type="number" v-else style="margin-bottom: 20px;">
                    <template v-slot:prepend>
                      <q-checkbox size="sm" dense v-model="props.row['impuesto_incluido']" @update:model-value="props.row[props.col.name] = 0" />
                    </template>
                    <template v-slot:append>
                      <span style="font-size:1rem;">%</span>
                    </template>
                  </q-input>
                </template>
              </q-td>
            </template>
            <template v-slot:body-cell-descuento="props">
              <q-td :props="props" :class="{'highlighted': hoveredRow === props.row}">
                <template v-if="reciboData.aplicar_descuentos">
                  <span class="text-grey text-italic" v-if="reciboData.tipo_descuento == 'perc'" style="margin-bottom: 20px;">
                    {{ parseFloat(reciboData.descuento_total || 0).toFixed(2) }}%
                  </span>
                  <span v-else style="margin-bottom: 20px;">-</span>
                </template>
                <template v-else>
                  <q-checkbox size="sm" dense v-model="props.row['descuento_incluido']"
                    v-if="!props.row['descuento_incluido']" style="margin-bottom: 20px;" />
                  <q-input dense v-model="props.row[props.col.name]" type="number" v-else style="margin-bottom: 20px;">
                    <template v-slot:prepend>
                      <q-checkbox size="sm" dense v-model="props.row['descuento_incluido']" @update:model-value="props.row[props.col.name] = 0" />
                    </template>
                    <template v-slot:append>
                      <span style="font-size:1rem;">%</span>
                    </template>
                  </q-input>
                </template>
              </q-td>
            </template>
          </q-table>


          <div class="flex column items-end q-mr-md">
            <q-table flat dense hide-bottom hide-header :columns="totalsColumns" :rows="totalsData">
              <template v-slot:body-cell-tipo="props">
                <q-td :props="props" style="border: none;">
                  <span class="text-weight-bold" style="font-size: .95rem">{{ props.value || '-' }}</span>
                </q-td>
              </template>
              <template v-slot:body-cell-total="props">
                <q-td :props="props" style="border: none;" class="text-right">
                  <div class="q-pl-xl">{{ $dinero(props.value) }}</div>
                  <div class="text-grey">{{ $dinero(props.value * (selectedMoneda?.tasa || 1)) }} {{ selectedMoneda?.simbolo }}</div>
                </q-td>
              </template>
            </q-table>

            <q-checkbox size="sm" class="q-mt-lg q-mb-sm" dense v-model="reciboData['aplicar_descuentos']" label="Aplicar descuentos" @update:model-value="reciboData.descuento_total = null" />

            <div class="flex items-center" v-if="reciboData.aplicar_descuentos">
              <q-input type="number" dense size="sm" flat v-model="reciboData.descuento_total"
                 label="Descuento total" class="q-mr-sm" style="width: 100px"  />
              <q-btn-toggle v-model="reciboData.tipo_descuento" toggle-color="primary" style="border: 1px solid var(--q-primary)" unelevated :options="[
                { label: '%', value: 'perc' },
                { label: 'Neto', value: 'neto' },
              ]" />
            </div>


            <q-btn label="Generar recibo" icon="receipt" color="primary" class="q-my-md" @click="openDialogGenerarRecibo"/>
          </div>

        </q-card-section>
      </div>
    </q-card>
  </q-form>

  <DialogAgregarCliente ref="agregarClienteDialog" />
  <DialogAgregarDifunto ref="agregarDifuntoDialog" :difunto="true" />
  <DialogAgregarOcupante ref="agregarOcupanteDialog" />

  <q-dialog v-model="showModalAsignarPuestos" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Asignar puestos</div>
      </q-card-section>
      <q-card-section>
        <q-list bordered separator>
          <q-item v-for="(parcela, index) in parcelasSelected" :key="index" class="q-py-lg">
            <q-item-section class="text-center text-weight-bold" style="min-width: 100px; max-width: 100px;">
              {{ parcela.codigo_parcela }}
              <br />
              ({{ parcela.detalles?.puestos?.length }} puestos)
            </q-item-section>
            <q-item-section side style="align-items: stretch;">
              <template v-if="parcela.detalles?.puestos?.length">
                <div class="row q-mb-md" v-for="(puesto, puestoIndex) in parcela.detalles.puestos" :key="puestoIndex">
                  <div class="col-4 flex items-center">
                    <div>
                      <label>{{ puesto.nombre }}</label>
                      <template v-if="parseInt(puesto.ocupante_id)">
                        <q-btn :color="puesto.indice != highestOccupiedIndex(parcela.detalles.puestos) ? 'gray' : 'red'"
                          flat label="Quitar" size="sm" icon="delete"
                          :disable="puesto.indice != highestOccupiedIndex(parcela.detalles.puestos)"
                          @click="puesto.ocupante_id = null"></q-btn>
                      </template>
                    </div>
                  </div>
                  <div class="col-8 flex items-center">
                    <template v-if="parseInt(puesto.ocupante_id)">
                      <q-card class="full-width" style="max-width: 100%;">
                        <q-card-section class="q-pa-sm">
                          <label class="text-primary text-weight-bold">{{ puesto.ocupante_nombre }} <q-btn icon="edit" dense size="sm" color="primary" flat class="q-ml-xs"
                            @click="agregarDifuntoDialog.openDialog(puesto.ocupante_id, null, {
                              onUpdate: (difunto) => {
                                console.log('difunto', difunto);
                                puesto.ocupante_nombre = difunto.nombre_completo
                                puesto.ocupante_identidad = difunto.num_identidad
                              }
                            })"></q-btn></label>
                          <!-- Mostrar texto de fecha de inhumación de puesto.fecha_inhumacion -->
                          <div>{{ puesto.ocupante_identidad}}</div>
                          <div>{{ puesto.fecha_inhumacion }} <span class="text-caption">(Inhumación)</span></div>
                        </q-card-section>
                      </q-card>
                    </template>
                    <template v-else>
                      <q-badge color="primary" label="Disponible" />
                    </template>
                  </div>
                </div>
                <q-separator />
                <div class="row q-mt-md">
                  <div class="col-12">
                    <QSelectDatetime dense stack-label label="Fecha de inhumación" v-model="parcela.detalles.fechaInhumacion"/>
                  </div>
                  <div class="col-12">
                    <QSelectCliente dense outlined clearable v-model="parcela.detalles.ocupanteNuevoId"
                      label="Nuevo ocupante" @update:model-value="val => onSelectOcupanteNuevo(val, parcela.detalles)"
                      :loading="parcela.detalles.loadingOcupanteNuevo" :disable="!parcela.detalles.fechaInhumacion"/>
                  </div>
                  <div class="col-12 text-right text-caption text-grey-6" v-if="!parcela.detalles.ocupanteNuevoId">
                    <span>¿El difunto no existe?</span>
                    <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary" @click="(e) => agregarDifuntoDialog.openDialog(null, null, {
                      onCreate: (difunto) => {
                        onSelectOcupanteNuevo(difunto.id, parcela.detalles);
                      }
                    })" />
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="text-center">
                  <q-spinner size="24px" color="primary" />
                  <pre>{{ parcela.detalles }}</pre>
                </div>
              </template>

            </q-item-section>
          </q-item>
        </q-list>

      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn type="submit" label="Asignar" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showModalGenerarRecibo" class="j-dialog j-dialog-xl">
    <q-card>
      <q-card-section class="q-pa-none">
        <div class="row">
          <div class="col-12 col-md-5 q-py-lg">
            <div class="text-h6 text-primary text-center q-mb-lg">Detalles del recibo</div>
            <q-list separator bordered>
              <q-item v-for="item in tableData || []">
                <q-item-section style="display: block">
                  <span>{{ item.descripcion }}</span> <span class="text-grey text-caption">x {{ item.cantidad }}</span>
                </q-item-section>
                <q-item-section side class="text-right">
                  <div class="text-body2 text-dark">REF. {{ $dinero(item.total ) }}</div>
                  <div class="text-caption">{{ selectedMoneda?.simbolo }} {{ $dinero(item.total * (selectedMoneda?.tasa || 1)) }}</div>
                </q-item-section>
              </q-item>
            </q-list>
            <q-table flat square bordered hide-bottom hide-header :columns="totalsColumns" :rows="totalsData">
              <template v-slot:body="props">
                <q-tr :props="props" class="text-right" :class="props.rowIndex + 1 == totalsData.length && 'bg-primary text-white'">
                  <q-td key="tipo" :props="props" class="text-right">
                    <span class="text-weight-bold" style="font-size: .95rem">{{ props.row.tipo || '-' }}</span>
                  </q-td>
                  <q-td key="total" :props="props" class="text-right">
                    <div class="q-pl-xl" :class="props.rowIndex + 1 == totalsData.length && 'text-h5'">{{ $dinero(props.row.total) }}</div>
                    <div class="text-grey">{{ $dinero(props.row.total * (selectedMoneda?.tasa || 1)) }} {{ selectedMoneda?.simbolo }}</div>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <q-separator class="q-my-md" />
            <div class="q-pl-md">
              <q-input type="textarea" outlined v-model="reciboData.descripcion" rows="4" label="Descripción del recibo" placeholder="Escribe una descripción para el recibo, que se mostrará en la versión impresa" readonly/>
            </div>
          </div>
          <div class="col-12 col-md-7 q-pa-lg text-center">
            <div class="text-h6 text-primary">Cantidad total a pagar</div>
            <div class="q-my-lg">
              <div class="text-h3">
                <span class="text-body1 text-grey-9">{{ selectedMoneda?.simbolo }}</span> {{ $dinero(totalBalance * (selectedMoneda?.tasa || 1) ) }}
              </div>
              <div class="text-h6">
                <span class="text-caption text-grey-9">REF.</span> {{ $dinero(totalBalance) }}
              </div>
            </div>

            <q-table flat bordered hide-bottom hide-header
              class="q-mt-md" selection="multiple"
              v-model:selected="metodosPagoSelected"
              :rows="metodosPago" :columns="metodosPagoColumnas">
              <template v-slot:body-cell-cantidad="props">
                <q-td :props="props" class="text-center">
                  <template v-if="metodosPagoSelected.includes(props.row)">
                    <q-input dense v-model="props.row[props.col.name]" type="number" step="0.01" label="Cantidad pagada">
                      <template v-slot:append>
                        <span class="text-body1 text-primary">{{ props.row.simbolo }}</span>
                      </template>
                    </q-input>
                    <q-input dense v-model="props.row['referencia']" label="Referencia" v-if="props.row['tipo_metodo'] != 'Efectivo'"
                      debounce="500" @update:model-value="val => handleVerificarReferencia(props.row, val)" :error="props.row.referencias_usadas?.length > 0 && !props.row['referencia_usada']" hide-bottom-space>
                      <template v-slot:error>
                        La referencia ya ha sido usada.
                      </template>
                    </q-input>
                    <q-checkbox dense class="q-mt-xs" v-if="props.row.referencias_usadas?.length > 0" :model-value="!!props.row['referencia_usada']" @update:model-value="props.row['referencia_usada'] = !props.row['referencia_usada']" label="Utilizar referencia igualmente" />
                  </template>
                </q-td>
              </template>
            </q-table>

            <div class="q-gutter-md q-my-sm text-right">
              <q-btn label="Cerrar" flat color="primary" @click="showModalGenerarRecibo = false" />
              <q-btn label="Guardar" icon="receipt" color="primary" @click="handleSubmitGenerarRecibo" :disabled="puedeGenerarRecibo !== true">
                <q-tooltip v-if="puedeGenerarRecibo !== true">{{ puedeGenerarRecibo }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>


</template>

<style>
  .highlighted {
    background-color: #ffebee;
  }

  .td-cantidad-cuotas .q-field__marginal {
    padding: 0;
  }

  .td-cantidad-cuotas .q-field__marginal .q-icon {
    font-size: 12px;
  }

  .td-cantidad-cuotas .q-field--outlined .q-field__control {
    padding: 0 2px;
    text-align: center;
    border-radius: 0
  }

  .input-cuotas {
    margin-bottom: 5px;
  }

  .input-cuotas .q-field__control {
    height: 36px;
  }

  .input-cuotas .q-field__label {
    top: 5px;
  }

  .input-cuotas .q-field__native {
    padding-top: 18px;
  }

  .input-cuotas .q-field__control-container {
    margin-left: 2px;
  }

  .input-cuotas .q-field__append {
    padding: 0;
  }

  .input-cuotas .q-field__append .q-icon {
    font-size: 12px;
    margin-right: 2px;
    color: red;
  }

  .q-field--date.q-field--dense .q-field__native {
    font-size: 10px !important;
  }

  .q-select-parcelas-linea .q-field__bottom {
    padding-top: 2px;
    color: var(--q-primary);
    font-weight: 600;
  }

</style>

<script setup>

  import { ref, reactive, onMounted, computed, watch, toRaw } from "vue";
  import { api } from "src/boot/axios";
  import { useRoute, useRouter } from "vue-router";
  import { useQuasar } from "quasar";
  import { useAppStore } from 'src/stores/app.store';
  import { $dinero, qNotify} from "src/boot/jardines";

  import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
  import DialogAgregarDifunto from "src/components/popups/DialogAgregarCliente.vue";
  import DialogAgregarOcupante from "src/components/popups/DialogAgregarOcupante.vue";

  import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
  import QSelectContratos from 'src/components/selects/QSelectContratos.vue'
  import QSelectMoneda from "src/components/selects/QSelectMoneda.vue";
  import QSelectParcelasLinea from "src/components/selects/QSelectParcelasLinea.vue";
  import QSelectDatetime from "src/components/selects/QSelectDatetime.vue";

  import { add, addMonths, lastDayOfMonth, getDate, getMonth, format } from "date-fns";

  const handleSelectContrato = (value) => {
    console.log('handleSelectContrato', value);
    if (value) {
      parcelasSelected.value = value?.parcelas || []
      contratoSelected.value = value
      reciboData.tipo_ubicacion = value.tipo_parcela

      if (new Date(value.fecha_emision) == 'Invalid Date') {
        contratoSelected.value.fecha_emision = new Date(null).toISOString().substr(0, 10)
      }

      if (new Date(value.fecha_vencimiento) == 'Invalid Date') {
        contratoSelected.value.fecha_vencimiento = new Date(null).toISOString().substr(0, 10)
      }

    } else {
      parcelasSelected.value = []
      reciboData.tipo_ubicacion = null
      contratoSelected.value = null
    }

    console.log(contratoSelected.value);

    tableData.value?.forEach(row => {
      handleChangeTipoServicio(row);
    });
  }

  const router = useRouter()
  const route = useRoute()
  const $q = useQuasar()
  const appStore = useAppStore()

  const agregarClienteDialog = ref(null)
  const agregarDifuntoDialog = ref(null);

  function highestOccupiedIndex(puestos) {
    let highestIndex = -1;
    for (let i = 0; i < puestos.length; i++) {
      if (parseInt(puestos[i].ocupante_id) && puestos[i].indice > highestIndex) {
        highestIndex = puestos[i].indice;
      }
    }
    return highestIndex;
  }

  function onSelectOcupanteNuevo(ocupanteId, detalles) {

    if (ocupanteId) {
      const sortedPuestos = [...detalles.puestos].sort((a, b) => a.indice - b.indice);
      const firstAvailablePuesto = sortedPuestos.find(puesto => !puesto.ocupante_id);

      if (firstAvailablePuesto) {

        // Revisar si el ocupante ya ha sido asignado a un puesto
        const isOcupanteIdExists = this.parcelasSelected.some(parcela =>
          parcela.detalles.puestos.some(puesto => puesto.ocupante_id === ocupanteId)
        );

        if (isOcupanteIdExists) {
          $q.notify({
            type: 'negative',
            message: 'El ocupante ya ha sido asignado a un puesto',
          });
          return;
        }

        detalles.loadingOcupanteNuevo = true;

        const response = api
          .get('clientes/' + ocupanteId)
          .then(response => {
            if (response.data) {
              firstAvailablePuesto.ocupante_id = ocupanteId;
              firstAvailablePuesto.ocupante_nombre = response.data.nombre_completo;
              firstAvailablePuesto.ocupante_identidad = response.data.num_identidad;
              firstAvailablePuesto.fecha_inhumacion = detalles.fechaInhumacion;

              $q.notify({ type: 'positive', message: 'Ocupante asignado correctamente' })
            }
          })
          .catch(e => {
            console.log(e)
            $q.notify({ type: 'negative', message: 'No se pudo asignar el ocupante' })
          })
          .finally(() => {
            detalles.ocupanteNuevoId = null;
            detalles.loadingOcupanteNuevo = false
          })

      } else {
        $q.notify({
          type: 'negative',
          message: 'No hay puestos disponibles para asignar',
        })
      }
    }


  }

  const tiposFactura = computed(() => {

    if (reciboData.empresa_id) {
      // Recorrer la variable "empresas", y si la tipo_actividad de empresa en reciboData.empresa_id es venta_parcelas:
      const empresa = empresas.value.find(empresa => empresa.id == reciboData.empresa_id);

      if (empresa && empresa.tipo_actividad == 'venta_parcelas') {
        return [
          {
            value: "venta_propiedad",
            label: "Crear contrato para venta de propiedad",
          },
        ]
      }

      if (empresa && empresa.tipo_actividad == 'mantenimiento_parcelas') {
        return [
          {
            value: "mantenimiento_propiedad",
            label: "Crear contrato de mantenimiento",
          },
          {
            value: "recibo_pago",
            label: "Recibo de pago de servicios",
          },
        ]
      }
    }

    return []
  });

  const tiposUbicacion = [
    {
      value: "Parcela",
      label: "Parcela",
    },
    {
      value: "Nicho",
      label: "Nicho",
    },
    {
      value: "Columbario",
      label: "Columbario",
    },
  ];


  /** SECCION UBICACIONES */

  const parcelas = ref([])

  const parcelasColumnas = [
    { name: 'codigo_parcela', label: 'Ubicación', align: 'left', field: 'codigo_parcela', sortable: true, headerStyle: "width: 105px" },
    { name: 'propietario', label: 'Propietario', align: 'left', field: 'cliente_nombre', sortable: true },
    { name: 'estatus', label: 'Estatus', align: 'left', field: 'estatus', sortable: true },
    { name: 'ocupacion', label: 'Ocupación', align: 'left', field: 'ocupacion', sortable: true },
  ]

  const metodosPagoSelected = ref([])

  const metodosPagoColumnas = [
    { name: 'metodo', label: 'Método de pago', align: 'left', field: 'metodo' },
    { name: 'cantidad', label: 'Cantidad', align: 'left', field: 'cantidad' },
  ]

  const parcelasSelected = ref([])
  const contratoSelected = ref(
    null
    /*{ "id": "13", "estatus": "Activo", "codnum_contrato": "MTP0055", "cliente": { "num_identidad": "V-25333115", "nombre_completo": "Juan Hernández", "fecha_creado": "2024-05-05", "id": "20729", "doc_identidad": "V", "doc_numero": "25333115", "nombre": "Juan", "apellido": "Hernández", "prefijo": null, "sufijo": null, "email": null, "rol": null, "telefono_principal": null, "telefono_secundario": null, "pais": null, "estado": null, "ciudad": null, "direccion_habitacion": null, "direccion_trabajo": null, "nombre_empresa": null, "rif_empresa": null, "puesto_empresa": null, "fecha_nacimiento": null, "difunto": "1", "fecha_muerte": null, "causa_muerte": null, "certificado_defuncion": null, "fecha_certificado": null, "traslado_num": null, "fecha_traslado": null, "estado_civil": null, "genero": null, "estado_gerencia": "0", "estado_cuenta": "Activo", "estado_cliente": "Fallecido", "num_carnet": null, "num_historia": null, "num_afiliacion": null, "notas": null, "etiqueta_color": null, "etiqueta_texto": null, "created_at": { "date": "2024-05-05 19:39:40.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-05-26 17:49:56.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null }, "parcelas": [ { "codigo_parcela": "AR-001", "estatus": "Vendido", "num_parcela": "001", "id": "8116", "tipo_parcela_id": "1", "propietario_id": "20729", "pariente_mas_cercano": null, "codigo_seccion": "AR", "num_fila": "1", "precio": null, "es_compartida": "1", "orientacion": null, "descripcion": null, "notas": null, "pos_x": "0", "pos_y": "0", "created_at": { "date": "2024-04-26 22:19:40.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-06-12 15:24:06.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null, "pagado_hasta": "2024-06-14", "cuotas": null }, { "codigo_parcela": "AR-002", "estatus": "Vendido", "num_parcela": "002", "id": "8117", "tipo_parcela_id": "1", "propietario_id": "20729", "pariente_mas_cercano": null, "codigo_seccion": "AR", "num_fila": "1", "precio": null, "es_compartida": "1", "orientacion": null, "descripcion": null, "notas": null, "pos_x": "2", "pos_y": "0", "created_at": { "date": "2024-04-26 22:19:40.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-06-12 15:24:06.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null, "pagado_hasta": "2024-06-14", "cuotas": null }, { "codigo_parcela": "AR-003", "estatus": "Vendido", "num_parcela": "003", "id": "8118", "tipo_parcela_id": "1", "propietario_id": "20729", "pariente_mas_cercano": null, "codigo_seccion": "AR", "num_fila": "1", "precio": null, "es_compartida": "1", "orientacion": null, "descripcion": null, "notas": null, "pos_x": "4", "pos_y": "0", "created_at": { "date": "2024-04-26 22:19:40.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-06-12 15:24:06.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null, "pagado_hasta": "2024-06-14", "cuotas": null } ], "comprador_id": "20729", "vendedor_id": "13", "codigo_contrato": "MTP", "num_contrato": "0055", "num_serie": null, "necesidad_inmediata": "0", "fecha_emision": "2023-01-31 00:00:00", "fecha_vencimiento": "2025-03-31 00:00:00", "fecha_pagado": "2023-02-28 00:00:00", "modalidad_pago": null, "valor_total": "0.0000", "valor_venta": "0.0000", "valor_cuota_inicial": "0.0000", "valor_cuota_mensual": "0.0000", "numero_cuotas": "1", "periodos_por_cuota": null, "dias_preaviso": null, "notas": null, "etiqueta": null, "created_at": { "date": "2024-06-01 18:11:34.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-06-01 18:11:34.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null, "tipo_actividad": "mantenimiento_parcelas", "tipo_parcela": "Parcela" } //TODO: Quitar y poner null*/
  )

  const contratoSelectedFechaEmision = computed(() => {
    if (contratoSelected.value?.fecha_emision) {
      return contratoSelected.value.fecha_emision.substr(0, 10)
    } else {
      return ''
    }
  })

  const contratoSelectedFechaUltimoPago = computed(() => {
    if (contratoSelected.value?.fecha_pagado) {
      return contratoSelected.value.fecha_pagado.substr(0, 10)
    } else {
      return contratoSelectedFechaEmision.value
    }
  })

  const showModalAsignarPuestos = ref(false)

  const openDialogAsignarPuestos = () => {
    showModalAsignarPuestos.value = true;

    parcelasSelected.value.forEach((parcela) => {

      if (!parcela.detalles) {
        api.get("parcelas/" + parcela.id)
          .then((response) => {
            parcela.detalles = response.data;
          })
          .finally(() => (isLoadingDetalles.value = false));
      }

    });
  }

  const showModalGenerarRecibo = ref(false)
  const puedeGenerarRecibo = ref(false)

  const openDialogGenerarRecibo = () => {
    reciboData.descripcion = tableData.value.map(row => row.descripcion).join(', ');
    showModalGenerarRecibo.value = true;
    // Si contiene __, mostrar alerta
    if (!reciboData.descripcion) {
      puedeGenerarRecibo.value = 'No se ha introducido una descripción.'
      qNotify('No se ha introducido una descripción.', 'error')
    } else if (reciboData.descripcion.includes('__')) {
      puedeGenerarRecibo.value = 'Completa la información marcada con "__" en el recibo.'
      qNotify('Completa la información marcada con "__" en el recibo.', 'error')
    } else {
      puedeGenerarRecibo.value = true
    }
  }

  const parcelasTableRef = ref(null)
  const parcelasTableLoading = ref(false)
  const parcelasTableFilter = ref('');
  const parcelasTablePagination = ref({
    page: 1,
    rowsPerPage: 5,
  })

  const parcelasTableRequest = (props) => {
    const { page, rowsPerPage, sortBy, descending } = props.pagination
    parcelasTableLoading.value = true;

    let endpoint = 'parcelas';

    const searchParams = new URLSearchParams(
      Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
    );

    if (parcelasTableFilter.value) {
      searchParams.append('q', parcelasTableFilter.value)
    }

    if (reciboData.tipo_ubicacion) {
      searchParams.append('f[tipo_parcela]', reciboData.tipo_ubicacion)
      searchParams.append('f[estatus]', 'Disponible')
    }

    if (sortBy) {
      searchParams.append('order', descending ? 'DESC' : 'ASC')
    }

    if (searchParams) {
      endpoint += '?' + searchParams.toString();
    }


    api.get(endpoint)
      .then(response => {
        if (response.data) {
          parcelas.value = response.data.data
          parcelasTablePagination.value.page = response.data.pager.currentPage
          parcelasTablePagination.value.rowsPerPage = response.data.pager.perPage
          parcelasTablePagination.value.rowsNumber = response.data.pager.total
          parcelasTablePagination.value.sortBy = response.data.sortBy || null
          parcelasTablePagination.value.descending = response.data.order == 'DESC'
        }
      })
      .catch(e => console.log(e))
      .finally(() => parcelasTableLoading.value = false)
  }

  /** END SECCION UBICACIONES */

  const hoveredRow = ref(null)

  const deleteRow = (row) => {
    const index = tableData.value.indexOf(row)
    tableData.value.splice(index, 1)
  }

  const tableColumns = [
    {
      name: 'tipo',
      required: true,
      label: 'Tipo',
      align: 'left',
      field: 'tipo',
      headerStyle: 'width: 230px',
      style: 'width: 230px',
    },
    {
      name: 'descripcion',
      required: true,
      label: 'Descripción',
      align: 'left',
      field: 'descripcion',
      headerStyle: 'width: 400px',
    },
    {
      name: 'cantidad',
      required: true,
      label: 'Cantidad',
      align: 'left',
      field: 'cantidad',
      headerStyle: 'width: 80px',
      style: 'width: 80px',
    },
    {
      name: 'precio',
      required: true,
      label: 'Precio',
      align: 'left',
      field: 'precio',
      format: value => `${value.toFixed(2)}`,
      headerStyle: 'width: 100px',
      style: 'width: 100px',
    },
    {
      name: 'total',
      required: true,
      label: 'Total',
      align: 'left',
      field: 'total',
      format: value => `${value.toFixed(2)}`,
      headerStyle: 'width: 100px',
      style: 'width: 100px',
    },
    /*{
      name: 'impuesto',
      required: true,
      label: 'Impuesto',
      align: 'left',
      field: 'impuesto',
      format: value => `${value.toFixed(2)}`,
      headerStyle: 'width: 125px',
      style: 'width: 125px',
    },*/
    /*{
      name: 'descuento',
      required: true,
      label: 'Descuento',
      align: 'left',
      field: 'descuento',
      format: value => `${value.toFixed(2)}`,
      headerStyle: 'width: 125px',
      style: 'width: 125px',
    },*/
  ]

  const tableData = ref([
    { "tipo": "", "descripcion": "", "cantidad": 1, "precio": 0, "impuesto": 0, "descuento": 0, "impuesto_incluido": false, "descuento_incluido": false }
    /*{ "tipo": { "id": "19", "nombre_producto": "Mantenimiento de parcelas", "tipo_producto": "Mantenimiento", "tipo_ubicacion": "Parcela", "descripcion": "Pago de mantenimiento desde ___ hasta ___ (Parcela ___)", "precio_ref": "200.0000", "disponible": "1", "gestiona_stock": "0", "stock": "0", "requiere_ubicaciones": "1", "pagable_cuotas": "1", "cantidad_cuotas": "12", "empresa_id": "13", "usuario_id": "2", "created_at": "2024-04-28 19:40:37", "updated_at": "2024-06-09 14:45:18", "deleted_at": null }, "descripcion": "Pago de mantenimiento desde ___ hasta ___ (Parcela ___)", "cantidad": 3, "precio": 200, "impuesto": 0, "descuento": 0, "impuesto_incluido": false, "descuento_incluido": false, "cantidad_cuotas": 1, "total": 0, "pago_por_cuotas": false, "separar_pagos": false, "ubicaciones": [ { "codigo_parcela": "AR-001", "estatus": "Vendido", "num_parcela": "001", "id": "8116", "tipo_parcela_id": "1", "propietario_id": "20729", "pariente_mas_cercano": null, "codigo_seccion": "AR", "num_fila": "1", "precio": null, "es_compartida": "1", "orientacion": null, "descripcion": null, "notas": null, "pos_x": "0", "pos_y": "0", "created_at": { "date": "2024-04-26 22:19:40.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-06-12 15:24:06.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null, "pagado_hasta": null }, { "codigo_parcela": "AR-002", "estatus": "Vendido", "num_parcela": "002", "id": "8117", "tipo_parcela_id": "1", "propietario_id": "20729", "pariente_mas_cercano": null, "codigo_seccion": "AR", "num_fila": "1", "precio": null, "es_compartida": "1", "orientacion": null, "descripcion": null, "notas": null, "pos_x": "2", "pos_y": "0", "created_at": { "date": "2024-04-26 22:19:40.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-06-12 15:24:06.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null, "pagado_hasta": null }, { "codigo_parcela": "AR-003", "estatus": "Vendido", "num_parcela": "003", "id": "8118", "tipo_parcela_id": "1", "propietario_id": "20729", "pariente_mas_cercano": null, "codigo_seccion": "AR", "num_fila": "1", "precio": null, "es_compartida": "1", "orientacion": null, "descripcion": null, "notas": null, "pos_x": "4", "pos_y": "0", "created_at": { "date": "2024-04-26 22:19:40.000000", "timezone_type": 3, "timezone": "UTC" }, "updated_at": { "date": "2024-06-12 15:24:06.000000", "timezone_type": 3, "timezone": "UTC" }, "deleted_at": null, "pagado_hasta": null } ] }*/
  ])

  const totalsColumns = [
    {
      name: 'tipo',
      required: true,
      label: 'Tipo',
      align: 'left',
      field: 'tipo'
    },
    {
      name: 'total',
      required: true,
      label: 'Total',
      align: 'left',
      field: 'total'
    }
  ]

  const totalsData = computed(() => {

    let totals = [];

    let SubTotal = tableData.value.reduce((acc, row) => acc + (row.total), 0);

    totals.push({
      tipo: 'Subtotal',
      total: SubTotal,
    });

    /** DESCUENTOS */
    let Descuentos = 0;

    if (reciboData.aplicar_descuentos) {

      if (reciboData.tipo_descuento === 'perc') {
        Descuentos = (SubTotal * reciboData.descuento_total / 100 || 0);
      } else {
        Descuentos = reciboData.descuento_total;
      }

      Descuentos = Descuentos * -1;

    } else {
      Descuentos = (tableData.value.reduce((acc, row) => acc + (row.total * row.descuento / 100), 0) || 0) * -1
    }

    if (Descuentos) {
      totals.push({
        tipo: 'Descuentos',
        total: Descuentos,
      });
    }
    /** END DESCUENTOS */

    /** IMPUESTOS */
    let SubtotalConDescuentos = SubTotal + Descuentos;
    let Impuestos = 0;

    if (reciboData.aplicar_impuestos) {
      Impuestos = SubtotalConDescuentos * reciboData.impuesto_total / 100;
    } else {
      Impuestos = tableData.value.reduce((acc, row) => acc + (row.total * row.impuesto / 100), 0);
    }

    if (Impuestos) {
      totals.push({
        tipo: 'Impuestos',
        total: Impuestos,
      });
    }
    /** END IMPUESTOS */

    let Total = SubtotalConDescuentos + Impuestos;

    totals.push({
      tipo: 'Total',
      total: Total,
      isTotal: true,
    });

    return totals;
  });

  const totalBalance = computed(() => {
    let totalFinal = totalsData.value.find(total => total.isTotal).total

    let totalPagado = 0

    // Tomar en cuenta la tasa de cada método de pago para restar del total final
    for (let i = 0; i < metodosPagoSelected.value.length; i++) {
      let metodo = metodosPagoSelected.value[i];
      totalPagado += (metodo.cantidad || 0) / (metodo.tasa || 1);
    }

    let balance = totalFinal - totalPagado;

    return balance;
  })

  const handleVerificarReferencia = (row, value) => {
    console.log('handleVerificarReferencia', row, value);
    api.post('caja/transacciones/verificarReferencia', { referencia: value })
      .then(response => {
        console.log('response', response);
        if (response.data?.data) {
          row.referencias_usadas = response.data.data
        } else {
          row.referencias_usadas = null
        }

        if (!row.referencia_usada) row.referencia_usada = false
      })
      .catch(error => qNotify(error, 'error', { callback: handleVerificarReferencia }))
  }

  onMounted(() => {
    initializePage()
  })

  const servicios = ref([])
  const empresas = ref([])

  const filteredServicios = computed(() => {
    if (reciboData.empresa_id) {
      let dataFiltered = servicios.value.filter(servicio => servicio.empresa_id === reciboData.empresa_id)

      if (contratoSelected.value?.etiqueta == 'Donado') {
        dataFiltered = dataFiltered.filter(servicio => servicio.tipo_producto != 'Mantenimiento')
      }

      // Si reciboData.tipo_ubicacion tiene valor, devolver todos los servicios con servicio.tipo_ubicacion tanto NULL como con el valor de reciboData.tipo_ubicacion
      if (reciboData.tipo_ubicacion) {
        return dataFiltered.filter(servicio => !servicio.tipo_ubicacion || servicio.tipo_ubicacion === reciboData.tipo_ubicacion)
      } else {
        return dataFiltered
      }

    } else {
      return []
    }
  })

  const tiposContrato = ref([])
  const monedas = ref([])
  const metodosPago = ref([])

  function initializePage() {
    api.get('servicios')
      .then(response => {
        if (response.data) {
          servicios.value = response.data
        }
      })
      .catch(e => console.log(e))

    api.get('empresas')
      .then(response => {
        if (response.data) {
          empresas.value = response.data
        }
      })
      .catch(e => console.log(e))

    api.get('contratos/tipos')
      .then(response => {
        if (response.data) {
          tiposContrato.value = response.data
        }
      })
      .catch(e => console.log(e))

    api.get('caja/transacciones/siguienteNumero?caja_id=' + appStore.cajaSeleccionada.id)
      .then(response => {
        if (response.data) {
          siguienteNumeroRecibo = response.data.data
          if (reciboData.autogenerar_numero) {
            reciboData.num_transaccion = response.data.data
          }
        }
      })
      .catch(error => qNotify(error, 'error'))

    api.get('caja/monedas')
      .then(response => {
        if (response.data) {
          monedas.value = response.data

          let monedaVes = response.data.find(moneda => moneda.simbolo.includes('Bs'))
          if (monedaVes) {
            reciboData.moneda_id = monedaVes.id
          }
        }
      })
      .catch(error => qNotify(error, 'error'))

    api.get('caja/metodos')
      .then(response => {
        if (response.data) {
          console.log('Metodos', response.data)
          metodosPago.value = response.data
        }
      })
      .catch(e => console.log(e))

    if (reciboData.tipo_ubicacion) {
      parcelasTableRef.value.requestServerInteraction()
    }

    if (route.query?.contrato_id) {
      api.get('contratos/' + route.query.contrato_id)
        .then(response => {
          if (response.data) {
            handleSelectContrato(response.data)
          }
        })
        .catch(error => qNotify(error, 'error'))
    }

    reciboData.contrato_id = route.query?.contrato_id || null;
    reciboData.cliente_id = route.query?.cliente_id || null;

  }


  const selectedMoneda = computed(() => {
    return monedas.value.find(moneda => moneda.id === reciboData.moneda_id)
  })

  const handleSubmitGenerarRecibo = () => {

    let totalPagado = metodosPagoSelected.value.reduce((acc, row) => acc + (row.cantidad || 0), 0)

    let message = '¿Estás seguro de que deseas generar el recibo?';

    if (!totalPagado) {
      message = 'No se ha registrado ningún pago. ¿Desea continuar?';
    }

    $q.dialog({
      title: 'Guardar recibo',
      message: message,
      ok: 'Sí',
      cancel: 'No',
    }).onOk(() => {
      _handleSubmitGenerarRecibo()
    })

  }

  const _handleSubmitGenerarRecibo = () => {

    let ocupantes = []

    if (parcelasSelected.value) {
      parcelasSelected.value.forEach(parcela => {

        console.log(parcela);
        if (parcela.detalles?.puestos) {
          parcela.detalles.puestos.forEach(puesto => {
            if (puesto.ocupante_id) {
              ocupantes.push({
                ocupante_id: puesto.ocupante_id,
                puesto_id: puesto.id,
                fecha_inhumacion: new Date().toISOString().substr(0, 10),
              })
            }
          })
        }
      })
    }

    if (metodosPagoSelected.value?.length) {
      let error = false;

      metodosPagoSelected.value.forEach(metodo => {
        console.log(metodo);
        if (!metodo.cantidad || parseFloat(metodo.cantidad) <= 0) {
          error = `El pago por "${metodo.metodo}" debe tener una cantidad válida.`;
          return;
        }

        if (metodo.tipo_metodo != 'Efectivo' && !metodo.referencia) {
          error = `El pago por "${metodo.metodo}" debe tener una referencia.`
          return;
        }

        if (metodo.referencias_usadas?.length && !metodo.referencia_usada) {
          error = `Confirma el uso de la referencia por "${metodo.metodo}".`
          return;
        }
      });

      if (error) {
        qNotify(error, 'error')
        return;
      }
    }

    let postData = {
      ...reciboData,
      subtotal: totalsData.value.find(total => total.tipo == 'Subtotal')?.total || null,
      descuentos: totalsData.value.find(total => total.tipo == 'Descuentos')?.total || null,
      impuestos: totalsData.value.find(total => total.tipo == 'Impuestos')?.total || null,
      total: totalsData.value.find(total => total.tipo == 'Total')?.total || null,
      caja_id: appStore.cajaSeleccionada?.id,
      tasa: selectedMoneda?.value?.tasa || 1,
      ubicaciones: parcelasSelected?.value?.map(parcela => parcela.id),
      ocupantes: ocupantes,
      pagos: metodosPagoSelected?.value?.map(pago => {
        return {
          metodo_pago_id: pago.id,
          cantidad: pago.cantidad,
          referencia: pago.referencia,
          moneda_id: pago.moneda_id,
          tasa_ref: pago.tasa,
        }
      }),
      lineas: tableData.value.map(row => {
        return {
          producto_id: row.tipo.id,
          descripcion: row.descripcion,
          descripcion_plantilla: row.descripcion,
          ubicaciones: row.ubicaciones || null,
          cantidad: row.cantidad,
          precio_unitario: row.precio,
          total_ref: row.total,
          impuesto: row.impuesto,
          descuento: row.descuento,
          impuesto_incluido: row.impuesto_incluido,
          descuento_incluido: row.descuento_incluido,
          pagado_hasta: row.pagado_hasta,
          separar_pagos: row.separar_pagos,
          pago_por_cuotas: row.pago_por_cuotas,
        }
      })
    }

    api.post('caja/transacciones/crear', postData)
      .then(response => {

        qNotify('Recibo creado correctamente', 'positive')
        setTimeout(() => {
          router.push('/caja')
        }, 1000)

      })
      .catch(error => {
        qNotify(error, 'error')
      });

  }

  const handleChangeAutogenerarNumero = (val) => {
    if (val) {
      reciboData.num_transaccion = siguienteNumeroRecibo;
    }
  }

  const handleChangeTipoFactura = (val) => {
    if (reciboData.fecha_emision) {
      if (val == 'mantenimiento_propiedad') {
        let [ year, month, day ] = reciboData.fecha_emision.split('-');
        let fechaVencimiento = new Date(parseInt(year) + 1, parseInt(month) - 1, parseInt(day)).toISOString().substr(0, 10);
        console.log(fechaVencimiento)
        reciboData.fecha_vencimiento = fechaVencimiento;
      } else {
        reciboData.fecha_vencimiento = reciboData.fecha_emision
      }
    }
  }

  const handleChangeTipoServicio = (row) => {
    if (row.tipo) {
      row.descripcion = row.tipo.descripcion
      row.descripcion_plantilla = row.tipo.descripcion
      row.precio = parseFloat(row.tipo.precio_ref)
      row.pago_por_cuotas = false
      row.separar_pagos = false

      if (!!parseInt(row.tipo.requiere_ubicaciones)){
        row.ubicaciones = parcelasSelected.value;
      } else {
        row.ubicaciones = [];
      }
    } else {
      row.descripcion = ''
      row.precio = 0
      row.cantidad = 1
      delete row.pago_por_cuotas
      delete row.separar_pagos
      delete row.ubicaciones
      delete row.pagado_hasta
    }

    handleRecalcularLinea(row)
  }

  const handleRecalcularLinea = (row, val) => {
    console.log('handleRecalcularLinea!!!', {
      cantidad: row.cantidad,
      pago_por_cuotas:row.pago_por_cuotas,
      precio: row.precio,
      separar_pagos: row.separar_pagos,
      ubicaciones: row.ubicaciones,
    });

    if (!!parseInt(row.tipo?.requiere_ubicaciones)) {
      row.cantidad = row.ubicaciones.length
    }

    if (row.tipo?.pagable_cuotas == 1) {

      let cantidadCuotas = parseInt(val);
      let precioPorCuota = row.pago_por_cuotas ? row.tipo.precio_ref / row.tipo.cantidad_cuotas : row.tipo.precio_ref;

      row.ubicaciones.forEach(ubicacion => {

        if (!row.separar_pagos) {
          ubicacion.cuotas = cantidadCuotas;
        }

        let ultimoPagadoHasta = new Date(ubicacion.pagado_hasta || contratoSelected.value.fecha_emision);
        if (ultimoPagadoHasta == 'Invalid Date') {
          ultimoPagadoHasta = new Date(contratoSelected.value.fecha_emision || null);
        }

        //ubicacion.pagado_hasta = ultimoPagadoHasta.toISOString().substr(0, 10);

        if (row.pago_por_cuotas) {
          ubicacion.nuevo_pagado_hasta = agregarPorFechaCorte(ultimoPagadoHasta, new Date(contratoSelected.value.fecha_emision), parseInt(ubicacion.cuotas))
        } else {
          ubicacion.nuevo_pagado_hasta = add(ultimoPagadoHasta, { years: parseInt(ubicacion.cuotas) }).toISOString().substr(0, 10);
        }

      })

      let totalCuotas = row.ubicaciones.reduce((acc, ubicacion) => acc + parseInt(ubicacion.cuotas || 0), 0);
      row.total = precioPorCuota * totalCuotas

    } else {
      row.total = row.precio * row.cantidad
    }

    handleRellenarDescripcion(row)
  }

  const dateToDMY = (datestring) => {
    if (!datestring) return null

    const inputDate = new Date(datestring.replace(/-/g, '/'));

    // Format the date as a string in the desired format
    const day = inputDate.getDate().toString().padStart(2, '0');
    const month = (inputDate.getMonth() + 1).toString().padStart(2, '0');
    const year = inputDate.getFullYear().toString();
    const outputDateString = `${day}/${month}/${year}`;

    return outputDateString;
  }

  const handleRellenarDescripcion = (row) => {
    let plantilla = row.descripcion_plantilla

    if (!plantilla) return;

    let ubicacionesAgrupadasPorFecha = {}

    // Verificar si la plantilla tiene __DESDE__ o __HASTA__
    if (row.descripcion_plantilla.includes('__DESDE__') || row.descripcion_plantilla.includes('__HASTA__')) {
      row.ubicaciones.forEach(ubicacion => {
        let fechaDesde = ubicacion.pagado_hasta?.substr(0, 10) || '-'
        let fechaHasta = ubicacion.nuevo_pagado_hasta?.substr(0, 10) || '-'

        let fechaDesdeHasta = fechaDesde + '_' + fechaHasta
        if (!ubicacionesAgrupadasPorFecha[fechaDesdeHasta]) {
          ubicacionesAgrupadasPorFecha[fechaDesdeHasta] = []
        }
        ubicacionesAgrupadasPorFecha[fechaDesdeHasta].push(ubicacion)
      })

      let descripciones = [];
      for (let fecha in ubicacionesAgrupadasPorFecha) {

        let descripcion = row.descripcion_plantilla;

        if (descripcion.includes('__DESDE__')) {
          descripcion = descripcion.replace('__DESDE__', dateToDMY(ubicacionesAgrupadasPorFecha[fecha][0].pagado_hasta || contratoSelected.value?.fecha_emision))
        }

        if (descripcion.includes('__HASTA__')) {
          descripcion = descripcion.replace('__HASTA__', dateToDMY(ubicacionesAgrupadasPorFecha[fecha][0].nuevo_pagado_hasta))
        }

        if (descripcion.includes('__UBICACIONES__')) {
          descripcion = descripcion.replace('__UBICACIONES__', ubicacionesAgrupadasPorFecha[fecha].map(ubicacion => ubicacion.codigo_parcela).join(', '))
        }

        descripciones.push(descripcion)
      }

      row.descripcion = descripciones.join('\n')

    } else if (row.descripcion_plantilla.includes('__UBICACIONES__')) {

      row.descripcion = row.descripcion_plantilla.replace('__UBICACIONES__', row.ubicaciones.map(ubicacion => ubicacion.codigo_parcela).join(', '))

    }


  }

  const agregarPorFechaCorte = (lastDate, baseDate, months) => {
    let newDate = add(lastDate, { months })

    let diaFechaActual = getDate(newDate)
    let diaFechaCorte = getDate(baseDate)
    let ultimoDiaDelMes = getDate(lastDayOfMonth(newDate))

    if (diaFechaActual < diaFechaCorte && diaFechaActual < ultimoDiaDelMes) {
      let maxDiaPosible = diaFechaCorte > ultimoDiaDelMes ? ultimoDiaDelMes : diaFechaCorte;
      let diferenciaDias = maxDiaPosible - diaFechaActual

      newDate = add(newDate, { days: diferenciaDias })
    }

    //console.log(newDate.toISOString().substr(0, 10), diaFechaActual, diaFechaCorte, ultimoDiaDelMes)

    newDate = newDate.toISOString().substr(0, 10)

    console.log(newDate, lastDate, baseDate, months)
    return newDate
  };

  const agregarServicio = () => {
    tableData.value.push({
      tipo: '',
      descripcion: '',
      cantidad: 1,
      precio: 0,
      impuesto: 0,
      descuento: 0,
      impuesto_incluido: false,
      descuento_incluido: false,
    })
  }

  let siguienteNumeroRecibo;

  const reciboData = reactive({
    empresa_id: appStore.cajaSeleccionada?.empresa_id,
    tipo_factura: 'recibo_pago', // TODO: Quitar
    aplicar_descuentos: false,
    aplicar_impuestos: false,
    cliente_id: null,
    contrato_id: null,
    autogenerar_numero: true,
    tipo_descuento: 'neto',
    tipo_impuesto: 'perc',
    tipo_ubicacion: null,
    fecha_emision: new Date().toISOString().substr(0, 10),
    fecha_vencimiento: new Date().toISOString().substr(0, 10),
  })

  watch(() => parcelasSelected.value, (newVal, oldVal) => {
    if (oldVal?.length != newVal?.length) {
      tableData.value.forEach(row => {
        if (row.tipo?.tipo_ubicacion && row.tipo.tipo_ubicacion === reciboData.tipo_ubicacion) {
          row.cantidad = newVal.length
          row.ubicaciones = newVal;
        }
      })
    }
  }, { deep: true })

  const copiarContrato = ref(null)

  watch(() => reciboData.copiar_contrato_id, (newVal) => {

    if (newVal) {
      api.get('contratos/' + newVal)
        .then(response => {
          if (response.data) {
            copiarContrato.value = response.data
            reciboData.tipo_ubicacion = response.data.tipo_parcela
            parcelasSelected.value = response.data.parcelas || []
          }
        })
        .catch(error => qNotify(error, 'error'))
    }
  })

  const sortedPuestos = (puestos) => {
    // Ordena los puestos por 'indice'
    const sorted = [...puestos].sort((a, b) => a.indice - b.indice);

    // Encuentra el índice del primer puesto desocupado
    const firstUnoccupiedIndex = sorted.findIndex(puesto => !puesto.ocupante_id);

    // Si todos los puestos están ocupados, devuelve todos los puestos
    if (firstUnoccupiedIndex === -1) {
      return sorted.reverse();
    }

    // Devuelve solo los puestos hasta el primer puesto desocupado
    return sorted.slice(0, firstUnoccupiedIndex + 1).reverse();
  };

  watch(() => reciboData.tipo_ubicacion, (value) => {
    parcelas.value = []
    parcelasTableRef.value.requestServerInteraction()

    let tipoContrato;

    // Buscar en tiposContrato los tipos de contrato que coincidan con el tipo de ubicación
    // y tambien donde tipo_actividad sea el correspondiente, encontrar el primero
    if (reciboData.tipo_factura == 'venta_propiedad') {
      tipoContrato = tiposContrato.value.find(tipo => tipo.tipo_actividad === 'venta_parcelas' && tipo.tipo_parcela === value);
    } else if (reciboData.tipo_factura == 'mantenimiento_propiedad') {
      tipoContrato = tiposContrato.value.find(tipo => tipo.tipo_actividad === 'mantenimiento_parcelas' && tipo.tipo_parcela === value);
    }

    if (tipoContrato) {
      if (!reciboData.copiar_contrato_id) {
        reciboData.contrato_num = tipoContrato.siguiente_numero;
      } else {
        reciboData.contrato_num = copiarContrato.value.num_contrato;
      }
      reciboData.contrato_codigo = tipoContrato.codigo_contrato;
    }


  })

</script>
