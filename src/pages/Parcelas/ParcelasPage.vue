<template>
  <div class="row full-width">
    <div class="col-md-4 col-12 q-gutter-y-md">
      <q-card class="q-pa-md">
        <table class="info-table">
          <tbody>
            <tr>
              <th colspan="2" style="text-align: right;">UBICACIONES</th>
            </tr>
            <tr>
              <th>Totales</th>
              <td>{{ stats.parcelas_totales }}</td>
            </tr>
            <tr>
              <th>Ocupadas totalmente</th>
              <td>{{ stats.parcelas_ocupadas_totalmente }}</td>
            </tr>
            <tr>
              <th>Ocupadas parcialmente</th>
              <td>{{ stats.parcelas_ocupadas_parcialmente }}</td>
            </tr>
            <tr>
              <th colspan="2" style="text-align: right;">POR ESTATUS</th>
            </tr>
            <tr v-for="parcela in stats?.parcelas_por_estatus">
              <th class="text-left">{{ parcela.estatus || 'No definido' }}</th>
              <td class="text-right">{{ parcela.total }}</td>
            </tr>
          </tbody>
        </table>
      </q-card>
    </div>
    <div class="col-md-8 col-12">
      <div :class="$q.screen.lt.md ? 'q-mt-sm q-py-md' : 'q-ml-sm q-px-md'">

        <div class="q-gutter-md">
          <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregarParcelas" />
          <q-btn label="Grabado de mármol" icon="table_rows" color="primary" :to="`/app/grabado-marmol?tipo_parcela=${route.meta.tipoUbicacion}`" />
          <q-btn-dropdown label="Ver mapa" icon="yard" color="primary">
            <q-list>
              <q-item clickable v-close-popup v-for="area in areas"
                :to="`/app/ubicaciones/${area.id}/mapa`">
                <q-item-section>
                  <q-item-label>{{ area.nombre }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <q-separator class="q-my-lg" />

        <q-table :rows="parcelas" :columns="parcelasColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
          ref="parcelasTableRef" v-model:pagination="parcelasTablePagination" :loading="parcelasTableLoading"
          :filter="parcelasTableFilter" @request="parcelasTableRequest">
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
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
              <q-btn outline icon="visibility" size="sm" color="blue" dense
                @click="router.push('/app/ubicaciones/' + props.row.id)" />
              <q-btn outline icon="delete" size="sm" color="negative" dense
                @click="handleEliminarParcela(props.row.id)" />
            </q-td>
          </template>
          <template v-slot:body-cell="props">
            <q-td :props="props">
              {{ props.value || '-' }}
            </q-td>
          </template>
        </q-table>

        <!-- Agregar parcelas -->
        <q-dialog allow-focus-outside v-model="dialogAgregarParcelas" class="j-dialog j-dialog-lg">
          <q-card class="q-pa-md">
            <q-form @submit="handleAgregarParcelas">
              <q-card-section>
                <div class="text-h6">Agregar parcelas</div>
              </q-card-section>

              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-select outlined v-model="agregarParcelasData.codigo_seccion" :options="seccionesOptions"
                      label="Selecciona una sección *" lazy-rules
                      :rules="[val => val && val.length > 0 || 'Selecciona una sección.']" emit-value map-options
                      clearable />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-select outlined v-model="agregarParcelasData.tipo_parcela_id" :options="tiposParcelasOptions"
                      label="Tipo de parcela *" lazy-rules
                      :rules="[val => val && val.length > 0 || 'Selecciona un tipo de parcela.']" emit-value map-options
                      clearable />
                  </div>
                </div>
              </q-card-section>

              <q-separator class="q-mb-md" />

              <q-card-section>
                <div class="row" v-for="(parcela, index) in agregarParcelasData.data">
                  <div class="col-12 col-sm" :class="!$q.screen.lt.sm && 'q-pr-sm'">
                    <q-input outlined v-model="parcela.num_fila" label="Número de fila" lazy-rules
                      :rules="[val => val && val.length > 0 || '']" clearable stack-label />
                  </div>
                  <div class="col-12 col-sm" :class="!$q.screen.lt.sm && 'q-pl-sm'">
                    <q-input class="input-num-parcela" outlined v-model="parcela.num_parcela" label="Número de parcela"
                      lazy-rules :rules="[val => val && val.length > 0 || '']" clearable stack-label>
                      <template v-slot:prepend>
                        <span>{{ secciones.find(seccion => seccion.codigo_seccion ==
                          agregarParcelasData.codigo_seccion)?.codigo_seccion }}</span>
                      </template>
                    </q-input>
                  </div>
                  <div class="parcela-item-actions col-sm-3 col-12 text-center">
                    <q-btn class="btn-agregar-item" icon="add" color="primary" @click="agregarParcelaItem" />
                    <q-btn class="btn-eliminar-item" icon="delete" outline
                      :color="agregarParcelasData.data.length < 2 ? 'grey' : 'negative'"
                      @click="eliminarParcelaItem(index)" :disable="agregarParcelasData.data.length < 2" />
                  </div>
                </div>
              </q-card-section>

              <q-card-actions class="justify-end">
                <q-btn flat label="Cancelar" v-close-popup />
                <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingAgregarParcelas" />
              </q-card-actions>
            </q-form>
          </q-card>
        </q-dialog>

        <DialogGrabadoMarmol ref="dialogGrabadoMarmol" />

      </div>
    </div>
  </div>
</template>

<style lang="scss">
.q-table__container.text-wrap th,
.q-table__container.text-wrap td {
  white-space: break-spaces !important;
}

.q-table__container thead {
  background-color: $light-primary;
}

.parcela-item-actions {
  padding-bottom: 20px;
}

.parcela-item-actions .q-btn {
  height: 36px;
  width: 36px;

  &:first-child {
    margin-right: 6px;
  }
}

@media (min-width: 600px) {
  .parcela-item-actions {
    padding-bottom: 0;
  }

  .parcela-item-actions .q-btn {
    top: 10px;
  }
}

.input-num-parcela .q-field__prepend {
  line-height: 24px;
  padding-top: 24px;
  padding-bottom: 8px;
  font-weight: 400;
  font-size: 14px;
  position: relative;
}

.input-num-parcela .q-field__prepend:after {
  position: absolute;
  content: "-";
  right: 4px;
}
</style>

<script setup>

import { ref, reactive, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { qNotify } from 'src/boot/jardines';
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import DialogGrabadoMarmol from "src/components/popups/DialogGrabadoMarmol.vue";

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const dialogGrabadoMarmol = ref(null)

const parcelasColumnas = [
  { name: 'codigo_parcela', label: 'Ubicación', align: 'left', field: 'codigo_parcela', sortable: true, headerStyle: "width: 105px"},
  { name: 'propietario', label: 'Propietario', align: 'left', field: 'cliente_nombre', sortable: true },
  { name: 'estatus', label: 'Estatus', align: 'left', field: 'estatus', sortable: true },
  { name: 'ocupacion', label: 'Ocupación', align: 'left', field: 'ocupacion', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const parcelas = ref([])
const secciones = ref([])
const areas = ref([])

// Agregar parcelas
const dialogAgregarParcelas = ref(false)
const isLoadingAgregarParcelas = ref(false);

const seccionesOptions = []
const areasOptions = []
const tiposParcelasOptions = []

function obtenerConsecutivo(numero) {

  const ultimoCaracter = numero.charAt(numero.length - 1);
  let consecutivo = '';

  if (/[0-8]/.test(ultimoCaracter)) {
    consecutivo = String(Number(numero) + 1).padStart(numero.length, '0');
  } else if (ultimoCaracter === '9') {
    consecutivo = obtenerConsecutivo(numero.slice(0, -1)) + '0';
  } else if (/[a-zA-Z]/.test(ultimoCaracter)) {
    consecutivo = numero.slice(0, -1) + String.fromCharCode(ultimoCaracter.charCodeAt(0) + 1);
  } else {
    return numero
  }

  return consecutivo;
}

const agregarParcelaItem = () => {
  const ultimaParcela = agregarParcelasData.value.data[agregarParcelasData.value.data.length - 1]

  agregarParcelasData.value.data.push(
    {
      num_fila: ultimaParcela.num_fila || null,
      num_parcela: ultimaParcela.num_parcela ? obtenerConsecutivo(ultimaParcela.num_parcela) : null,
    }
  )
}

const eliminarParcelaItem = index => {
  agregarParcelasData.value.data.splice(index, 1)
}

const agregarParcelasData = ref({
  codigo_seccion: null,
  tipo_parcela_id: null,
  data: [
    {
      num_fila: null,
      num_parcela: null,
    }
  ]
})

const handleAgregarParcelas = () => {
  isLoadingAgregarParcelas.value = true
  let postData = {
    data: [
      ...agregarParcelasData.value.data.map(parcela => {
        parcela.codigo_seccion = agregarParcelasData.value.codigo_seccion
        parcela.tipo_parcela_id = agregarParcelasData.value.tipo_parcela_id
        return { ...parcela }
      })
    ]
  }

  console.log(postData);

  api.post('parcelas', postData)
    .then(response => {
      if (response.data) {
        agregarParcelasData.value = {
          codigo_seccion: null,
          tipo_parcela_id: null,
          data: [
            {
              num_fila: null,
              num_parcela: null,
            }
          ]
        }
        dialogAgregarParcelas.value = false
        $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
      }
    })
    .catch(error => qNotify(error, 'error', { callback: handleAgregarParcelas }))
    .finally(() => isLoadingAgregarParcelas.value = false)
}

watch(() => route.meta.tipoUbicacion, (value) => {
  parcelas.value = []
  parcelasTableRef.value.requestServerInteraction()
})

const openDialogAgregarParcelas = (id) => {
  agregarParcelasData.value = {
    codigo_seccion: null,
    tipo_parcela_id: null,
    data: [
      {
        num_fila: null,
        num_parcela: null,
      }
    ]
  }
  dialogAgregarParcelas.value = true
}

// Editar parcela
const dialogEditarParcela = ref(false)
const isLoadingEditarParcela = ref(false);

const editarParcelaData = reactive({
  id: null,
  codigo_seccion: null,
  num_fila: null,
  num_parcela: null,
  estatus: null,
  orientacion: null,
  tipo_parcela_id: null,
  es_compartida: true,
  max_puestos: 1,
})

const handleEditarParcela = () => {
  isLoadingEditarParcela.value = true
  let postData = { ...editarParcelaData }

  $q.notify({ message: 'Editado!! exitosamente.', color: 'positive' })
}

const openDialogEditarParcela = (id) => {
  let parcelaData = parcelas.value.find(row => row.id == id)
  parcelaData.id = id
  Object.keys(parcelaData).forEach((i) => {
    if (editarParcelaData.hasOwnProperty(i)) editarParcelaData[i] = parcelaData[i]
  })
  dialogEditarParcela.value = true
}

// Eliminar parcela
const selectedParcela = ref(null)
const dialogEliminarParcela = ref(false)
const isLoadingEliminarParcela = ref(false)

const handleEliminarParcela = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Eliminar ubicación',
      message: '¿Estás seguro de que quieres eliminar esta ubicación?',
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
      handleEliminarParcela(id, true)
    })
  } else {
    isLoadingEliminarParcela.value = true
    api.delete('parcelas/' + id)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
          parcelas.value = parcelas.value.filter(parcela => parcela.id !== id)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEliminarParcela(id) }))
      .finally(() => isLoadingEliminarParcela.value = false)
  }
}

/*const handleEliminarParcela = (id) => {
  isLoadingEliminarParcela.value = true
  api.delete('parcelas/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminarParcela.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        parcelas.value = parcelas.value.filter(parcela => parcela.id !== id)
      }
    })
    .catch(error => qNotify(error, 'error', { callback: () => handleEliminarParcela(id) }))
    .finally(() => isLoadingEliminarParcela.value = false)
}*/

const stats = ref({});

/**
 * PAGINATION
 */
const parcelasTableRef = ref(null)
const parcelasTableLoading = ref(true)
const parcelasTableFilter = ref(router.currentRoute.value.query.search || '');
const parcelasTablePagination = ref({
  page: 1,
  rowsPerPage: 25,
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
    router.replace({query: { search: parcelasTableFilter.value}})
  }

  if (route.meta.tipoUbicacion) {
    searchParams.append('f[tipo_parcela]', route.meta.tipoUbicacion)
  }

  console.log('sortby', sortBy);

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
/**
 * END OF PAGINATION
 */

onMounted(() => {
  api.get('secciones')
    .then(response => {
      if (response.data) {
        secciones.value = response.data
        secciones.value.forEach(seccion => {
          seccionesOptions.push(
            {
              label: `${seccion.nombre} (${seccion.codigo_seccion})`,
              value: seccion.codigo_seccion
            }
          );
        })
      }
    })
    .catch(e => console.log(e))

  api.get('areas')
    .then(response => {
      if (response.data) {
        areas.value = response.data
        areas.value.forEach(area => {
          areasOptions.push(
            {
              label: `${area.nombre}`,
              value: area.id
            }
          );
        });
      }
    })
    .catch(e => console.log(e))

  parcelasTableRef.value.requestServerInteraction()

  api.get('parcelas/params')
    .then(response => {
      if (response.data?.tipos_parcelas) {
        response.data.tipos_parcelas.forEach(tipoUbicacion => {
          tiposParcelasOptions.push(
            {
              label: `${tipoUbicacion.nombre}`,
              value: tipoUbicacion.id
            }
          );
        });
      }
    })

  api.get('pages/parcelas')
    .then(response => {
      if (response.data) {
        stats.value = response.data
      }
    })
})
</script>
