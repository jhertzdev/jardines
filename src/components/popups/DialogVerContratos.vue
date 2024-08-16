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
                    <q-item clickable @click="handleCrearRecibo( { contrato_id: props.row.id, tipo_actividad: props.row.tipo_actividad, cliente_id: props.row.comprador_id } )" v-close-popup v-if="!EstadosDesactivados.includes(props.row.estatus)">
                      <q-item-section side>
                        <q-icon color="black" name="receipt" />
                      </q-item-section>
                      <q-item-section>Crear recibo</q-item-section>
                    </q-item>
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
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}" style="font-size:.65rem; max-width: 150px; white-space: normal;">
                {{ props.row.notas }}
              </q-td>
            </template>
            <template v-slot:body-cell-cliente="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
                <a href="javascript:void(0)" @click="(e) => verClienteDialog.openDialog(props.row.cliente.id, e)" v-if="props.row.cliente?.id">{{ props.value }}</a>
                <span v-else>-</span>
              </q-td>
            </template>
            <template v-slot:body-cell-parcelas="props">
            <q-td :props="props" class="q-gutter-xs" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
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
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
                <a href="javascript:void(0)" @click="editarContratoDialog.openDialog(props.row.id)">{{ props.row.codnum_contrato || '-' }}</a>
              </q-td>
            </template>
            <template v-slot:body-cell-fecha_emision="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
                {{ props.row[props.col.name] && (new Date(props.row[props.col.name]) != 'Invalid Date') ? format(props.row[props.col.name], 'dd/MM/yyyy') : '-' }}
              </q-td>
            </template>
            <template v-slot:body-cell-fecha_vencimiento="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
                {{ props.row[props.col.name] && (new Date(props.row[props.col.name]) != 'Invalid Date') ? format(props.row[props.col.name], 'dd/MM/yyyy') : '-' }}
              </q-td>
            </template>
            <template v-slot:body-cell-vigente_hasta="props">
              <q-td :props="props" :class="{'highlighted': EstadosDesactivados.includes(props.row.estatus), ['label-' + props.row.etiqueta]: !!props.row.etiqueta}">
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

</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted } from 'vue';
import { useQuasar, scroll } from 'quasar';
import { qNotify } from 'src/boot/jardines';
import { format } from 'date-fns';
import { useRouter } from 'vue-router';

import DialogEditarContrato from "src/components/popups/DialogEditarContrato.vue";
import DialogRenovarContrato from "src/components/popups/DialogRenovarContrato.vue";
import DialogGenerarContrato from "src/components/popups/DialogGenerarContrato.vue";
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";
import DialogActualizarFechas from "src/components/popups/DialogActualizarFechas.vue";

import { useAppStore } from "src/stores/app.store";

const $q = useQuasar()
const dialog = ref(false)
const isLoading = ref(false)

const appStore = useAppStore();

const contratos = ref([])
const router = useRouter()

const editarContratoDialog = ref(null)
const renovarContratoDialog = ref(null)
const generarContratoDialog = ref(null)
const verClienteDialog = ref(null)
const editarParcelaDialog = ref(null)
const actualizarFechasDialog = ref(null)

const EstadosDesactivados = ['Inactivo', 'Expirado']

const columnasVisibles = ref([])
const columnas = [
  { name: 'actions', label: '', field: 'actions' },
  { name: 'num_contrato', label: 'Núm. contrato', align: 'left', field: 'codnum_contrato', sortable: true },
  { name: 'fecha_emision', label: 'Fecha emisión', align: 'left', field: 'fecha_emision', sortable: false },
  { name: 'fecha_vencimiento', label: 'Fecha vencimiento', align: 'left', field: 'fecha_vencimiento', sortable: false },
  { name: 'vigente_hasta', label: 'Pagado hasta', align: 'left', field: 'vigente_hasta', sortable: false },
  { name: 'estatus', label: 'Estatus', align: 'center', field: 'estatus', sortable: true },
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
