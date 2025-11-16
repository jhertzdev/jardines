<template>
  <q-page>
    <template v-if="!appStore.cajaSeleccionada?.id">
      <p class="text-h6 text-center q-my-xl">Selecciona una caja para continuar</p>
      <div class="row q-col-gutter-md">
        <div class="col-6" v-for="(caja, index) in cajas" :key="index">
          <q-card class="flex column justify-between" style="min-height: 280px;">
            <q-card-section>
              <div class="text-h6"><span>{{ caja.nombre_caja }}</span></div>
              <div class="q-mt-lg">
                <p class="q-mb-none">{{ caja.nombre_corto }} ({{ caja.rif }})</p>
                <p class="q-mb-none">{{ caja.razon_social }}</p>
              </div>
            </q-card-section>
            <q-card-section>
              <template v-if="caja.esta_abierta">

                <q-banner class="bg-grey-3 q-pb-md">
                  <template v-slot:avatar>
                    <q-icon name="lock_open" color="primary" />
                  </template>
                  <div>Esta caja está abierta.</div>
                  <template v-slot:action>
                    <q-btn color="secondary" class="q-mr-sm" style="margin-right: 8px;" label="Cerrar caja" icon="lock"
                      @click="showModalCerrarCaja = true; selectedCaja = caja" />
                    <q-btn color="primary" label="Acceder" icon="login" @click="appStore.seleccionarCaja(caja)" />
                  </template>
                </q-banner>



              </template>
              <template v-else>
                <q-banner class="bg-red-1 q-pb-md">
                  <template v-slot:avatar>
                    <q-icon name="lock" color="red" />
                  </template>
                  <div class="text-red-4">Esta caja está cerrada.</div>
                  <template v-slot:action>
                    <q-btn color="primary" label="Abrir caja" icon="lock_open"
                      @click="showModalAbrirCaja = true; selectedCaja = caja;" />

                    <template v-if="authStore.user.role_perms.find((role) => role == 'cajas.*')">
                      <q-btn color="primary" label="Ver último reporte" icon="description"
                        @click="handleDescargarReporteIngresos(caja.id, authStore.user.role_perms.find((role) => role == 'cajas.*'))" />
                    </template>

                  </template>
                </q-banner>
              </template>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
    <template v-else>

      <template v-if="appStore.cajaSeleccionada.esta_abierta">
        <div class="q-pa-md">
          <!--<q-input v-model="searchQuery" outlined dense placeholder="Buscar transacciones" class="q-mb-md"
            icon="search">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>-->

          <div class="flex justify-between q-mb-md">
            <div class="q-gutter-xs">
              <q-btn-toggle class="custom-btn-toggle" dense v-model="tipoTransaccion" toggle-color="primary" :options="[
                { label: 'Pagados', value: 'Pagado' },
                { label: 'Pendientes', value: 'Pendiente' },
              ]" />
              <q-btn dense color="negative" :flat="!verAnulados" label="Ver anulados" icon="archive" @click="verAnulados = true; tipoTransaccion = null, transaccionesTableRef.requestServerInteraction()" />
            </div>
            <div class="q-gutter-sm">
              <q-btn dense class="q-px-sm" color="primary" label="Crear recibo" icon="receipt" to="caja/recibos/nuevo" v-if="!authStore.user.role_perms.find((role) => role == 'cajas.verFiscal')" />
              <q-btn dense class="q-px-sm" color="primary" label="Relación de ingresos" icon="assessment" to="caja/reportes/ingresos" />
              <q-btn dense class="q-px-sm" color="primary" label="Histórico" icon="timeline" @click="openDialogHistorialIngresos()"  v-if="authStore.user.role_perms.find((role) => role == 'cajas.*' || role == 'cajas.verFiscal')" />
              <q-btn dense class="q-px-sm" color="primary" label="Reporte" icon="article" @click="handleGenerarReporteGeneral()"  v-if="authStore.user.role_perms.find((role) => role == 'cajas.*' || role == 'cajas.verFiscal')" />
            </div>
          </div>

          <q-table dense :rows="transacciones" :columns="transaccionesColumnas" row-key="name" :class="!$q.screen.lt.md && 'text-wrap'"
            ref="transaccionesTableRef" v-model:pagination="transaccionesTablePagination" :loading="transaccionesTableLoading"
            :filter="transaccionesTableFilter" @request="transaccionesTableRequest">
            <template v-slot:top-right>
              <q-btn dense icon="search" color="primary" label="Buscar pagos" class="q-pr-sm q-mr-md" @click="showDialogBuscarPagos = true" />
              <q-input dense debounce="300" v-model="transaccionesTableFilter" placeholder="Buscar...">
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </template>
            <template v-slot:body-cell-estatus="props">
              <q-td :props="props" style="padding-right: 0;" :class="props.row.deleted_at && 'highlighted'">
                <!-- lowercase and replace spaces with hyphens -->
                <q-badge :class="'badge-status-' + props.row.estatus.toLowerCase().replace(/\s/g, '-')">
                  {{ props.row.estatus }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-fiscal="props">
              <q-td :props="props" style="padding-right: 0;" :class="props.row.deleted_at && 'highlighted'">
                <q-checkbox v-model="props.row.es_fiscal" dense size="sm" color="primary" class="q-mr-xs" true-value="1" false-value="0"
                @update:model-value="handleSetEstatusFiscal(props.row.id, props.row.es_fiscal)"
                :disable="!authStore.user.role_perms.find((role) => role == 'cajas.fiscal' || role == 'cajas.*')"

                />
                <pre v-if="false">
                  {{ props.row.contrato.cliente }}
                </pre>
              </q-td>
            </template>
            <template v-slot:body-cell-num_contrato="props">
              <q-td :props="props">
                <a href="javascript:void(0)" @click="verContratosDialog.openDialog(props.row.contrato.num_contrato, props.row.contrato.tipo_parcela)">
                  {{ props.row.contrato.codnum_contrato }}
                </a>
              </q-td>
            </template>
            <template v-slot:body-cell-acciones="props">
              <q-td :props="props" class="q-gutter-x-xs">
                <q-btn color="primary" size="sm" dense icon="print" :loading="isLoadingPrint" @click="handleDownloadPdf(props.row.id, props.row.contrato)" :disable="props.row.estatus !== 'Pagado'" v-if="!props.row.deleted_at">
                  <template v-if="props.row.contrato.tipo_actividad == 'mantenimiento_parcelas' &&
                    props.row.contrato.tipo_parcela != 'Cremacion' &&
                    props.row.contrato?.fecha_vencimiento &&
                    props.row.contrato?.vigente_hasta
                  ">
                    <q-icon v-if="checkClienteIncompleto(props.row.contrato.cliente)" name="person" color="yellow-2">
                      <q-tooltip max-width="200px" class="text-center bg-black">
                        La información del cliente está incompleta.
                      </q-tooltip>
                    </q-icon>
                    <q-icon v-else-if="new Date(props.row.contrato.vigente_hasta) >= add(props.row.contrato.fecha_vencimiento, { years: 1})" name="warning" color="yellow-2">
                      <q-tooltip max-width="200px" class="text-center bg-black">
                        Debes renovar el contrato antes de imprimir el recibo.
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-btn>
                <q-btn color="primary" size="sm" dense icon="credit_card" @click="openDialogAgregarPago(props.row.id)" />
                <template v-if="!props.row.deleted_at">
                  <span>|</span>
                  <q-btn color="negative" size="sm" dense icon="archive" @click="handleVerificarEliminarTransaccion(props.row.id)">
                    <q-tooltip class="bg-black">Anular transacción</q-tooltip>
                  </q-btn>
                  <q-btn color="primary" size="sm" dense icon="check" @click="handleEditarTransaccion(props.row.id, { estatus: 'Pagado' })" v-if="props.row.estatus != 'Pagado'">
                    <q-tooltip class="bg-black">Marcar como pagado</q-tooltip>
                  </q-btn>
                  <q-btn color="warning" size="sm" dense icon="timer" @click="handleEditarTransaccion(props.row.id, { estatus: 'Pendiente' })" v-if="props.row.estatus != 'Pendiente'">
                    <q-tooltip class="bg-black">Marcar como pendiente</q-tooltip>
                  </q-btn>
                </template>
              </q-td>
            </template>
          </q-table>


          <!--<div class="row q-col-gutter-md">
            <div class="col-6">
              <h6 class="q-mb-none">Últimas transacciones</h6>
              <q-table :rows="filteredTransacciones" :columns="transaccionesColumns" row-key="fecha" class="q-mt-md">
              </q-table>
            </div>
            <div class="col-6">
              <h6 class="q-mb-none">Últimos movimientos de caja</h6>
              <q-table :rows="filteredMovimientosCaja" :columns="movimientosCajaColumns" row-key="fecha"
                class="q-mt-md">
              </q-table>
            </div>
          </div>-->

        </div>
      </template>
      <template v-else>
        <q-banner class="bg-grey-3 q-pb-md">
          <template v-slot:avatar>
            <q-icon name="lock" color="red" />
          </template>
          <div class="text-red-4">Esta caja está cerrada.</div>
          <template v-slot:action>
            <q-btn color="primary" label="Volver" icon="arrow_back" @click="appStore.seleccionarCaja({})"></q-btn>
            <q-btn color="primary" label="Abrir caja" icon="lock_open"
              @click="showModalAbrirCaja = true; selectedCaja = appStore.cajaSeleccionada;" />
          </template>
        </q-banner>
      </template>
    </template>

    <q-dialog allow-focus-outside v-model="showModalAgregarPago" class="j-dialog j-dialog-xl">
      <q-card>
        <q-card-section class="q-pa-none">
          <div class="row">
            <div class="col-12 col-md-5 q-py-lg">
              <div class="text-h6 text-primary text-center q-mb-lg">Detalles del recibo</div>
              <q-list separator bordered>
                <q-item v-for="item in transaccionData?.lineas || []">
                  <q-item-section style="display: block">
                    <span>
                      <q-btn size="sm" dense icon="edit" color="primary" @click="handleEditLineaRecibo(item)" />
                      {{ item.descripcion }}
                    </span>
                    <span class="text-grey text-caption">x {{ item.cantidad }}</span>
                  </q-item-section>
                  <q-item-section side class="text-right">
                    <div class="text-body2 text-dark">REF. {{ $dinero(item.total_ref) }}</div>
                    <div class="text-caption">{{ transaccionData?.simbolo }} {{ $dinero(item.total_ref * (transaccionData?.tasa_actual || 1)) }}</div>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-table flat square bordered hide-bottom hide-header :columns="totalsColumns" :rows="totalsData" :pagination="{ rowsPerPage: 0 }">
                <template v-slot:body="props">
                  <q-tr :props="props" class="text-right" :class="props.rowIndex + 1 == totalsData.length && 'bg-primary text-white'" v-show="!!props.row.total">
                    <q-td key="tipo" :props="props" class="text-right">
                      <span class="text-weight-bold" style="font-size: .95rem">
                        {{ props.row.tipo || '-' }}
                      </span>
                    </q-td>
                    <q-td key="total" :props="props" class="text-right">
                      <div class="q-pl-xl" :class="props.rowIndex + 1 == totalsData.length && 'text-h5'">{{ $dinero(props.row.total) }}</div>
                      <div class="text-grey">{{ $dinero(props.row.total * (transaccionData?.tasa_actual || 1)) }} {{ transaccionData?.simbolo }}</div>
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
              <div class="text-center q-mt-md" v-if="transaccionData.pagos?.length">
                <q-btn label="Ver pagos" icon="credit_card" color="primary" @click="openDialogVerPagos" />
              </div>
              <q-separator class="q-my-md" />
              <div class="q-pl-md">
                <q-input type="textarea" outlined v-model="transaccionData.descripcion" rows="4" label="Descripción del recibo" placeholder="Escribe una descripción para el recibo, que se mostrará en la versión impresa" readonly/>
              </div>
            </div>
            <div class="col-12 col-md-7 q-pa-lg text-center">
              <div class="text-h6 text-primary">Cantidad total a pagar</div>
              <div class="q-my-lg">
                <div class="text-h3">
                  <span class="text-body1 text-grey-9">{{ transaccionData?.simbolo }}</span> {{ $dinero(totalBalance * (transaccionData?.tasa_actual || 1) ) }}
                </div>
                <div class="text-h6">
                  <span class="text-caption text-grey-9">REF.</span> {{ $dinero(totalBalance) }}
                </div>
              </div>

              <q-table flat bordered hide-bottom hide-header
                class="q-mt-md" selection="multiple"
                v-model:selected="metodosPagoSelected"
                :rows="metodosPago" :columns="metodosPagoColumnas"
                :pagination="{ rowsPerPage: -1 }" >
                <template v-slot:body-cell-cantidad="props">
                  <q-td :props="props" class="text-center" style="padding-bottom: .75rem" :style="!metodosPagoSelected.includes(props.row) && 'white-space: break-spaces;'">
                    <div class="text-grey-6" v-if="!metodosPagoSelected.includes(props.row)">
                      {{ props.row.descripcion }}
                    </div>
                    <template v-if="metodosPagoSelected.includes(props.row)">
                      <q-input dense v-model="props.row[props.col.name]" type="number" step="0.01" label="Cantidad pagada"
                        @update:model-value="val => props.row['monto_transaccion'] = val / props.row.tasa * transaccionData.tasa_actual">
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
                <q-btn label="Cerrar" flat color="primary" @click="showModalAgregarPago = false" />
                <q-btn label="Guardar" icon="credit_card" color="primary" @click="handleSubmitAgregarPago" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showModalAbrirCaja" class="j-dialog">
      <q-card class="q-pa-md">
        <q-form @submit="handleSubmitAbrirCaja" :class="isLoadingSubmit && 'form-disabled'">
          <q-card-section>
            <div class="text-h6">Confirmar apertura de caja</div>
          </q-card-section>
          <q-card-section>
            <p>Antes de abrir <span class="text-weight-bold">{{ selectedCaja.nombre_caja }}</span>, confirma la tasa del
              día
              de las siguientes monedas:</p>
            <div class="row q-col-gutter-md">
              <div class="col-12" v-for="moneda in monedas" :key="moneda.id">
                <q-input outlined v-model="moneda.tasa" :label="`Tasa equivalente a 1 ${monedaPrincipal.moneda}`"
                  type="number" step="0.01" clearable>
                  <template v-slot:prepend>
                    <div class="text-body2">{{ moneda.simbolo }}</div>
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat color="primary" label="Cancelar" @click="showModalAbrirCaja = false" />
            <q-btn type="submit" color="primary" label="Abrir caja" :loading="isLoadingSubmit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showModalCerrarCaja" class="j-dialog">
      <q-card class="q-pa-md">
        <q-form @submit="handleSubmitCerrarCaja" :class="isLoadingSubmit && 'form-disabled'">
          <q-card-section>
            <div class="text-h6">Confirmar cierre de caja</div>
          </q-card-section>
          <q-card-section>
            <p>¿Estás seguro de que quieres cerrar <span class="text-weight-bold">{{ selectedCaja.nombre_caja }}</span>?
            </p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat color="primary" label="Cancelar" @click="showModalCerrarCaja = false" />
            <q-btn type="submit" color="primary" label="Cerrar caja" icon="lock" :loading="isLoadingSubmit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showModalHistorialIngresos" class="j-dialog j-dialog-xl">
      <q-card class="q-pa-md">
        <q-card-section>
          <div class="text-h6">Historial de ingresos</div>
        </q-card-section>
        <q-card-section>
          <div class="flex items-center justify-end">
            <q-input class="q-mr-sm" label="Reporte del mes" dense flat v-model="filterMonth" mask="####-##" :hide-bottom-space="true" outlined readonly clearable style="width: 180px; display: inline-flex">
              <template v-slot:append>
                <q-icon v-if="filterMonth" name="close" class="cursor-pointer" @click="filterMonth = ''"></q-icon>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="filterMonth" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                      @update:model-value="filterDateClosePopup = true" @navigation="filterDateClosePopup = false"
                      :default-year-month="(filterMonth || new Date().toISOString().substr(0, 7)).replace('-', '/')" years-in-month-view>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                  </q-icon>
              </template>
            </q-input>
            <q-btn color="primary" label="Ver reporte mensual" icon="print" @click="handleDescargarReporteIngresosMensual(filterMonth)" :disable="filterMonth == ''" />
          </div>
          <q-markup-table flat>
            <thead>
              <tr>
                <th style="text-align: left">Fecha de cierre</th>
                <th style="text-align: left">Caja</th>
                <th style="text-align: left">Cerrado por</th>
                <th style="text-align: left">Imprimir relación</th>
                <th style="text-align: left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cierre in cajaHistorial" :key="cierre.id">
                <td>{{ new Date(cierre.created_at).toISOString().slice(0, 10) }}</td>
                <td>{{ cierre.nombre_caja }}</td>
                <td style="max-width: 150px; line-height: 1.15; white-space: break-spaces">{{ cierre.nombre_completo }} ({{ cierre.username }})</td>
                <td class="q-gutter-x-xs">
                  <template v-if="authStore.user.role_perms.find((role) => role == 'cajas.*')">
                    <q-btn color="primary" size="sm" class="q-px-sm" label="General" icon="print" @click="handleDescargarReportePorCierre(cierre.id)" />
                    <q-btn color="primary" size="sm" class="q-px-sm" label="Por usuario" icon="print" @click="handleDescargarReportePorCierre(cierre.id, 'por_usuario')" />
                    <q-btn color="primary" size="sm" class="q-px-sm" label="Fiscal" icon="print" @click="handleDescargarReportePorCierre(cierre.id, 'fiscal')" />
                  </template>
                  <template v-if="authStore.user.role_perms.find((role) => role == 'cajas.verFiscal')">
                    <q-btn color="primary" size="sm" class="q-px-sm" label="General" icon="print" @click="handleDescargarReportePorCierre(cierre.id, 'fiscal')" />
                  </template>
                </td>
                <td style="max-width: 200px; line-height: 1.15; white-space: break-spaces">
                  <template v-if="cierre.notas?.length">
                    <ul class="q-pl-none q-mt-none">
                      <li v-for="(nota, index) in cierre.notas" :key="nota + '-' + index">{{ nota }}</li>
                    </ul>
                    <a class="block q-my-xs" href="javascript:void(0)" @click="openDialogEditarObservacionCierre(cierre)">
                      <q-badge outline color="primary">
                        <q-icon name="edit" class="q-mr-xs"></q-icon> Editar
                      </q-badge>
                    </a>
                  </template>
                  <span v-else>
                    <a class="block q-my-xs" href="javascript:void(0)" @click="openDialogEditarObservacionCierre(cierre)">
                      <q-badge outline color="primary">
                        <q-icon name="add" class="q-mr-xs"></q-icon> Agregar
                      </q-badge>
                    </a>
                  </span>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showModalEditarLineaRecibo" class="j-dialog j-dialog-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">Editar línea de recibo</div>
        </q-card-section>
        <q-card-section>
          <q-input type="textarea" outlined autogrow dense v-model="agregarEditarLineaRecibo.descripcion" label="Descripción" />

          <template v-if="agregarEditarLineaRecibo.ubicaciones?.length">

            <h6 class="text-center q-my-sm">Ubicaciones</h6>
            <template v-for="ubicacion in agregarEditarLineaRecibo.ubicaciones">
              <div class="row q-col-gutter-sm q-mb-sm">
                <div class="col-auto">
                  <QSelectUbicacion dense v-model="ubicacion.ubicacion_id" label="Ubicación" outlined clearable />
                </div>
                <div class="col">
                  <q-input dense type="date" v-model="ubicacion.pagado_hasta" label="Pagado hasta" outlined clearable></q-input>
                </div>
              </div>
            </template>

          </template>

        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" icon="credit_card" color="primary" @click="handleSubmitEditarLineaRecibo" :loading="isLoadingEditarLineaRecibo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showDialogBuscarPagos" class="j-dialog j-dialog-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">Buscar pagos</div>
        </q-card-section>
        <q-card-section>
          <q-input dense outlined v-model="buscarReferenciaPago" debounce="300" label="Buscar referencia de pago" class="q-mb-md" clearable @update:model-value="val => handleBuscarReferenciaPago(val)" />
          <q-separator class="q-my-md" />
          <q-markup-table flat separator="cell" dense v-if="buscarReferenciaPago">
            <thead>
              <tr>
                <th>N° recibo</th>
                <th>Fecha de emisión</th>
                <th>Monto</th>
                <th>Referencia</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pago in pagosEncontrados" :key="pago.id">
                <td class="text-center"><a href="javascript:void(0)" class="text-weight-bold text-green-9" @click="openDialogAgregarPago(pago.transaccion_id)">{{ pago.num_transaccion }}</a></td>
                <td class="text-center">{{ pago.fecha_emision.substr(0, 10) }}</td>
                <td class="text-center">{{ monedas.find(m => m.id == pago.moneda_id)?.simbolo }} {{ $dinero(pago.monto) }}</td>
                <td class="text-center">{{ pago.referencia }}</td>
                <td style="white-space: break-spaces;">{{ pago.descripcion }}</td>
              </tr>
              <tr v-if="pagosEncontrados.length == 0">
                <td colspan="5" class="text-center">No se encontraron pagos.</td>
              </tr>
            </tbody>
          </q-markup-table>
          <template v-else>
            <div class="text-center q-py-xl bg-green-1 text-grey-7" style="border: 1px dashed var(--q-primary); border-radius: 5px">
              Escribe una referencia de pago para buscar.
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showDialogVerPagos" class="j-dialog j-dialog-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">Detalle de pagos</div>
        </q-card-section>
        <q-card-section>
          <q-markup-table flat separator="cell" dense>
            <thead>
              <tr>
                <th></th>
                <th>Fecha registrado</th>
                <th>Método de pago</th>
                <th>Moneda</th>
                <th>Cantidad</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pago in transaccionData.pagos" :key="pago.id">
                <td>
                  <q-btn size="sm" dense color="negative" icon="delete" @click="handleEliminarPago(pago.id)" />
                  <q-btn size="sm" dense color="primary" icon="edit" @click="showDialogEditarPago = true; dialogEditarPagoData = pago" />
                </td>
                <td>{{ pago.created_at.substr(0, 10) }}</td>
                <td>{{ metodosPago.find(m => m.id == pago.metodo_pago_id)?.metodo || pago.metodo_pago_id }}</td>
                <td>{{ monedas.find(m => m.id == pago.moneda_id)?.simbolo || pago.moneda_id }}</td>
                <td>{{ pago.monto }}</td>
                <td>{{ pago.referencia }}</td>
              </tr>
              <tr v-if="transaccionData.pagos.length == 0">
                <td colspan="6">No hay pagos registrados.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showDialogEditarObservacionCierre" class="j-dialog j-dialog-lg">
      <q-card v-if="dialogObservacionesCierreData.id">
        <q-card-section>
          <div class="text-h6">{{ dialogObservacionesCierreData.nombre_caja }} ({{ dialogObservacionesCierreData.created_at.substr(0, 10) }})</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md q-mb-sm" v-for="(nota, index) in dialogObservacionesCierreData.notas" :key="'nota-' + index">
            <div class="col-auto" style="display: flex;align-items: center;">
              <q-btn color="negative" icon="delete" size="sm" @click="dialogObservacionesCierreData.notas.splice(index, 1)" :disable="dialogObservacionesCierreData.notas.length == 1"></q-btn>
            </div>
            <div class="col">
              <q-input v-model="dialogObservacionesCierreData.notas[index]" outlined></q-input>
            </div>
          </div>
          <div class="text-center q-mt-md">
            <q-btn color="primary" label="Agregar observación" icon="add" @click="dialogObservacionesCierreData.notas.push('')" />
          </div>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-actions align="right">
          <q-btn color="primary" type="submit" label="Guardar" icon="save" @click="handleEditarObservacionesCierre(dialogObservacionesCierreData.id, dialogObservacionesCierreData.notas)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showDialogEditarPago" class="j-dialog j-dialog-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6">Editar pago</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input type="number" step="0.01" v-model="dialogEditarPagoData.monto" label="Monto" clearable outlined dense />
            </div>
            <div class="col-6">
              <q-input type="number" step="0.01" v-model="dialogEditarPagoData.referencia" label="Referencia" clearable outlined dense />
            </div>
            <div class="col-3">
              <q-select v-model="dialogEditarPagoData.metodo_pago_id" :options="metodosPago.map(m => { return { label: m.metodo, value: m.id } })" label="Método de pago" clearable outlined dense map-options emit-value  />
            </div>
            <div class="col-6">
              <QSelectMoneda v-model="dialogEditarPagoData.moneda_id" label="Moneda" outlined dense @update:model-value="monedaId => {
                let monedaSeleccionada = appStore.monedas.find(m => m.id == monedaId)
                dialogEditarPagoData.tasa_ref = monedaSeleccionada.tasa
              }" />
            </div>
            <div class="col-3">
              <q-input type="number" step="0.01" v-model="dialogEditarPagoData.tasa_ref" label="Tasa" clearable outlined dense />
            </div>
          </div>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-actions align="right">
          <q-btn color="primary" type="submit" label="Guardar" icon="save" @click="handleEditarPago()" :loading="isLoadingEditarLineaRecibo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog allow-focus-outside v-model="showDialogReporteGeneral" class="j-dialog j-dialog-full">
      <q-card>
        <q-card-section>
          <div class="text-h6">Reporte general de caja</div>
        </q-card-section>

        <q-separator></q-separator>

        <q-card-section class="q-pa-md">
          <!-- SECCIÓN DE FILTROS -->
          <q-expansion-item
            icon="filter_list"
            label="Filtros avanzados"
            header-class="bg-primary text-white"
            class="q-mb-md"
          >
            <q-card class="bg-grey-1">
              <q-card-section class="q-pa-md">
                <div class="row q-col-gutter-md">
                  <!-- Tipos de ubicación -->
                  <div class="col-12 col-md-6">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">Tipo de ubicación</div>
                    <q-checkbox v-model="reporteFiltersActive.tipos" val="Parcelas" label="Parcelas (MTP)" />
                    <q-checkbox v-model="reporteFiltersActive.tipos" val="Nichos" label="Nichos (MTN)" />
                    <q-checkbox v-model="reporteFiltersActive.tipos" val="Columbarios" label="Columbarios (MTC)" />
                  </div>

                  <!-- Vigencia -->
                  <div class="col-12 col-md-3">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">Vigencia</div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <q-input dense outlined type="date" v-model="reporteFiltersActive.vigenciaDesde" label="Desde" clearable />
                      </div>
                      <div class="col-6">
                        <q-input dense outlined type="date" v-model="reporteFiltersActive.vigenciaHasta" label="Hasta" clearable />
                      </div>
                    </div>
                    
                    
                  </div>

                  <!-- Último recibo -->
                  <div class="col-12 col-md-3">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">Último recibo</div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <q-input dense outlined type="date" v-model="reporteFiltersActive.ultimoReciboDesde" label="Desde" clearable />
                      </div>
                      <div class="col-6">
                        <q-input dense outlined type="date" v-model="reporteFiltersActive.ultimoReciboHasta" label="Hasta" clearable />
                      </div>
                    </div>
                  </div>

                  <!-- Estado -->
                  <div class="col-12 col-md-3">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">Estado</div>
                    <q-select
                      dense
                      outlined
                      v-model="reporteFiltersActive.estado"
                      :options="['Activo', 'Inactivo']"
                      emit-value
                      map-options
                      clearable
                      label="Seleccionar estado"
                    />
                  </div>

                  <!-- Meses de mora -->
                  <div class="col-12 col-md-3">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">Meses de mora</div>
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-select
                          dense
                          outlined
                          v-model="reporteFiltersActive.moraOperador"
                          :options="[
                            { label: 'Igual', value: 'igual' },
                            { label: 'Mayor que', value: 'mayor' },
                            { label: 'Menor que', value: 'menor' }
                          ]"
                          emit-value
                          map-options
                        />
                      </div>
                      <div class="col-6">
                        <q-input dense outlined type="number" v-model="reporteFiltersActive.moraCantidad" label="Número" clearable />
                      </div>
                    </div>
                  </div>

                  <!-- Cantidad de ubicaciones -->
                  <div class="col-12 col-md-3">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">Cantidad de ubicaciones</div>
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-select
                          dense
                          outlined
                          v-model="reporteFiltersActive.ubicacionesOperador"
                          :options="[
                            { label: 'Igual', value: 'igual' },
                            { label: 'Mayor que', value: 'mayor' },
                            { label: 'Menor que', value: 'menor' }
                          ]"
                          emit-value
                          map-options
                        />
                      </div>
                      <div class="col-6">
                        <q-input dense outlined type="number" v-model="reporteFiltersActive.ubicacionesCantidad" label="Número" clearable />
                      </div>
                    </div>
                  </div>
                  
                  <!-- Total deuda -->
                  <div class="col-12 col-md-3">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">Total deuda</div>
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-select
                          dense
                          outlined
                          v-model="reporteFiltersActive.deudaOperador"
                          :options="[
                            { label: 'Igual', value: 'igual' },
                            { label: 'Mayor que', value: 'mayor' },
                            { label: 'Menor que', value: 'menor' }
                          ]"
                          emit-value
                          map-options
                        />
                      </div>
                      <div class="col-6">
                        <q-input dense outlined type="number" v-model="reporteFiltersActive.deudaCantidad" label="Monto" clearable />
                      </div>
                    </div>
                  </div>

                  
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Cuadro de resumen expandible -->
          <q-expansion-item
            icon="summarize"
            label="Resumen de estadísticas"
            header-class="bg-info text-white"
            class="q-mb-md"
          >
            <q-card class="bg-blue-1">
              <q-card-section class="q-pa-md">
                <div class="row q-col-gutter-lg">
                  <!-- Parcelas activas -->
                  <div class="col-12 col-md-4 col-lg">
                    <div class="text-center">
                      <div class="text-h3 text-primary text-weight-bold">{{ reporteSummary.parcelasActivas }}</div>
                      <div class="text-subtitle2 text-grey-7">Parcelas activas</div>
                    </div>
                  </div>

                  <!-- Nichos activos -->
                  <div class="col-12 col-md-4 col-lg">
                    <div class="text-center">
                      <div class="text-h3 text-primary text-weight-bold">{{ reporteSummary.nichosActivos }}</div>
                      <div class="text-subtitle2 text-grey-7">Nichos activos</div>
                    </div>
                  </div>

                  <!-- Columbarios activos -->
                  <div class="col-12 col-md-4 col-lg">
                    <div class="text-center">
                      <div class="text-h3 text-primary text-weight-bold">{{ reporteSummary.columbiariosActivos }}</div>
                      <div class="text-subtitle2 text-grey-7">Columbarios activos</div>
                    </div>
                  </div>

                  <!-- Clientes vigentes -->
                  <div class="col-12 col-md-4 col-lg">
                    <div class="text-center">
                      <div class="text-h6 text-positive text-weight-bold q-py-sm">{{ reporteSummary.clientesVigentes }} ({{ reporteSummary.porcentajeClientesVigentes.toFixed(2) }}%)</div>
                      <div class="text-subtitle2 text-grey-7">Clientes vigentes</div>
                    </div>
                  </div>

                  <!-- Clientes vigentes -->
                  <div class="col-12 col-md-4 col-lg">
                    <div class="text-center">
                      <div class="text-h6 text-red text-weight-bold q-py-sm">{{ reporteSummary.clientesEnMora }} ({{ reporteSummary.porcentajeClientesEnMora.toFixed(2) }}%)</div>
                      <div class="text-subtitle2 text-grey-7">Clientes con deuda</div>
                    </div>
                  </div>

                  <!-- Clientes suspendidos -->
                  <div class="col-12 col-md-4 col-lg">
                    <div class="text-center">
                      <div class="text-h6 text-negative text-weight-bold q-py-sm">{{ reporteSummary.clientesSuspendidos }}</div>
                      <div class="text-subtitle2 text-grey-7">Clientes suspendidos</div>
                    </div>
                  </div>

                  <!-- Deuda total activos -->
                  <div class="col-12 col-md-6 col-lg">
                    <div class="text-center">
                      <div class="text-h6 text-red-9 text-weight-bold q-py-sm">${{ $dinero(reporteSummary.deudaActivos) }}</div>
                      <div class="text-subtitle2 text-grey-7">Deuda activos</div>
                    </div>
                  </div>

                  <!-- Deuda total -->
                  <div class="col-12 col-md-6 col-lg">
                    <div class="text-center">
                      <div class="text-h6 text-red-9 text-weight-bold q-py-sm">${{ $dinero(reporteSummary.deudaTotal) }}</div>
                      <div class="text-subtitle2 text-grey-7">Deuda activos + inactivos</div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Info de filtros -->
          <div class="text-caption text-grey-7 q-mb-md">
            {{ reporteDataFiltered.length }} de {{ reporteData.length }} registros
            <span v-if="reporteSort.column" class="q-ml-md">
              | Ordenado por: <strong>{{ reporteSort.column }}</strong> ({{ reporteSort.type }})
            </span>
          </div>

          <!-- Tabla virtual scroll -->
          <q-virtual-scroll
            dense
            type="table"
            ref="reporteTableRef"
            style="max-height: 60vh"
            :virtual-scroll-item-size="48"
            :virtual-scroll-sticky-size-start="48"
            :virtual-scroll-sticky-size-end="32"
            :items="reporteDataFiltered || []"
          >
            <template v-slot:before>
              <thead class="thead-sticky text-left">
                <tr>
                  <th style="width: 40px"></th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('nombre_completo')">
                    Propietario
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'nombre_completo' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'nombre_completo' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('codigo_seccion')">
                    Ubicación
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'codigo_seccion' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'codigo_seccion' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('num_contrato')">
                    Contrato
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'num_contrato' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'num_contrato' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('estatus')">
                    Estado
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'estatus' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'estatus' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('vigente_hasta')">
                    Vigente hasta
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'vigente_hasta' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'vigente_hasta' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('meses')">
                    Meses de mora
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'meses' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'meses' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('ubicaciones')">
                    Ubicaciones
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'ubicaciones' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'ubicaciones' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('fecha_ultimo_recibo')">
                    Último recibo
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'fecha_ultimo_recibo' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'fecha_ultimo_recibo' && reporteSort.type === 'DESC'" />
                  </th>
                  <th style="cursor: pointer; user-select: none" @click="handleSetReporteSort('total_pagar')">
                    Total deuda
                    <q-icon name="arrow_upward" size="xs" v-if="reporteSort.column === 'total_pagar' && reporteSort.type === 'ASC'" />
                    <q-icon name="arrow_downward" size="xs" v-if="reporteSort.column === 'total_pagar' && reporteSort.type === 'DESC'" />
                  </th>
                </tr>
              </thead>
              <tr v-if="isLoadingReporteGeneral">
                <td class="text-grey-5 text-center bg-grey-3" colspan="10">
                  <q-spinner size="lg" color="primary"/>
                </td>
              </tr>
              <tr v-else-if="!reporteDataFiltered || reporteDataFiltered.length === 0">
                <td class="text-grey-5 text-center bg-grey-3" colspan="10">
                  <p class="q-mb-none q-py-lg">-- No hay resultados --</p>
                </td>
              </tr>
            </template>

            <template v-slot:after>
              <tfoot class="tfoot-sticky text-left">
                <tr>
                  <th style="width: 40px"></th>
                  <th>Propietario</th>
                  <th>Ubicación</th>
                  <th>Contrato</th>
                  <th>Estado</th>
                  <th>Vigente hasta</th>
                  <th>Meses de mora</th>
                  <th>Ubicaciones</th>
                  <th>Último recibo</th>
                  <th>Total deuda</th>
                </tr>
              </tfoot>
            </template>

            <template v-slot="{ item: row, index }">
              <tr :key="index">
                <td style="padding-right: 0; padding-left: .5em; width: 40px">
                  <q-checkbox v-model="reporteSelectedRows" :val="row"></q-checkbox>
                </td>

                <!-- Propietario -->
                <td style="max-width: 200px; white-space: break-spaces; font-size: 0.9rem;">
                  {{ row.nombre_completo }}
                  <div class="text-caption text-grey-7">{{ row.num_identidad }}</div>
                </td>

                <!-- Ubicación -->
                <td style="white-space: nowrap">
                  <div>{{ row.codigo_seccion }}-{{ row.num_parcela }}</div>
                </td>

                <!-- Contrato -->
                <td>
                  {{ row.num_contrato }}
                </td>

                <!-- Estado -->
                <td>
                  <q-badge 
                    :color="row.estatus === 'Activo' ? 'positive' : 'negative'" 
                    :label="row.estatus"
                    style="text-transform: uppercase; font-size: .7rem"
                  />
                </td>

                <!-- Vigente hasta -->
                <td>
                  <template v-if="row.vigente_hasta">
                    <div 
                      :class="new Date(row.vigente_hasta) < new Date() ? 'text-red-9 text-weight-bold' : ''"
                    >
                      {{ format(new Date(row.vigente_hasta), 'dd/MM/yyyy') }}
                    </div>
                  </template>
                  <template v-else>
                    <span class="text-grey-5">-</span>
                  </template>
                </td>

                <!-- Meses de mora -->
                <td class="text-center">
                  <span :class="row.meses > 0 ? 'text-red-9 text-weight-bold' : 'text-green-9'">
                    {{ row.meses }}
                  </span>
                </td>

                <!-- Ubicaciones -->
                <td class="text-center">
                  {{ row.ubicaciones }}
                </td>

                <!-- Último recibo -->
                <td>
                  <template v-if="row.fecha_ultimo_recibo">
                    {{ format(new Date(row.fecha_ultimo_recibo), 'dd/MM/yyyy') }}
                  </template>
                  <template v-else>
                    <span class="text-grey-5">-</span>
                  </template>
                </td>

                <!-- Total deuda -->
                <td class="text-right">
                  <template v-if="row.total_pagar">
                    <span class="text-weight-bold text-red-9">{{ $dinero(row.total_pagar) }}</span>
                  </template>
                  <template v-else>
                    <span class="text-grey-5">-</span>
                  </template>
                </td>
              </tr>
            </template>

          </q-virtual-scroll>
        </q-card-section>

        <q-separator></q-separator>


        <!-- Acciones -->
        <q-card-actions align="right" class="q-pa-md">
          <q-btn 
            color="primary" 
            label="Descargar PDF" 
            icon="picture_as_pdf"
            @click="handleDescargarReportePdf()"
            :loading="isLoadingReportePdf"
          />
          <q-btn flat color="primary" label="Cerrar" @click="showDialogReporteGeneral = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>

  <DialogVerContratos ref="verContratosDialog" />
  <DialogRenovarContrato ref="renovarContratoDialog" @done="handleRenovarContrato" />
  <DialogActualizarFechas ref="actualizarFechasDialog" />
  <DialogAgregarCliente ref="editarClienteDialog" @updated="transaccionesTableRef.requestServerInteraction()" />

</template>

<style>
.badge-status-pendiente {
  background-color: #ffd700;
  color: #000;
}

.badge-status-anulado {
  background-color: var(--q-negative);
  color: #fff;
}

.badge-status-contactado {
  background-color: #e3f2fd !important
}

.badge-status-no-contactado {
  background-color: #ffebee !important
}

.badge-status-respondido {
  background-color: #e8f5e9 !important
}

.custom-btn-toggle .q-btn {
  padding: .285em 8px;
}
</style>

<script setup>
  import { ref, computed, onMounted, onBeforeMount, watch, toRef } from "vue";
  import { api } from "src/boot/axios";
  import { useRouter } from "vue-router";
  import { $dinero, qNotify } from 'src/boot/jardines';
  import { useAppStore } from "src/stores/app.store";
  import { useAuthStore } from "src/stores/auth.store";
  import { format, add } from "date-fns";
  import { useQuasar } from 'quasar';

  import QSelectUbicacion from "src/components/selects/QSelectUbicacion.vue";
  import QSelectMoneda from "src/components/selects/QSelectMoneda.vue";
  import QSelectMetodosPago from "src/components/selects/QSelectMetodosPago.vue";

  import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
  import DialogVerContratos from "src/components/popups/DialogVerContratos.vue";
  import DialogRenovarContrato from "src/components/popups/DialogRenovarContrato.vue";
  import DialogActualizarFechas from "src/components/popups/DialogActualizarFechas.vue";

  const appStore = useAppStore();
  const router = useRouter()

  const filterMonth = ref(new Date().toISOString().substr(0, 7))
  const filterDateClosePopup = ref(false)

  const authStore = useAuthStore();

  const tipoTransaccion = ref('Pendiente');
  const verAnulados = ref(false)

  const showModalEditarLineaRecibo = ref(false)
  const showDialogBuscarPagos = ref(false)
  const showDialogEditarPago = ref(false)
  const agregarEditarLineaRecibo = ref({})
  const isLoadingEditarLineaRecibo = ref(false)

  const verContratosDialog = ref(null)
  const renovarContratoDialog = ref(null)
  const actualizarFechasDialog = ref(null)
  const editarClienteDialog = ref(null)

  const servicios = ref([])

  const $q = useQuasar()

  const dialogEditarPagoData = ref({})
  const handleEditarPago = () => {
    const postData = {
      id: dialogEditarPagoData.value.id,
      metodo_pago_id: dialogEditarPagoData.value.metodo_pago_id,
      monto: dialogEditarPagoData.value.monto,
      tasa_ref: dialogEditarPagoData.value.tasa_ref,
      referencia: dialogEditarPagoData.value.referencia,
      moneda_id: dialogEditarPagoData.value.moneda_id,
      cliente_id: dialogEditarPagoData.value.cliente_id,
      transaccion_id: dialogEditarPagoData.value.transaccion_id,
    }

    isLoadingEditarLineaRecibo.value = true

    api.post('caja/transacciones/editarPago/' + dialogEditarPagoData.value.id, postData)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Pago editado correctamente.', color: 'positive' })
          showDialogVerPagos.value = false
          showDialogEditarPago.value = false
          showModalAgregarPago.value = false
          transaccionesTableRef.value.requestServerInteraction()
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEditarPago() }))
      .finally(() => isLoadingEditarLineaRecibo.value = false)
  }

  const handleEditLineaRecibo = (linea) => {
    console.log(linea)
    showModalEditarLineaRecibo.value = true
    agregarEditarLineaRecibo.value = {
      id: linea.id,
      transaccion_id: linea.transaccion_id,
      descripcion: linea.descripcion,
      ubicaciones: linea.ubicaciones.map(u => {
        return {
          id: u.id,
          ubicacion_id: u.ubicacion_id,
          pagado_hasta: u.pagado_hasta ? u.pagado_hasta.substr(0, 10) : null,
        }
      })
    }
  }

  const handleSetEstatusFiscal = (id, es_fiscal) => {
    api.post('caja/transacciones/fiscal/' + id, { es_fiscal })
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Estatus actualizado correctamente.', color: 'positive' })
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleSetEstatusFiscal(id, estatus) }))
  }

  const handleSubmitEditarLineaRecibo = () => {
    isLoadingEditarLineaRecibo.value = true
    let postData = agregarEditarLineaRecibo.value

    console.log('postData', postData);

    api.post('caja/transacciones/editarLineaRecibo', postData)
      .then(response => {
        if (response.data) {
          agregarEditarLineaRecibo.value = {}
          showModalEditarLineaRecibo.value = false
          $q.notify({ message: 'Línea de recibo editada exitosamente.', color: 'positive' })
          openDialogAgregarPago(postData.transaccion_id)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleSubmitEditarLineaRecibo }))
      .finally(() => isLoadingEditarLineaRecibo.value = false)
  }

  const isLoadingEliminarTransaccion = ref(false)

  const handleVerificarEliminarTransaccion = (id, confirm = false, params = {}) => {
    if (!confirm) {
      $q.dialog({
        title: 'Anular transacción',
        message: '¿Estás seguro de que quieres anular esta transacción?',
        cancel: true,
        persistent: true,
        ok: {
          label: 'Anular',
          color: 'negative',
          flat: false,
          icon: 'archive'
        },
        cancel: {
          label: 'Cancelar',
          color: 'primary',
          flat: true,
          icon: 'cancel'
        }
      }).onOk(() => {
        handleVerificarEliminarTransaccion(id, true)
      })
    } else {
      isLoadingEliminarTransaccion.value = true

      let endpoint = 'caja/transacciones/verificar/' + id

      api.delete(endpoint)
        .then(response => {
          if (response.data) {
            $q.notify({ message: 'Transacción anulada exitosamente.', color: 'positive' })
            transaccionesTableRef.value.requestServerInteraction()
          }
        })
        .catch(error => {
          if (error.response?.data?.messages?.contrato) {
            let contrato = error.response.data.messages.contrato

            actualizarFechasDialog.value.openDialog({
              contrato_id: contrato?.id,
              rows: contrato?.parcelas || [],
              transaccion: error.response.data.messages.transaccion,
              callback: () => handleEliminarTransaccion(id)
            })

            qNotify('Actualiza la última fecha de pago antes de anular el recibo.', 'error')
            return
          }

          qNotify(error, 'error', { callback: () => handleVerificarEliminarTransaccion(id, true) })
        })
        .finally(() => isLoadingEliminarTransaccion.value = false)
    }
  }

  const handleEliminarTransaccion = (id) => {
    isLoadingEliminarTransaccion.value = true
    api.delete('caja/transacciones/' + id)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Transacción eliminada exitosamente.', color: 'positive' })
          transaccionesTableRef.value.requestServerInteraction()
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEliminarTransaccion(id) }))
      .finally(() => isLoadingEliminarTransaccion.value = false)
  }

  const handleEditarTransaccion = (id, data = {}) => {

    isLoading.value = true

    api.post('caja/transacciones/update/' + id, data)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Transacción editada exitosamente.', color: 'positive' })
          transaccionesTableRef.value.requestServerInteraction()
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEditarTransaccion(id, data) }))
      .finally(() => isLoading.value = false)
  }

  const showDialogVerPagos = ref(false)

  const openDialogVerPagos = () => {
    showDialogVerPagos.value = true
  }

  const showDialogEditarObservacionCierre = ref(false)
  const dialogObservacionesCierreData = ref({
    id: null,
    notas: [],
    created_at: '',
    nombre_caja: '',
  })

  const openDialogEditarObservacionCierre = (cierre) => {
    showDialogEditarObservacionCierre.value = true
    dialogObservacionesCierreData.value = {
      id: cierre.id,
      notas: JSON.parse(JSON.stringify(cierre.notas.length ? cierre.notas : [''])),
      created_at: cierre.created_at,
      nombre_caja: cierre.nombre_caja,
    }
  }

  const isLoadingSubmitEditarObservacionesCierre = ref(false)

  const handleEditarObservacionesCierre = (cierreId, notas) => {
    notas = notas.filter(nota => nota.length) || []
    isLoadingSubmitEditarObservacionesCierre.value = true

    api.post('caja/movimientos/' + cierreId + '/notas', { notas })
      .then(response => {
        if (response.data) {
          showDialogEditarObservacionCierre.value = false
          $q.notify({ message: 'Observaciones guardadas.', color: 'positive' })
          openDialogHistorialIngresos()
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEditarObservacionesCierre(cierreId, notas) }))
      .finally(() => isLoadingSubmitEditarObservacionesCierre.value = false)
  }

  const showDialogReporteGeneral = ref(false)

  const reporteFilters = ref({
    tiposContrato: [],
    fechaInicio: null,
    fechaFin: null,
  })

  const reporteData = ref([])
  const reporteSelectedRows = ref([])
  const reporteTableRef = ref(null)
  const reporteDataFiltered = ref([])

  const reporteFiltersActive = ref({
    tipos: ['Parcelas', 'Nichos', 'Columbarios'], // Por defecto todos seleccionados
    estado: null,
    vigenciaDesde: null,
    vigenciaHasta: null,
    moraOperador: 'mayor', // 'igual', 'mayor', 'menor'
    moraCantidad: null,
    ubicacionesOperador: 'igual', // 'igual', 'mayor', 'menor'
    ubicacionesCantidad: null,
    recibosDesde: null,
    recibosHasta: null,
    deudaOperador: 'mayor', // 'igual', 'mayor', 'menor'
    deudaCantidad: null,
  })

  const reporteSort = ref({
    column: null,
    type: 'ASC', // 'ASC', 'DESC'
  })

  const isLoadingReporteGeneral = ref(false)
  const isLoadingReportePdf = ref(false)

  // Función para determinar el tipo de ubicación por código de contrato
  const getTipoUbicacion = (numContrato) => {
    if (!numContrato) return null
    if (numContrato.startsWith('MTP')) return 'Parcelas'
    if (numContrato.startsWith('MTN')) return 'Nichos'
    if (numContrato.startsWith('MTC')) return 'Columbarios'
    return null
  }

  // Computed property para calcular resumen de estadísticas
  const reporteSummary = computed(() => {
    // Usar reporteData completo para cálculos de totales sin filtros
    const allData = reporteData.value || []
    
    // Parcelas activas - suma del campo ubicaciones
    const parcelasActivas = allData
      .filter(row => 
        getTipoUbicacion(row.num_contrato) === 'Parcelas' && 
        row.estatus === 'Activo'
      )
      .reduce((sum, row) => sum + (row.ubicaciones || 0), 0)

    // Nichos activos - suma del campo ubicaciones
    const nichosActivos = allData
      .filter(row => 
        getTipoUbicacion(row.num_contrato) === 'Nichos' && 
        row.estatus === 'Activo'
      )
      .reduce((sum, row) => sum + (row.ubicaciones || 0), 0)

    // Columbarios activos - suma del campo ubicaciones
    const columbiariosActivos = allData
      .filter(row => 
        getTipoUbicacion(row.num_contrato) === 'Columbarios' && 
        row.estatus === 'Activo'
      )
      .reduce((sum, row) => sum + (row.ubicaciones || 0), 0)

    // Clientes suspendidos - contar contratos inactivos
    const clientesSuspendidos = allData
      .filter(row => row.estatus === 'Inactivo')
      .length

    // Clientes vigentes - contar contratos donde meses de mora <= 0
    const clientesVigentes = allData
      .filter(row => row.meses <= 0)
      .length

    // Clientes vigentes - contar contratos donde meses de mora <= 0
    const clientesEnMora = allData
      .filter(row => row.meses > 0)
      .length

    const porcentajeClientesVigentes = clientesVigentes + clientesEnMora > 0
      ? (clientesVigentes / (clientesVigentes + clientesEnMora)) * 100
      : 0

    const porcentajeClientesEnMora = clientesVigentes + clientesEnMora > 0
      ? (clientesEnMora / (clientesVigentes + clientesEnMora)) * 100
      : 0

    // Deuda total de activos
    const deudaActivos = allData
      .filter(row => row.estatus === 'Activo')
      .reduce((sum, row) => sum + (row.total_pagar || 0), 0)

    // Deuda total (activos + inactivos)
    const deudaTotal = allData.reduce((sum, row) => sum + (row.total_pagar || 0), 0)

    return {
      parcelasActivas,
      nichosActivos,
      columbiariosActivos,
      clientesSuspendidos,
      clientesVigentes,
      clientesEnMora,
      porcentajeClientesVigentes,
      porcentajeClientesEnMora,
      deudaActivos,
      deudaTotal
    }
  })

  // Función para filtrar y ordenar datos
  const applyReporteFiltersAndSort = () => {
    let filtered = reporteData.value.filter(row => {
      // Filtro por tipo de ubicación
      const tipoUbicacion = getTipoUbicacion(row.num_contrato)
      if (!reporteFiltersActive.value.tipos.includes(tipoUbicacion)) {
        return false
      }

      // Filtro por estado
      if (reporteFiltersActive.value.estado && row.estatus !== reporteFiltersActive.value.estado) {
        return false
      }

      // Filtro por vigencia (desde/hasta)
      if (reporteFiltersActive.value.vigenciaDesde && new Date(row.vigente_hasta) < new Date(reporteFiltersActive.value.vigenciaDesde)) {
        return false
      }
      if (reporteFiltersActive.value.vigenciaHasta && new Date(row.vigente_hasta) > new Date(reporteFiltersActive.value.vigenciaHasta)) {
        return false
      }

      // Filtro por meses de mora
      if (reporteFiltersActive.value.moraCantidad !== null) {
        const cantidad = parseInt(reporteFiltersActive.value.moraCantidad)
        if (reporteFiltersActive.value.moraOperador === 'igual' && row.meses !== cantidad) {
          return false
        }
        if (reporteFiltersActive.value.moraOperador === 'mayor' && row.meses <= cantidad) {
          return false
        }
        if (reporteFiltersActive.value.moraOperador === 'menor' && row.meses >= cantidad) {
          return false
        }
      }

      // Filtro por cantidad de ubicaciones
      if (reporteFiltersActive.value.ubicacionesCantidad !== null) {
        const cantidad = parseInt(reporteFiltersActive.value.ubicacionesCantidad)
        if (reporteFiltersActive.value.ubicacionesOperador === 'igual' && row.ubicaciones !== cantidad) {
          return false
        }
        if (reporteFiltersActive.value.ubicacionesOperador === 'mayor' && row.ubicaciones <= cantidad) {
          return false
        }
        if (reporteFiltersActive.value.ubicacionesOperador === 'menor' && row.ubicaciones >= cantidad) {
          return false
        }
      }

      // Filtro por fecha de último recibo
      // NULL se considera como menor a cualquier fecha existente
      if (reporteFiltersActive.value.recibosDesde) {
        // Si recibosDesde está establecido, excluir NULL (porque NULL < cualquier fecha)
        if (!row.fecha_ultimo_recibo || new Date(row.fecha_ultimo_recibo) < new Date(reporteFiltersActive.value.recibosDesde)) {
          return false
        }
      }
      if (reporteFiltersActive.value.recibosHasta) {
        // Si recibosHasta está establecido, incluir NULL (porque NULL < cualquier fecha)
        if (row.fecha_ultimo_recibo && new Date(row.fecha_ultimo_recibo) > new Date(reporteFiltersActive.value.recibosHasta)) {
          return false
        }
      }

      // Filtro por total deuda
      if (reporteFiltersActive.value.deudaCantidad !== null) {
        const cantidad = parseFloat(reporteFiltersActive.value.deudaCantidad)
        if (reporteFiltersActive.value.deudaOperador === 'igual' && row.total_pagar !== cantidad) {
          return false
        }
        if (reporteFiltersActive.value.deudaOperador === 'mayor' && row.total_pagar <= cantidad) {
          return false
        }
        if (reporteFiltersActive.value.deudaOperador === 'menor' && row.total_pagar >= cantidad) {
          return false
        }
      }

      return true
    })

    // Ordenamiento
    if (reporteSort.value.column) {
      filtered.sort((a, b) => {
        let aValue = a[reporteSort.value.column]
        let bValue = b[reporteSort.value.column]

        // Manejo especial para fecha_ultimo_recibo: NULL se considera menor que cualquier fecha
        if (reporteSort.value.column === 'fecha_ultimo_recibo') {
          if (aValue == null && bValue == null) return 0
          if (aValue == null) return reporteSort.value.type === 'ASC' ? -1 : 1
          if (bValue == null) return reporteSort.value.type === 'ASC' ? 1 : -1
        } else {
          // Manejo normal de valores nulos/undefined
          if (aValue == null && bValue == null) return 0
          if (aValue == null) return 1
          if (bValue == null) return -1
        }

        // Comparación según tipo
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return reporteSort.value.type === 'ASC' ? -1 : 1
        }
        if (aValue > bValue) {
          return reporteSort.value.type === 'ASC' ? 1 : -1
        }
        return 0
      })
    }

    reporteDataFiltered.value = filtered
  }

  // Watcher para aplicar filtros cuando cambian
  watch(() => reporteFiltersActive.value, () => {
    applyReporteFiltersAndSort()
  }, { deep: true })

  watch(() => reporteSort.value, () => {
    applyReporteFiltersAndSort()
  }, { deep: true })

  watch(() => reporteData.value, () => {
    applyReporteFiltersAndSort()
  }, { deep: true })

  const handleGenerarReporteGeneral = () => {
    showDialogReporteGeneral.value = true
    isLoadingReporteGeneral.value = true

    let postData = {
      caja_id: appStore.cajaSeleccionada?.id,
    }

    console.log('Generando reporte...')

    api.get('caja/cajas/reporte', { params: postData })
      .then(response => {
        if (response.data) {
          reporteData.value = response.data
          reporteDataFiltered.value = response.data
          reporteSelectedRows.value = []
          // Resetear filtros y ordenamiento
          reporteFiltersActive.value = {
            tipos: ['Parcelas', 'Nichos', 'Columbarios'],
            estado: null,
            vigenciaDesde: null,
            vigenciaHasta: null,
            moraOperador: 'mayor',
            moraCantidad: null,
            ubicacionesOperador: 'igual',
            ubicacionesCantidad: null,
            recibosDesde: null,
            recibosHasta: null,
          }
          reporteSort.value = { column: null, type: 'ASC' }
          qNotify('Reporte generado correctamente', 'positive')
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleGenerarReporteGeneral }))
      .finally(() => isLoadingReporteGeneral.value = false)
  }

  const handleDescargarReportePdf = () => {
    isLoadingReportePdf.value = true

    const postData = {
      caja_id: appStore.cajaSeleccionada?.id,
    }

    api
      .get('caja/cajas/reporte/pdf', { params: postData, responseType: 'blob' })
      .then((response) => {
        window.open(URL.createObjectURL(response.data))
        qNotify('PDF descargado correctamente', 'positive')
      })
      .catch(async (error) => {
        try {
          error.response.data = JSON.parse(await error.response.data.text())
        } catch (e) {
          // Si no es JSON, dejar el error como está
        }
        qNotify(error, 'error', {
          callback: () => handleDescargarReportePdf(),
        })
      })
      .finally(() => isLoadingReportePdf.value = false)
  }

  const handleSetReporteSort = (columnName) => {
    if (reporteSort.value.column === columnName) {
      // Cambiar tipo de orden: ASC -> DESC -> null
      if (reporteSort.value.type === 'ASC') {
        reporteSort.value.type = 'DESC'
      } else if (reporteSort.value.type === 'DESC') {
        reporteSort.value.column = null
        reporteSort.value.type = 'ASC'
      }
    } else {
      // Seleccionar nueva columna con ASC
      reporteSort.value.column = columnName
      reporteSort.value.type = 'ASC'
    }
  }

  const handleEliminarPago = (id, confirm = false) => {
    if (!confirm) {
      $q.dialog({
        title: 'Eliminar pago',
        message: '¿Estás seguro de que quieres eliminar este pago?',
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
        handleEliminarPago(id, true)
      })
    } else {
      isLoadingEliminarPago.value = true
      api.delete('caja/transacciones/eliminarPago/' + id)
        .then(response => {
          if (response.data) {
            $q.notify({ message: 'Pago eliminado exitosamente.', color: 'positive' })
            if (transaccionData.value?.id) {
              openDialogAgregarPago(transaccionData.value.id)
              transaccionesTableRef.value.requestServerInteraction()
            }
            showDialogVerPagos.value = false
          }
        })
        .catch(error => qNotify(error, 'error', { callback: () => handleEliminarPago(id) }))
        .finally(() => isLoadingEliminarPago.value = false)
    }
  }

  const isLoadingEliminarPago = ref(false)

  const searchQuery = ref('')

  const handleVerificarReferencia = (row, value) => {
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

  const handleSubmitAgregarPago = () => {

    if (!metodosPagoSelected?.value?.length) {
      qNotify('Debes seleccionar al menos un método de pago', 'error')
      return;
    }

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

    let postData = {
      pagos: metodosPagoSelected?.value?.map(pago => {
        return {
          metodo_pago_id: pago.id,
          monto: pago.cantidad,
          monto_transaccion: pago.monto_transaccion,
          referencia: pago.referencia,
          moneda_id: pago.moneda_id,
          tasa_ref: pago.tasa,
          caja_id: appStore.cajaSeleccionada?.id,
          cliente_id: transaccionData.value.cliente_id,
          transaccion_id: transaccionData.value.id,
        }
      }),
      caja_id: appStore.cajaSeleccionada?.id,
    }

    console.log('postData', postData);

    api.post('caja/transacciones/' + transaccionData.value.id + '/pagos', postData)
      .then(response => {
        qNotify('Pago agregado correctamente', 'positive')
        showModalAgregarPago.value = false
        transaccionesTableRef.value.requestServerInteraction()
      })
      .catch(error => {
        qNotify(error, 'error')
      });
  }

  const handleRenovarContrato = (contrato) => {
    transaccionesTableRef.value.requestServerInteraction()
    if (contrato?.reciboId) {
      handleDownloadPdf(contrato.reciboId, contrato, () => {
        verContratosDialog.value.handleDownloadPdf(contrato)
      })
    }
  }

  const isLoadingPrint = ref(false)

  const handleDownloadPdf = (id, contrato = null, callback = null) => {

    isLoadingPrint.value = true;

    if (contrato?.id) {
      api.get('contratos/' + contrato.id)
      .then(response => {
        if (response.data) {
          contrato = response.data
          if (
            contrato.tipo_actividad == 'mantenimiento_parcelas' &&
            contrato.tipo_parcela != 'Cremacion' &&
            contrato?.fecha_vencimiento &&
            contrato?.vigente_hasta
          ) {
            if (checkClienteIncompleto(contrato.cliente)) {
              $q.notify({ message: 'Debes completar la información del cliente para imprimir el contrato.', color: 'negative', icon: 'warning' })
              return editarClienteDialog.value.openDialog(contrato.cliente.id)
            } else if (new Date(contrato.vigente_hasta) >= add(contrato.fecha_vencimiento, { years: 1})) {
              $q.notify({ message: 'Debes renovar el contrato antes de imprimir el recibo.', color: 'negative', icon: 'warning' })
              return renovarContratoDialog.value.openDialog(contrato.id, { reciboId: id})
            } else {
              return _handleDownloadPdf(id, callback);
            }
          } else {
            return _handleDownloadPdf(id, callback);
          }
        }
      })
      .finally(() => {
        isLoadingPrint.value = false
      })
    } else {
      return _handleDownloadPdf(id, callback);
    }

  };

  const _handleDownloadPdf = (id, callback = null) => {
    isLoadingPrint.value = false
    api
      .get("caja/transacciones/imprimir/" + id, { responseType: "blob" })
      .then((response) => {
        console.log(response);
        window.open(URL.createObjectURL(response.data));

        if (callback) callback()
      })
      .catch(async (error) => {
        console.log(error)
        error.response.data = JSON.parse(await error.response.data.text());
        qNotify(error, "error", {
          callback: () => _handleDownloadPdf(id, callback),
        });
      });
  }

  const showModalAbrirCaja = ref(false)
  const showModalCerrarCaja = ref(false)
  const showModalHistorialIngresos = ref(false)

  const cajaHistorial = ref([])

  const openDialogHistorialIngresos = () => {
    api.get('caja/cajas/historico')
      .then(response => {
        if (response.data) {
          console.log('response.data', response.data);
          cajaHistorial.value = response.data
        }
      })
      .catch(error => qNotify(error, 'error'))

    showModalHistorialIngresos.value = true
  }

  const cajaReporte = ref([])

  const openDialogReporteGeneral = () => {
    api.get('caja/cajas/reporte')
      .then(response => {
        if (response.data) {
          console.log('response.data', response.data);
          cajaReporte.value = response.data
        }
      })
      .catch(error => qNotify(error, 'error'))
  }

  const handleSubmitAbrirCaja = () => {
    isLoadingSubmit.value = true
    let postData = { caja_id: selectedCaja.value.id, monedas: [...monedas.value] }


    api.post('caja/cajas/abrir', postData)
      .then(response => {
        if (response.data) {
          selectedCaja.value.esta_abierta = true
          appStore.seleccionarCaja(selectedCaja.value)
          qNotify('Caja abierta correctamente', 'positive')
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleSubmitAbrirCaja }))
      .finally(() => {
        isLoadingSubmit.value = false
        showModalAbrirCaja.value = false
      })
  }

  const handleSubmitCerrarCaja = () => {
    isLoadingSubmit.value = true
    let postData = { caja_id: selectedCaja.value.id }

    api.post('caja/cajas/cerrar', postData)
      .then(response => {
        if (response.data) {
          selectedCaja.value.esta_abierta = false
          qNotify('Caja cerrada correctamente', 'positive')
          handleDescargarReporteIngresos(postData.caja_id, true)
          appStore.seleccionarCaja({})
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleSubmitCerrarCaja }))
      .finally(() => {
        isLoadingSubmit.value = false
        showModalCerrarCaja.value = false
      })
  }

  const checkClienteIncompleto = (cliente) => {
    let clienteIncompleto = false;

    ['nombre', 'apellido', 'direccion_habitacion', 'direccion_trabajo', 'telefono_principal', 'telefono_secundario', 'doc_identidad', 'doc_numero'].forEach(key => {
      if (!cliente[key]) clienteIncompleto = true;
    });

    return clienteIncompleto;
  }

  const handleDescargarReportePorCierre = (cierreId, tipoReporte = null) => {

    let endpoint = `caja/reportes/ingresos?cierre_id=${cierreId}&print=1`
    if (tipoReporte == 'por_usuario') {
      endpoint += '&por_usuario=1'
    } else if (tipoReporte == 'fiscal') {
      endpoint += '&fiscal=1'
    }

    console.log('Endpoint:', endpoint)

    api.get(endpoint, { responseType: "blob" })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async (error) => {
      console.log(error);
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, "error", {
        callback: () => handleDescargarReportePorCierre(cierreId, 'por_usuario'),
      });
    });
  };

  const handleDescargarReporteIngresos = (caja_id, porUsuario = false) => {

    let endpoint = `caja/reportes/ingresos?caja_id=${caja_id}&tipo=ultimo&print=1`
    if (porUsuario) {
      endpoint += '&por_usuario=1'
    }

    api.get(endpoint, { responseType: "blob" })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async (error) => {
      console.log(error);
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, "error", {
        callback: () => handleDescargarReporteIngresos(caja_id, porUsuario = false),
      });
    });
  };

  const handleDescargarReporteIngresosMensual = (mes) => {

    let endpoint = `caja/reportes/ingresos?mes=${mes}&tipo=mensual&print=1`

    api.get(endpoint, { responseType: "blob" })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async (error) => {
      console.log(error);
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, "error", {
        callback: () => handleDescargarReporteIngresosMensual(mes),
      });
    });
  }

  const selectedCaja = ref({})

  const isLoading = ref(false)
  const isLoadingSubmit = ref(false)
  const cajas = ref([])

  const monedas = computed(() => {
    return appStore.monedas.filter(moneda => !parseInt(moneda.es_principal))
  })

  const monedaPrincipal = computed(() => {
    return appStore.monedas.find(moneda => parseInt(moneda.es_principal))
  })

  /* TRANSACCIONES */
  const transaccionesColumnas = [
    { name: 'estatus', label: 'Estatus', align: 'left', field: 'estatus', sortable: true },
    { name: 'fiscal', label: 'Fiscal', align: 'left', field: 'es_fiscal', style: 'width: 50px' },
    { name: 'acciones', label: '', align: 'left' },
    { name: 'created_at', label: 'Fecha creado', align: 'left', field: 'created_at', sortable: true, format: (val) => format(new Date(val), 'dd/MM/yyyy HH:mm') },
    { name: 'nombre_cliente', label: 'Cliente', align: 'left', field: 'nombre_cliente', sortable: true, style: 'width: 200px; white-space: break-spaces; line-height: 1.15' },
    { name: 'ident_cliente', label: 'Cédula', align: 'left', field: 'ident_cliente', sortable: true },
    { name: 'num_contrato', label: 'Contrato', align: 'left', sortable: true },
    { name: 'fecha_pagado', label: 'Fecha pagado', align: 'left', format: (_, row) => row?.ultimo_pago?.created_at ? format(new Date(row?.ultimo_pago?.created_at), 'dd/MM/yyyy') : '-', sortable: true },
    { name: 'num_transaccion', label: 'N° recibo', align: 'left', field: 'num_transaccion', sortable: true },
    { name: 'total', label: 'Total', align: 'left', field: 'total', format: (val) => $dinero(val), sortable: true },
    { name: 'balance', label: 'Balance', align: 'left', field: 'balance', format: (val) => $dinero(val), sortable: true },
  ]

  const buscarReferenciaPago = ref('')
  const pagosEncontrados = ref([])
  const handleBuscarReferenciaPago = (val) => {
    pagosEncontrados.value = []
    api.post('caja/transacciones/verificarReferencia', { referencia: val })
      .then(response => {
        pagosEncontrados.value = response.data?.data || []
      })
      .catch(error => qNotify(error, 'error'))
  }

  const transacciones = ref([])

  const transaccionesTableRef = ref(null)
  const transaccionesTableLoading = ref(true)
  const transaccionesTableFilter = ref(router.currentRoute.value.query.search || '');
  const transaccionesTablePagination = ref({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'created_at',
    descending: true,
  })

  watch(tipoTransaccion, (val) => {
    transaccionesTableRef.value.requestServerInteraction()
    if (val) verAnulados.value = false
  })

  watch(toRef(appStore, 'cajaSeleccionada'), (value, old) => {
    if (value?.id && value.id !== old?.id) {
      window.location.reload()
    }
  })

  const transaccionesTableRequest = (props) => {
    const { page, rowsPerPage, sortBy, descending } = props.pagination
    transaccionesTableLoading.value = true;

    let endpoint = 'caja/transacciones';

    const searchParams = new URLSearchParams(
      Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
    );

    searchParams.append('with[]', 'data');
    searchParams.append('with[]', 'contrato');

    if (transaccionesTableFilter.value) {
      searchParams.append('s', transaccionesTableFilter.value)
      router.replace({ query: { search: transaccionesTableFilter.value } })
    }

    if (sortBy) {
      searchParams.append('order', descending ? 'DESC' : 'ASC')
    }

    if (tipoTransaccion.value) {
      searchParams.append('f[estatus]', tipoTransaccion.value)
    }

    if (verAnulados.value) {
      searchParams.append('archived', 1)
    }

    searchParams.append('f[caja_id]', appStore.cajaSeleccionada.id)

    if (searchParams) {
      endpoint += '?' + searchParams.toString();
    }

    console.log(endpoint)
    api.get(endpoint)
      .then(response => {
        if (response.data) {
          transacciones.value = response.data.data.map(row => {
            row.estatus = row.deleted_at ? 'Anulado' : row.estatus
            return row
          })
          transaccionesTablePagination.value.page = response.data.pager.currentPage
          transaccionesTablePagination.value.rowsPerPage = response.data.pager.perPage
          transaccionesTablePagination.value.rowsNumber = response.data.pager.total
          transaccionesTablePagination.value.sortBy = response.data.sortBy || null
          transaccionesTablePagination.value.descending = response.data.order == 'DESC'
        }
      })
      .catch(e => console.log(e))
      .finally(() => transaccionesTableLoading.value = false)
  }

  const transaccionData = ref({
    lineas: [],
    descripcion: ''
  })

  const showModalAgregarPago = ref(false)
  const openDialogAgregarPago = (id) => {

    metodosPagoSelected.value = []

    metodosPago.value.forEach(metodo => {
      delete metodo.cantidad;
      delete metodo.monto_transaccion;
      delete metodo.referencia;
      delete metodo.referencia_usada;
      delete metodo.referencias_usadas;
    })

    api.get('caja/transacciones/' + id)
      .then((response) => {
        console.log(response.data);
        transaccionData.value = response.data;
      })

    showModalAgregarPago.value = true;
  }

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

  const totalsData = computed(() =>[
    {
      tipo: 'Subtotal',
      total: transaccionData.value?.subtotal
    },
    {
      tipo: 'Impuestos',
      total: transaccionData.value?.impuestos
    },
    {
      tipo: 'Descuentos',
      total: transaccionData.value?.descuentos
    },
    {
      tipo: 'Pagado',
      total: transaccionData.value?.total_pagado
    },
    {
      tipo: 'Total',
      total: transaccionData.value?.balance
    }
  ])

  const metodosPago = ref([])

  const metodosPagoSelected = ref([])

  const metodosPagoColumnas = [
    { name: 'metodo', label: 'Método de pago', align: 'left', field: 'metodo' },
    { name: 'cantidad', label: 'Cantidad', align: 'left', field: 'cantidad' },
  ]

  const totalBalance = computed(() => {
    let totalFinal = transaccionData.value.balance || 0

    let totalPagado = 0

    // Tomar en cuenta la tasa de cada método de pago para restar del total final
    for (let i = 0; i < metodosPagoSelected.value.length; i++) {
      let metodo = metodosPagoSelected.value[i];
      totalPagado += (metodo.cantidad || 0) / (metodo.tasa || 1);
    }

    let balance = totalFinal - totalPagado;

    return balance;
  })

  onBeforeMount(() => {
    if (authStore.user.role_perms.find((role) => role == 'cajas.verFiscal')) {

      ['fiscal', 'acciones'].forEach(column => {
        let columnIndex = transaccionesColumnas.findIndex(c => c.name == column)
        if (columnIndex != -1) transaccionesColumnas.splice(columnIndex, 1)
      })

    }
  })


  onMounted(() => {
    if (transaccionesTableRef.value) {
      transaccionesTableRef.value.requestServerInteraction()
    }

    api.get('caja/cajas')
      .then(response => {
        if (response.data) {
          cajas.value = response.data

          if (appStore.cajaSeleccionada?.id) {
            let cajaSeleccionada = cajas.value.find(caja => caja.id === appStore.cajaSeleccionada.id)

            if (cajaSeleccionada) {
              appStore.seleccionarCaja(cajaSeleccionada)
            }
          }
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoading.value = false)

    api.get('caja/metodos')
      .then(response => {
        if (response.data) {
          console.log('Metodos', response.data);
          metodosPago.value = response.data.sort((a, b) => {
            // Ordenar primero por moneda_id
            if (a.moneda_id !== b.moneda_id) {
              return a.moneda_id - b.moneda_id;
            }
            // Si moneda_id es igual, ordenar por metodo
            return a.metodo.localeCompare(b.metodo);
          });
        }
      })
      .catch(e => console.log(e));

    api.get('servicios')
      .then(response => {
        if (response.data) {
          servicios.value = response.data
        }
      })

    appStore.getMonedas()
  })


</script>
