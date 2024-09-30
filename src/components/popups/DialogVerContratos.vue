<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xxl">

    <q-card class="q-pa-md scroll">
      <q-card-section>
        <div class="text-h6">Contratos asociados</div>
      </q-card-section>
      <div class="q-pb-lg text-center" v-if="isLoading">
        <q-spinner size="xl" color="primary" />
      </div>
      <template v-else-if="contratos.length">
        <q-card-section v-if="!contratos.find(c => c.tipo_actividad == 'mantenimiento_parcelas')">

          <q-banner class="bg-red-3 q-pb-md">
            <template v-slot:avatar>

              <q-icon class="q-mt-sm" name="warning" color="black" />

            </template>
            <div class="text-h6">Contrato de mantenimiento</div>
            <div>No se encontró ningún contrato de mantenimiento.</div>
          </q-banner>



        </q-card-section>
        <q-card-section class="q-px-none">
          <q-table dense flat :rows="contratos" :columns="columnas" :visible-columns="columnasVisibles" v-model:pagination="tablePagination" hide-bottom row-key="name">
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" class="q-gutter-xs" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
                <q-btn-dropdown dense size="sm" color="primary" flat icon="more_horiz">
                  <q-list>
                    <q-item clickable @click="editarContratoDialog.openDialog(props.row.id)" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="edit" />
                      </q-item-section>
                      <q-item-section>Editar</q-item-section>
                    </q-item>
                    <template v-if="authStore.user.role_perms.find((role) => role == 'cajas.*' || role == 'cajas.abrir')">
                      <q-item clickable @click="handleCrearRecibo( { contrato_id: props.row.id, tipo_actividad: props.row.tipo_actividad, cliente_id: props.row.comprador_id } )" v-close-popup v-if="!EstadosDesactivados.includes(props.row.estatus)">
                        <q-item-section side>
                          <q-icon color="black" name="receipt" />
                        </q-item-section>
                        <q-item-section>Crear recibo</q-item-section>
                      </q-item>
                    </template>
                    <q-item clickable @click="renovarContratoDialog.openDialog(props.row.id)" v-close-popup v-if="props.row.tipo_actividad != 'venta_parcelas' && props.row.tipo_parcela != 'Cremacion' && !EstadosDesactivados.includes(props.row.estatus)">
                      <q-item-section side>
                        <q-icon color="black" name="rotate_right" />
                      </q-item-section>
                      <q-item-section>Renovar</q-item-section>
                    </q-item>
                    <q-item v-if="props.row.tipo_actividad == 'mantenimiento_parcelas' && props.row.tipo_parcela != 'Cremacion'" clickable @click="generarContratoDialog.openDialog(props.row.tipo_parcela, {
                      tipo_actividad: 'venta_parcelas',
                      tipo_parcela: props.row.tipo_parcela,
                      num_contrato: props.row.num_contrato,
                      comprador_id: props.row.cliente?.id,
                      parcelas: props.row.parcelas.map(parcela => parcela.id),
                      ubicaciones: props.row.parcelas,
                      fecha_emision: props.row.fecha_emision,
                      fecha_vencimiento: props.row.fecha_emision,
                      etiqueta: props.row.etiqueta,
                      notas: props.row.notas,
                    })" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="add" />
                      </q-item-section>
                      <q-item-section>Contrato de venta</q-item-section>
                    </q-item>
                    <q-item v-if="props.row.tipo_actividad == 'venta_parcelas' && !EstadosDesactivados.includes(props.row.estatus)" clickable @click="generarContratoDialog.openDialog(props.row.tipo_parcela, {
                      tipo_actividad: 'mantenimiento_parcelas',
                      tipo_parcela: props.row.tipo_parcela,
                      num_contrato: props.row.num_contrato,
                      comprador_id: props.row.cliente?.id,
                      parcelas: props.row.parcelas.map(parcela => parcela.id),
                      ubicaciones: props.row.parcelas,
                      etiqueta: props.row.etiqueta,
                    })" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="add" />
                      </q-item-section>
                      <q-item-section>Contrato de mant.</q-item-section>
                    </q-item>
                    <q-item :clickable="props.row.esta_vigente || !props.row.fecha_vencimiento" @click="handleDownloadPdf(props.row.id)" v-close-popup :disable="!props.row.esta_vigente && !!props.row.fecha_vencimiento" v-if="!EstadosDesactivados.includes(props.row.estatus)">
                      <q-item-section side>
                        <q-icon color="black" name="print" />
                      </q-item-section>
                      <q-item-section>Imprimir
                        <q-tooltip v-if="!props.row.esta_vigente && !!props.row.fecha_vencimiento" max-width="200px" class="text-center bg-black">El contrato debe estar vigente para poder imprimir.</q-tooltip>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="props.row.tipo_actividad == 'mantenimiento_parcelas' && props.row.tipo_parcela != 'Cremacion'" clickable @click="openDialogCalcularDeuda(props.row.id)" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="attach_money" />
                      </q-item-section>
                      <q-item-section>Calcular deuda</q-item-section>
                    </q-item>
                    <q-item clickable @click="openDialogEliminarContrato(props.row.id)" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="delete" />
                      </q-item-section>
                      <q-item-section>Eliminar</q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </q-td>
            </template>
            <template v-slot:body-cell-estatus="props">
              <q-td :props="props" style="line-height: 1.15;" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
                {{ props.row.estatus }}
                <template v-if="props.row.etiqueta">
                 <br/> <span style="font-size:.75rem">({{ props.row.etiqueta }})</span>
                </template>
              </q-td>
            </template>
            <template v-slot:body-cell-notas="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="font-size:.65rem; max-width: 150px; white-space: normal; line-height: 1.15;">
                <div>{{ props.row.notas }}</div>
                <a class="block q-my-xs" href="javascript:void(0)" @click="(e) => editarNotasDialog.openDialog(props.row.id, 'contratos', props.row.notas, 'Contrato #' + props.row.num_contrato)">
                  <q-badge outline color="primary" :style="props.row.notas && 'font-size: .65rem'">
                    <q-icon :name="props.row.notas ? 'edit' : 'add'" class="q-mr-xs"></q-icon> {{ props.row.notas ? 'Editar nota' : 'Agregar' }}
                  </q-badge>
                </a>
              </q-td>
            </template>
            <template v-slot:body-cell-cliente="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), 'bg-grey-5': !!parseInt(props.row.cliente.difunto), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="max-width: 160px; white-space: normal;">
                <a href="javascript:void(0)" @click="(e) => verClienteDialog.openDialog(props.row.cliente.id, e)" v-if="props.row.cliente?.id">{{ props.value }} <q-badge class="bg-black" v-if="!!parseInt(props.row.cliente.difunto)">(Fallecido)</q-badge></a>
                <span v-else>-</span>
              </q-td>
            </template>
            <template v-slot:body-cell-parcelas="props">
            <q-td :props="props" class="q-gutter-xs" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="max-width: 120px; white-space: normal;">
              <q-btn size="sm" dense color="primary" v-for="parcela in props.row.parcelas"
                @click="editarParcelaDialog.openDialog(parcela.id)">{{ parcela.codigo_parcela }}</q-btn>
            </q-td>
            </template>

            <template v-slot:body-cell-cremaciones="props">
              <q-td :props="props">
                <ul style="padding-left: 0; line-height: 1.15;">
                  <li v-for="cremacion in props.row.cremaciones">
                    <a href="javascript:void(0)" @click="(e) => handleVerCremacionPdf(cremacion.id)">
                      <span class="text-bold text-primary">{{ cremacion.num_cremacion }}</span> -
                      <span class="text-italic">{{ cremacion.difunto_nombre }}</span>
                    </a>
                  </li>
                </ul>
              </q-td>
            </template>

            <template v-slot:body-cell-num_contrato="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="width: 90px;">
                <a href="javascript:void(0)" @click="editarContratoDialog.openDialog(props.row.id)">{{ props.row.codnum_contrato || '-' }}</a>
              </q-td>
            </template>
            <template v-slot:body-cell-fecha_emision="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="width: 90px;">
                {{ props.row[props.col.name] && (new Date(props.row[props.col.name]) != 'Invalid Date') ? format(props.row[props.col.name], 'dd/MM/yyyy') : '-' }}
              </q-td>
            </template>
            <template v-slot:body-cell-fecha_vencimiento="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="width: 90px;">
                {{ props.row[props.col.name] && (new Date(props.row[props.col.name]) != 'Invalid Date') ? format(props.row[props.col.name], 'dd/MM/yyyy') : '-' }}
              </q-td>
            </template>
            <template v-slot:body-cell-vigente_hasta="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="width: 90px;">
                <template v-if="props.row.etiqueta != 'Donado' && props.row.tipo_actividad == 'mantenimiento_parcelas' && props.row.tipo_parcela != 'Cremacion'">
                  <a href="javascript:void(0)" @click="(e) => actualizarFechasDialog.openDialog({
                    contrato_id: props.row.id,
                    rows: props.row.parcelas,
                  })">
                    <template v-if="props.row[props.col.name] && (new Date(props.row[props.col.name]) != 'Invalid Date')">
                      {{ format(props.row[props.col.name], 'dd/MM/yyyy') }}
                    </template>
                    <template v-else-if="props.row.estatus != 'Inactivo'">
                      <q-badge color="primary" dense>
                        <q-icon name="event" size="xs" class="q-mr-xs"/>
                        Agregar
                      </q-badge>
                    </template>
                  </a>
                </template>
                <template v-else>
                  <span class="text-italic text-grey-6">{{ props.row.fecha_vencimiento && new Date(props.row.fecha_vencimiento) != 'Invalid Date' ? format(props.row.fecha_vencimiento, 'dd/MM/yyyy') : '-' }}</span>
                </template>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </template>
      <template v-else>
        <p class="text-center">No se encontraron contratos.</p>
      </template>

    </q-card>



  </q-dialog>

  <DialogEditarContrato ref="editarContratoDialog" @updated="getData()"></DialogEditarContrato>
  <DialogRenovarContrato ref="renovarContratoDialog" @updated="getData()" @done="getData()"></DialogRenovarContrato>
  <DialogEditarParcela ref="editarParcelaDialog" @updated="getData()"></DialogEditarParcela>
  <DialogGenerarContrato ref="generarContratoDialog" @updated="getData()" @created="getData()"></DialogGenerarContrato>
  <DialogAgregarCliente ref="verClienteDialog" @updated="getData()"/>
  <DialogActualizarFechas ref="actualizarFechasDialog" @updated="getData()"/>

  <q-dialog allow-focus-outside v-model="eliminarContratoDialog" class="j-dialog">
    <q-card class="q-pa-md text-center">
      <q-card-section>
        <div class="text-h6">Eliminar contrato</div>
      </q-card-section>
      <q-card-section class="q-py-none">
        <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
      </q-card-section>
      <q-card-section>
        ¿Estás seguro de que quieres eliminar este contrato? Esta acción no se puede deshacer.
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn label="Eliminar" color="negative" @click="handleEliminarContrato(eliminarContratoId)"
          :loading="isLoadingEliminarContrato" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog allow-focus-outside v-model="calcularDeudaContratoDialog" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md text-center">
      <q-card-section class="q-pa-none">



        <q-markup-table flat separator="none" dense>
          <tbody class="text-left">
            <tr>
              <td class="text-bold" width="20%">CONTRATO</td>
              <td width="20%">{{ calcularDeudaContrato.num_contrato }}</td>
              <td class="text-bold text-italic text-right">{{ format(new Date().toISOString().slice(0, 10), "d 'de' MMMM 'de' yyyy", { locale: es }) }}</td>
            </tr>
            <tr>
              <td class="text-bold" width="20%">TITULAR</td>
              <td width="20%">{{ calcularDeudaContrato.cliente?.nombre_completo }}</td>
              <td></td>
            </tr>
            <tr>
              <td class="text-bold" width="20%">CÉDULA</td>
              <td width="20%">{{ calcularDeudaContrato.cliente?.num_identidad }}</td>
              <td></td>
            </tr>
            <tr>
              <td class="text-bold" width="20%">{{ calcularDeudaContrato?.tipo_parcela?.toUpperCase() }}</td>
              <td width="20%">
                <q-checkbox v-model="parcela.selected" dense size="sm" color="primary" class="q-mr-xs" v-for="parcela in calcularDeudaContrato.parcelas" :label="parcela.codigo_parcela" @update:model-value="recalcularDeudaContrato()"></q-checkbox>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        <q-markup-table class="q-mt-md deuda-table" flat separator="none" dense>
          <tbody class="text-left">
            <tr>
              <td class="text-bold" colspan="5">MANTENIMIENTO</td>
            </tr>
            <tr v-for="(fecha, fechaIndex) in calcularDeudaContrato.fechas" :key="fecha.desde">
              <td class="text-bold" width="10%">DESDE: </td>
              <td width="20%">{{ format(fecha.desde, 'dd/MM/yyyy') }}</td>
              <td class="text-bold" width="10%">HASTA: </td>
              <td width="20%">{{ format(fecha.hasta, 'dd/MM/yyyy') }}</td>
              <td>
                <q-input square type="number" size="sm" step="0.01" dense stack-label outlined v-model="fecha.precio" @update:model-value="handleUpdatePrecio(fecha.precio, fechaIndex)" />
              </td>
            </tr>
            <tr>
              <td class="text-bold text-right" colspan="4"> <q-checkbox v-model="calcularDeudaContrato.mora" /> TOTAL MORA:</td>
              <td>
                <q-input square type="number" size="sm" step="0.01" dense stack-label outlined v-model="calcularDeudaContrato.total_mora" :disable="!calcularDeudaContrato.mora" :class="!calcularDeudaContrato.mora && 'bg-grey-3'"/>
              </td>
            </tr>
            <tr>
              <td class="text-bold text-right" colspan="4">TOTAL DEUDA:</td>
              <td class="text-bold text-right" style="font-size: 1.5rem">${{ ( calcularDeudaContrato?.fechas?.reduce((acum, fecha) => acum + parseFloat(fecha.precio), 0) + (calcularDeudaContrato.mora ? parseFloat(calcularDeudaContrato.total_mora) : 0) ).toFixed(2) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>

      <template v-if="calcularDeudaContratoSelectedParcelas?.every(parcela => parcela.pagado_hasta === calcularDeudaContratoSelectedParcelas[0].pagado_hasta)">
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Imprimir" icon="print" color="primary" @click="handlePrintCalcularDeuda()"
            :loading="isLoadingCalcularDeuda" />
        </q-card-actions>
      </template>

      <template v-else>
        <q-banner class="bg-red-3 q-pb-md">
          <template v-slot:avatar>
            <q-icon class="q-mt-sm" name="warning" color="black" />
          </template>
          <div class="text-h6">Las fechas de pago no coinciden.</div>
        </q-banner>
      </template>

    </q-card>
  </q-dialog>

  <DialogEditarNotas ref="editarNotasDialog" @updated="getData()"/>

</template>

<style>
  .deuda-table .q-field--dense .q-field__control {
    height: 30px;
  }
</style>

<script setup>

import { api } from 'src/boot/axios';
import { ref, computed } from 'vue';
import { useQuasar, scroll } from 'quasar';
import { qNotify } from 'src/boot/jardines';
import es from 'date-fns/locale/es';
import { format, differenceInMonths } from 'date-fns';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth.store';

import DialogEditarContrato from "src/components/popups/DialogEditarContrato.vue";
import DialogRenovarContrato from "src/components/popups/DialogRenovarContrato.vue";
import DialogGenerarContrato from "src/components/popups/DialogGenerarContrato.vue";
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";
import DialogActualizarFechas from "src/components/popups/DialogActualizarFechas.vue";
import DialogEditarNotas from "src/components/popups/DialogEditarNotas.vue";

import { useAppStore } from "src/stores/app.store";

const $q = useQuasar()
const dialog = ref(false)
const isLoading = ref(false)

const appStore = useAppStore();
const authStore = useAuthStore()

const contratos = ref([])
const router = useRouter()

const editarContratoDialog = ref(null)
const renovarContratoDialog = ref(null)
const generarContratoDialog = ref(null)
const verClienteDialog = ref(null)
const editarNotasDialog = ref(null)
const editarParcelaDialog = ref(null)
const actualizarFechasDialog = ref(null)

const handleUpdatePrecio = (precio, i) => {
  for (let index = i; index < calcularDeudaContrato.value.fechas.length; index++) {
    calcularDeudaContrato.value.fechas[index].precio = precio
  }
}

const EstadosDesactivados = ['Inactivo', 'Expirado']

const columnasVisibles = ref([])
const columnas = [
  { name: 'actions', label: '', field: 'actions' },
  { name: 'num_contrato', label: 'Núm. ctto.', align: 'left', field: 'codnum_contrato', sortable: true },
  { name: 'fecha_emision', label: 'Fecha emisión', align: 'left', field: 'fecha_emision', sortable: false },
  { name: 'fecha_vencimiento', label: 'Fecha venc.', align: 'left', field: 'fecha_vencimiento', sortable: false },
  { name: 'vigente_hasta', label: 'Pagado hasta', align: 'left', field: 'vigente_hasta', sortable: false },
  { name: 'estatus', label: 'Estatus', align: 'center', field: 'estatus', sortable: true, headerStyle: 'width: 90px;' },
  { name: 'cliente', label: 'Cliente', align: 'left', field: 'cliente', sortable: false, format: (val) => `${val.nombre_completo} (${val.num_identidad})` },
  { name: 'parcelas', label: 'Ubicaciones', align: 'left', field: 'parcelas', sortable: false },
  { name: 'cremaciones', label: 'Cremaciones', align: 'left', field: 'cremaciones', sortable: false },
  { name: 'notas', label: 'Notas', align: 'left', field: 'notas', sortable: false },
]

const handleEditarContrato = (data) => {
  getData();
  emit('updated', data)
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

const handleCrearRecibo = (data) => {

  console.log(data);

  if (data.contrato_id && data.tipo_actividad) {

    api.get('caja/cajas')
      .then(response => {
        if (response.data) {
          let caja = response.data.find(c => c.tipo_actividad == data.tipo_actividad)

          if (!caja) {
            qNotify('No se pudo encontrar la caja asociada al contrato.', 'error')
            return
          }

          if (!caja.esta_abierta) {
            qNotify(`La caja "${caja.nombre_caja}" está cerrada.`, 'error')
            return
          }

          appStore.seleccionarCaja(caja)
          router.push({ path: '/caja/recibos/nuevo', query: { contrato_id: data.contrato_id, cliente_id: data.cliente_id } })
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleCrearRecibo(data) }))



  }
}

// Eliminar contrato
const eliminarContratoDialog = ref(null)
const eliminarContratoId = ref(null)
const isLoadingEliminarContrato = ref(false)

const openDialogEliminarContrato = (contratoId) => {
  eliminarContratoId.value = contratoId
  eliminarContratoDialog.value = true
}

const calcularDeudaContratoDialog = ref(null)
const calcularDeudaContratoId = ref(null)
const calcularDeudaPrecioMantenimiento = ref(0)
const calcularDeudaContrato = ref({})
const calcularDeudaContratoSelectedParcelas = computed(() => calcularDeudaContrato.value?.parcelas?.filter(parcela => parcela.selected))

const recalcularDeudaContrato = () => {

  let vigenteHasta = calcularDeudaContratoSelectedParcelas.value[0]?.pagado_hasta

  let fechaInicio = new Date(vigenteHasta) != 'Invalid Date' ? new Date(vigenteHasta) : new Date(calcularDeudaContrato.value.fecha_vencimiento)
  let diaFechaCorte = new Date(calcularDeudaContrato.value.fecha_emision).getDate()
  let mesFechaCorte = new Date(calcularDeudaContrato.value.fecha_emision).getMonth()

  let anioHasta = fechaInicio.getMonth() >= mesFechaCorte ? fechaInicio.getFullYear() + 1 : fechaInicio.getFullYear()

  let fechaDesde = null;
  let fechaHasta = null;
  let isLast = false;

  calcularDeudaContrato.value.fechas = []

  for (let index = 0; index < 30; index++) {
    if (fechaDesde == null) {
      fechaDesde = fechaInicio
      fechaHasta = new Date(anioHasta, mesFechaCorte, diaFechaCorte)
    } else {
      let anioDesde = fechaDesde.getFullYear() == fechaHasta.getFullYear() ? fechaDesde.getFullYear() : fechaDesde.getFullYear() + 1
      fechaDesde = new Date(anioDesde, mesFechaCorte, diaFechaCorte)
      fechaHasta = new Date(fechaHasta.getFullYear() + 1, mesFechaCorte, diaFechaCorte)
    }

    calcularDeudaContrato.value.fechas.push({
      desde: fechaDesde,
      hasta: fechaHasta,
      precio: 0
    })

    isLast = fechaHasta.getTime() > new Date().getTime();

    if (isLast) break;
  }

  calcularDeudaContrato.value.mora = calcularDeudaContrato.value.fechas.length >= 4 ? true : false
  calcularDeudaContrato.value.total_mora = 100

  let precioTotal = (calcularDeudaContratoSelectedParcelas.value?.length || 0) * calcularDeudaPrecioMantenimiento.value

  calcularDeudaContrato.value.fechas.forEach(fecha => {
    let diff = differenceInMonths(fecha.hasta, fecha.desde)
    fecha.precio = precioTotal / 12 * diff
  });

}

const openDialogCalcularDeuda = (contratoId) => {
  calcularDeudaContratoId.value = contratoId
  calcularDeudaContratoDialog.value = true

  api.get('contratos/' + contratoId)
    .then(response => {
      if (response.data) {
        calcularDeudaContrato.value = response.data

        calcularDeudaContrato.value.parcelas.forEach(parcela => parcela.selected = true)

        api.get('servicios')
          .then(response => {
            if (response.data) {
              let servicios = response.data.filter(s => s.tipo_producto == 'Mantenimiento' && s.tipo_ubicacion == calcularDeudaContrato.value.tipo_parcela)
              let precioMantenimiento = servicios.length ? parseFloat(servicios[0].precio_ref) : 0
              calcularDeudaPrecioMantenimiento.value = precioMantenimiento
              recalcularDeudaContrato()
            }
          })

      }
    })
    .catch(error => qNotify(error, 'error', { callback: () => openDialogCalcularDeuda(contratoId) }))
}

const handlePrintCalcularDeuda = () => {
  let postData = {
    data: {
      num_contrato: calcularDeudaContrato.value.num_contrato,
      nombre_completo: calcularDeudaContrato.value.cliente?.nombre_completo,
      num_identidad: calcularDeudaContrato.value.cliente?.num_identidad,
      ubicaciones: calcularDeudaContratoSelectedParcelas.value.map(parcela => parcela.codigo_parcela).join(', '),
      tipo_parcela: calcularDeudaContrato.value.tipo_parcela,
    },
    fechas: calcularDeudaContrato.value.fechas.map(fecha => {
      return {
        desde: format(fecha.desde, 'dd/MM/yyyy'),
        hasta: format(fecha.hasta, 'dd/MM/yyyy'),
        precio: parseFloat(fecha.precio),
      }
    }),
  }

  if (calcularDeudaContrato.value.mora) {
    postData.mora = calcularDeudaContrato.value.total_mora
  }

  console.log(postData)


  api.post('contratos/imprimirDeuda', postData, { responseType: "blob" })
  .then((response) => {
    console.log(response);
    window.open(URL.createObjectURL(response.data));
  })
  .catch(async (error) => {
    error.response.data = JSON.parse(await error.response.data.text());
    qNotify(error, "error", {
      callback: () => handlePrintCalcularDeuda(),
    });
  });

}

const handleEliminarContrato = (id) => {
  isLoadingEliminarContrato.value = true
  api.delete('contratos/' + id)
    .then(response => {
      console.log(response);
      if (response.data) {
        eliminarContratoDialog.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        getData();
        emit('updated', response.data)
      }
    })
    .catch(error => qNotify(error, 'error', { callback: () => handleEliminarContrato(id) }))
    .finally(() => isLoadingEliminarContrato.value = false)
}

const tablePagination = ref({ rowsPerPage: 0, sortBy: 'estatus', descending: false })

const defaultParams = ref({})

const openDialog = (numContrato, tipoContrato) => {
  defaultParams.value = {
    num_contrato: numContrato,
    tipo_contrato: tipoContrato
  }

  if (tipoContrato == 'Cremacion') {
    columnasVisibles.value = ['actions', 'num_contrato', 'fecha_emision', 'fecha_vencimiento', 'estatus', 'cliente', 'cremaciones', 'notas']
  } else {
    columnasVisibles.value = ['actions', 'num_contrato', 'fecha_emision', 'fecha_vencimiento', 'vigente_hasta', 'estatus', 'cliente', 'parcelas', 'notas']
  }

  getData();
}

const getData = () => {
  isLoading.value = true

  api.get('numcontratos/' + defaultParams.value.num_contrato + '/' + defaultParams.value.tipo_contrato)
    .then(response => {
      if (response.data) {
        contratos.value = response.data
      }
    })
    .finally(() => isLoading.value = false)

  dialog.value = true
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

defineExpose({ openDialog })
const emit = defineEmits(['updated'])

</script>
