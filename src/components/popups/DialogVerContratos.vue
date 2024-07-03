<template>
  <q-dialog v-model="dialog" class="j-dialog j-dialog-xl">

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
          <q-table flat :rows="contratos" :columns="columnas" v-model:pagination="tablePagination" hide-bottom row-key="name">
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" class="q-gutter-xs">

                <q-btn-dropdown dense size="sm" color="primary" flat icon="more_horiz">
                  <q-list>
                    <q-item clickable @click="editarContratoDialog.openDialog(props.row.id)" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="edit" />
                      </q-item-section>
                      <q-item-section>Editar</q-item-section>
                    </q-item>
                    <q-item clickable @click="renovarContratoDialog.openDialog(props.row.id)" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="rotate_right" />
                      </q-item-section>
                      <q-item-section>Renovar</q-item-section>
                    </q-item>
                    <q-item v-if="props.row.tipo_actividad == 'venta_parcelas'" clickable @click="generarContratoDialog.openDialog(props.row.tipo_parcela, {
                      tipo_actividad: 'mantenimiento_parcelas',
                      tipo_parcela: props.row.tipo_parcela,
                      num_contrato: props.row.num_contrato,
                      comprador_id: props.row.cliente?.id,
                      parcelas: props.row.parcelas.map(parcela => parcela.id),
                      ubicaciones: props.row.parcelas
                    })" v-close-popup>
                      <q-item-section side>
                        <q-icon color="black" name="add" />
                      </q-item-section>
                      <q-item-section>Contrato de mant.</q-item-section>
                    </q-item>
                    <q-item :clickable="props.row.esta_vigente" @click="handleDownloadPdf(props.row.id)" v-close-popup :disable="!props.row.esta_vigente">
                      <q-item-section side>
                        <q-icon color="black" name="print" />
                      </q-item-section>
                      <q-item-section>Imprimir
                        <q-tooltip v-if="!props.row.esta_vigente" max-width="200px" class="text-center bg-black">El contrato debe estar vigente para poder imprimir.</q-tooltip>
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
            <template v-slot:body-cell-cliente="props">
              <q-td :props="props">
                <a href="javascript:void(0)" @click="(e) => verClienteDialog.openDialog(props.row.cliente.id, e)" v-if="props.row.cliente?.id">{{ props.value }}</a>
                <span v-else>-</span>
              </q-td>
            </template>
            <template v-slot:body-cell-parcelas="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn size="sm" dense color="primary" v-for="parcela in props.row.parcelas"
                @click="editarParcelaDialog.openDialog(parcela.id)">{{ parcela.codigo_parcela }}</q-btn>
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

  <DialogEditarContrato ref="editarContratoDialog" @updated="handleEditarContrato"></DialogEditarContrato>
  <DialogRenovarContrato ref="renovarContratoDialog" @done="handleEditarContrato"></DialogRenovarContrato>
  <DialogEditarParcela ref="editarParcelaDialog" @done="handleEditarParcela" @updated="handleEditarParcela"></DialogEditarParcela>
  <DialogGenerarContrato ref="generarContratoDialog" @created="handleEditarContrato"></DialogGenerarContrato>
  <DialogEditarParcela ref="editarParcelaDialog" @done="handleEditarParcela"></DialogEditarParcela>
  <DialogAgregarCliente ref="verClienteDialog" />

  <q-dialog v-model="eliminarContratoDialog" class="j-dialog">
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

import DialogEditarContrato from "src/components/popups/DialogEditarContrato.vue";
import DialogRenovarContrato from "src/components/popups/DialogRenovarContrato.vue";
import DialogGenerarContrato from "src/components/popups/DialogGenerarContrato.vue";
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";

const $q = useQuasar()
const dialog = ref(false)
const isLoading = ref(false)

const contratos = ref([])

const editarContratoDialog = ref(null)
const renovarContratoDialog = ref(null)
const generarContratoDialog = ref(null)
const verClienteDialog = ref(null);
const editarParcelaDialog = ref(null)

const columnas = [
  { name: 'num_contrato', label: 'Núm. contrato', align: 'left', field: 'codnum_contrato', sortable: true },
  { name: 'fecha_emision', label: 'Fecha emisión', align: 'left', field: 'fecha_emision', sortable: false, format: (val) => val ? format(val, 'dd/MM/yyyy') : '-' },
  { name: 'fecha_vencimiento', label: 'Fecha vencimiento', align: 'left', field: 'fecha_vencimiento', sortable: false, format: (val) => val ? format(val, 'dd/MM/yyyy') : '-' },
  { name: 'vigente_hasta', label: 'Pagado hasta', align: 'left', field: 'vigente_hasta', sortable: false, format: (val) => val ? format(val, 'dd/MM/yyyy') : '-' },
  { name: 'estatus', label: 'Estatus', align: 'left', field: 'estatus', sortable: true },
  { name: 'cliente', label: 'Cliente', align: 'left', field: 'cliente', sortable: false, format: (val) => `${val.nombre_completo} (${val.num_identidad})` },
  { name: 'parcelas', label: 'Ubicaciones', align: 'left', field: 'parcelas', sortable: false },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const handleEditarContrato = (data) => {
  getData();
  emit('updated', data)
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

const tablePagination = ref({ rowsPerPage: 0 })

const defaultParams = ref({})

const openDialog = (numContrato, tipoContrato) => {
  defaultParams.value = {
    num_contrato: numContrato,
    tipo_contrato: tipoContrato
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
