<template>
  <q-dialog v-model="dialogInfoCliente" class="j-dialog j-dialog-xl dialog-info-cliente">
    <q-card class="q-pa-md">
      <div class="q-py-lg text-center" v-if="isLoadingInfoCliente">
        <q-spinner size="xl" color="primary" />
      </div>
      <template v-else>
        <q-card-section>
          <div class="text-h6">{{ infoCliente?.nombre_completo }}</div>
          <div class="text-subtitle2">{{ infoCliente?.num_identidad }}</div>
        </q-card-section>
        <q-card-section class="section-info">
          <div class="text-h6 text-center q-mb-sm">Información del cliente</div>
          <div class="row">
            <div class="col-6 col-md">
              <div class="text-subtitle2">Nombres</div>
              <p>{{ infoCliente?.nombre || '-' }}</p>
            </div>
            <div class="col-6 col-md">
              <div class="text-subtitle2">Apellidos</div>
              <p>{{ infoCliente?.apellido || '-' }}</p>
            </div>
            <div class="col-6 col-md">
              <div class="text-subtitle2">Doc. Identidad</div>
              <p>{{ infoCliente?.num_identidad || '-' }}</p>
            </div>
            <div class="col-6 col-md">
              <div class="text-subtitle2">Teléfono principal</div>
              <p>{{ infoCliente?.telefono_principal || '-' }}</p>
            </div>
            <div class="col-6 col-md">
              <div class="text-subtitle2">Teléfono secundario</div>
              <p>{{ infoCliente?.telefono_secundario || '-' }}</p>
            </div>
            <div class="col-6 col-md">
              <div class="text-subtitle2">Correo electrónico</div>
              <p>{{ infoCliente?.email || '-' }}</p>
            </div>
          </div>
          <div class="row">
            <div class="col-12 col-md-6">
              <div class="text-subtitle2">Dirección de habitación</div>
              <p>{{ infoCliente?.direccion_habitacion || '-' }}</p>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-subtitle2">Dirección de trabajo</div>
              <p>{{ infoCliente?.direccion_trabajo || '-' }}</p>
            </div>
          </div>
          <div class="row">
            <div class="col-6 col-md">
              <div class="text-subtitle2">Fecha de nacimiento</div>
              <p>{{ infoCliente?.fecha_nacimiento && infoCliente.fecha_nacimiento.slice(0, 16).replaceAll('-', '/') ||
                '-' }}</p>
            </div>
            <div class="col-6 col-md">
              <div class="text-subtitle2">Estado civil</div>
              <p>{{ infoCliente?.estado_civil || '-' }}</p>
            </div>
            <div class="col-6 col-md">
              <div class="text-subtitle2">Fecha de creación</div>
              <p>{{ infoCliente?.created_at.date.slice(0, 19).replaceAll('-', '/') || '-' }}</p>
            </div>
          </div>
          <div class="row">
            <div class="col-4 col-md">
              <div class="text-subtitle2"># Carnet</div>
              <p>{{ infoCliente?.num_carnet || '-' }}</p>
            </div>
            <div class="col-4 col-md">
              <div class="text-subtitle2"># Historia</div>
              <p>{{ infoCliente?.num_historia || '-' }}</p>
            </div>
            <div class="col-4 col-md">
              <div class="text-subtitle2"># Afiliación</div>
              <p>{{ infoCliente?.num_afiliacion || '-' }}</p>
            </div>
          </div>
          <div class="row">
            <div class="col-12">
              <div class="text-subtitle2">Notas</div>
              <p>{{ infoCliente?.notas || '-' }}</p>
            </div>
          </div>
        </q-card-section>
        <q-card-section class="section-info">
          <div class="row no-borders">
            <div class="col-12 col-md-6">
              <div class="text-h6">
                Contratos asociados
              </div>
              <div class="q-gutter-sm" v-if="infoCliente?.contratos.length">
                <q-badge v-for="contrato in infoCliente.contratos">{{ contrato.codnum_contrato }}</q-badge>
              </div>
              <div v-else>No hay contratos asociados a este cliente.</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-h6">
                Parcelas asociadas
              </div>
              <div class="q-gutter-sm" v-if="infoCliente?.parcelas.length">
                <q-badge v-for="parcela in infoCliente.parcelas">{{ parcela.codigo_parcela }}</q-badge>
              </div>
              <div v-else>No hay parcelas asociadas a este cliente.</div>
            </div>
          </div>
        </q-card-section>
      </template>
    </q-card>
  </q-dialog>
  <div class="row full-width">

    <div class="col-12">

      <div class="flex justify-between q-mb-md">

        <q-btn-toggle v-model="tipoCliente" toggle-color="primary" :options="[
          { label: 'Clientes', value: 'clientes' },
          { label: 'Fallecidos', value: 'fallecidos' },
          { label: 'Ver todos', value: 'todos' }
        ]" />

        <q-btn label="Agregar" icon="add" color="primary" @click="agregarClienteDialog.openDialog()" />
      </div>


      <q-table :rows="clientes" :columns="clientesColumnas" row-key="name" :class="!$q.screen.lt.md && 'text-wrap'"
        ref="clientesTableRef" v-model:pagination="clientesTablePagination" :loading="clientesTableLoading"
        :filter="clientesTableFilter" @request="clientesTableRequest">
        <template v-slot:top-right>
          <q-input dense debounce="300" v-model="clientesTableFilter" placeholder="Buscar...">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
        <template v-slot:body-cell-etiqueta="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-badge v-if="props.row.estado_cuenta" class="q-py-xs text-weight-bold bg-red">
              {{ props.row.estado_cuenta }}
            </q-badge>
            <q-badge v-if="props.row.estado_cliente" class="q-py-xs text-weight-bold bg-red">
              {{ props.row.estado_cliente }}
            </q-badge>
            <q-badge v-if="props.row.etiqueta_texto" class="q-py-xs text-weight-bold" :style="`border: 1px solid ${props.row.etiqueta_color || '#000'}; color: ${props.row.etiqueta_color || '#000'}; background: none`">
              {{ props.row.etiqueta_texto }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" style="width: 120px;" class="q-gutter-xs">
            <q-btn outline icon="edit" size="sm" color="primary" dense
              @click="agregarClienteDialog.openDialog(props.row.id)" />
            <q-btn outline icon="delete" size="sm" color="negative" dense
              @click="openDialogEliminarCliente(props.row.id)" />
          </q-td>
        </template>

        <template v-slot:body-cell-contratos="props">
          <q-td :props="props" class="q-gutter-xs" style="white-space: break-spaces;">
            <q-btn size="sm" dense color="primary" v-for="contrato in props.row.contratos"
              @click="handleDownloadPdf(contrato.id)">
              {{ contrato.codnum_contrato }}
            </q-btn>
          </q-td>
        </template>

        <template v-slot:body-cell-parcelas="props">
          <q-td :props="props" class="q-gutter-xs" style="white-space: break-spaces;">
            <q-btn size="sm" dense color="primary" v-for="parcela in props.row.parcelas"
              @click="router.push('/app/ubicaciones/' + parcela.id)">{{ parcela.codigo_parcela }}</q-btn>
          </q-td>
        </template>

        <template v-slot:body-cell-nombre="props">
          <q-td :props="props" style="white-space: break-spaces; min-width: 240px;">
            <div class="row items-center">
              <div class="col-auto">
                <q-btn outline icon="visibility" size="sm" color="blue" dense @click="openDialogInfoCliente(props.row.id)"
                  class="q-mr-sm" />
              </div>
              <div class="col">
                {{ props.value || '-' }}
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-created_at="props">
          <q-td :props="props">
            {{ format(props.row.created_at.date, 'dd/MM/yyyy') }}
          </q-td>
        </template>


        <template v-slot:body-cell="props">
          <q-td :props="props">
            {{ props.value || '-' }}
          </q-td>
        </template>
      </q-table>

      <!-- AGREGAR CLIENTE -->
      <DialogAgregarCliente ref="agregarClienteDialog" @created="handleClienteAgregado" @updated="handleClienteEditado" />

      <!-- Eliminar cliente -->
      <q-dialog v-model="dialogEliminarCliente" class="j-dialog">
        <q-card class="q-pa-md text-center">
          <q-card-section>
            <div class="text-h6">Eliminar cliente</div>
          </q-card-section>
          <q-card-section class="q-py-none">
            <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
          </q-card-section>
          <q-card-section>
            ¿Estás seguro de que quieres eliminar a "<span class="text-weight-bold">{{ selectedCliente.nombre_completo
            }}</span>"? Esta acción no se puede deshacer.
          </q-card-section>
          <q-card-actions class="justify-end">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn label="Eliminar" color="negative" @click="handleEliminarCliente(selectedCliente.id)"
              :loading="isLoadingEliminarCliente" />
          </q-card-actions>
        </q-card>
      </q-dialog>


    </div>
  </div>
</template>

<style lang="scss">
table.info-table {
  width: 100%;

  th {
    text-align: left;
  }

  td {
    text-align: right;
  }
}
</style>

<script setup>

import { ref, reactive, watch, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { qNotify } from 'src/boot/jardines';
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import { format } from 'date-fns';

const router = useRouter()
const $q = useQuasar()

const dialogInfoCliente = ref(false)
const infoCliente = ref(null)
const isLoadingInfoCliente = ref(true)

const stats = ref({});

const openDialogInfoCliente = (id) => {
  isLoadingInfoCliente.value = true
  api.get('clientes/' + id + '?with[]=data')
    .then(response => {
      if (response.data) {
        infoCliente.value = response.data
      }
    })
    .finally(() => isLoadingInfoCliente.value = false)
  dialogInfoCliente.value = true
}

/**
 * CLIENTES
 */

const isLoadingClientes = ref(true)

const clientesColumnas = [
  { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre_completo', sortable: true },
  { name: 'created_at', label: 'Fecha creado', align: 'left', field: 'created_at', sortable: true },
  { name: 'doc_numero', label: 'Doc. identidad', align: 'left', field: 'num_identidad', sortable: true },
  { name: 'contratos', align: 'left', label: 'Contratos', field: 'contratos', sortable: true },
  { name: 'parcelas', align: 'left', label: 'Parcelas', field: 'parcelas', sortable: true },
  { name: 'etiqueta', label: 'Etiqueta', align: 'left', field: 'etiqueta', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const clientes = ref([])
const agregarClienteDialog = ref(null)
const handleClienteAgregado = (data) => {
  //clientes.value.push(data)
  clientesTableRef.value.requestServerInteraction()
}

const handleClienteEditado = (data) => {
  /*const index = clientes.value.findIndex(cliente => cliente.id == data.id)
  if (index > -1) {
    clientes.value[index] = data;
  }*/
  clientesTableRef.value.requestServerInteraction()
}

// Eliminar cliente
const selectedCliente = ref(null)
const dialogEliminarCliente = ref(false)
const isLoadingEliminarCliente = ref(false)

const openDialogEliminarCliente = (id) => {
  selectedCliente.value = clientes.value.find(row => row.id == id)
  dialogEliminarCliente.value = true
}

const handleEliminarCliente = (id) => {
  isLoadingEliminarCliente.value = true
  api.delete('clientes/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminarCliente.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        clientes.value = clientes.value.filter(cliente => cliente.id !== id)
      }
    })
    .catch(error => qNotify(error, 'error', { callback: () => handleEliminarCliente(id) }))
    .finally(() => isLoadingEliminarCliente.value = false)
}

const tipoCliente = ref('clientes');

/**
 * PAGINATION
 */
const clientesTableRef = ref(null)
const clientesTableLoading = ref(true)
const clientesTableFilter = ref(router.currentRoute.value.query.search || '');
const clientesTablePagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'created_at',
  descending: true,
})

watch(tipoCliente, () => {
  clientesTableRef.value.requestServerInteraction()
})

const clientesTableRequest = (props) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  clientesTableLoading.value = true;

  let endpoint = 'clientes';

  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(props.pagination).filter(([k, v]) => v != null && k != 'descending'))
  );

  searchParams.append('with[]', 'data');

  if (clientesTableFilter.value) {
    searchParams.append('s', clientesTableFilter.value)
    router.replace({ query: { search: clientesTableFilter.value } })
  }

  if (sortBy) {
    searchParams.append('order', descending ? 'DESC' : 'ASC')
  }

  if (tipoCliente.value == 'clientes') {
    searchParams.append('f[difunto]', '0')
  } else if (tipoCliente.value == 'fallecidos') {
    searchParams.append('f[difunto]', '1')
  }

  if (searchParams) {
    endpoint += '?' + searchParams.toString();
  }

  console.log(endpoint);

  api.get(endpoint)
    .then(response => {
      if (response.data) {
        console.log(response.data);
        clientes.value = response.data.data
        clientesTablePagination.value.page = response.data.pager.currentPage
        clientesTablePagination.value.rowsPerPage = response.data.pager.perPage
        clientesTablePagination.value.rowsNumber = response.data.pager.total
        clientesTablePagination.value.sortBy = response.data.sortBy || null
        clientesTablePagination.value.descending = response.data.order == 'DESC'
      }
    })
    .catch(e => console.log(e))
    .finally(() => clientesTableLoading.value = false)
}
/**
 * END OF PAGINATION
 */

const handleDownloadPdf = (contratoId) => {
  api.get('contratos/' + contratoId + '/pdf', { responseType: 'blob' })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async error => {
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, 'error', { callback: () => handleDownloadPdf(contratoId) });
    })
}

onMounted(() => {
  clientesTableRef.value.requestServerInteraction()

  api.get('pages/clientes')
    .then(response => {
      if (response.data) {
        stats.value = response.data
      }
    })

  /*api.get('clientes')
    .then(response => {
      if (response.data) clientes.value = response.data;
    })
    .catch(e => console.log(e))
    .finally(() => isLoadingClientes.value = false)*/
})
</script>
