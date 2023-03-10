<template>
  <div class="row full-width">
    <div class="col-lg-4 col-12">
      <q-card class="q-pa-md" :class="$q.screen.lt.lg ? 'q-mb-sm' : 'q-mr-sm'">
        <table class="info-table">
          <tr>
            <th colspan="2" style="text-align: right;">PARCELAS</th>
          </tr>
          <tr>
            <th>Totales</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Ocupadas totalmente</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Ocupadas parcialmente</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Disponibles</th>
            <td>0</td>
          </tr>
          <tr>
            <th colspan="2" style="text-align: right;">NICHOS</th>
          </tr>
          <tr>
            <th>Totales</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Ocupados</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Disponibles</th>
            <td>0</td>
          </tr>
          <tr>
            <th colspan="2" style="text-align: right;">COLUMBARIOS</th>
          </tr>
          <tr>
            <th>Totales</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Ocupados</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Disponibles</th>
            <td>0</td>
          </tr>
        </table>
      </q-card>
    </div>
    <div class="col-lg-8 col-12">
      <div :class="$q.screen.lt.lg ? 'q-mt-sm q-py-md' : 'q-ml-sm q-px-md'">

        <div class="q-gutter-md">
          <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregarParcelas" />
        </div>
        <q-separator class="q-my-lg" />

        <div class="q-pb-lg text-center" v-if="isLoadingParcelas">
          <q-spinner size="xl" color="primary" />
        </div>

        <q-table :rows="parcelas" :columns="parcelasColumnas" row-key="name" :class="!$q.screen.lt.lg && 'text-wrap'"
          v-else>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
              <q-btn outline icon="visibility" size="sm" color="blue" dense
                @click="router.push('/parcelas/' + props.row.id)" />
              <q-btn outline icon="delete" size="sm" color="negative" dense
                @click="openDialogEliminarParcela(props.row.id)" />
            </q-td>
          </template>
          <template v-slot:body-cell="props">
            <q-td :props="props">
              {{ props.value || '-' }}
            </q-td>
          </template>
        </q-table>

        <!-- Agregar parcelas -->
        <q-dialog v-model="dialogAgregarParcelas" class="j-dialog j-dialog-lg">
          <q-card class="q-pa-md">
            <q-form @submit="handleAgregarParcelas">
              <q-card-section>
                <div class="text-h6">Agregar parcelas</div>
              </q-card-section>

              {{ agregarParcelasData }}

              <q-card-section>
                <q-select outlined v-model="agregarParcelasData.codigo_seccion" :options="seccionesOptions"
                  label="Selecciona una sección *" lazy-rules
                  :rules="[val => val && val.length > 0 || 'Selecciona una sección.']" emit-value map-options clearable />
              </q-card-section>

              <q-separator class="q-mb-md" />

              <q-card-section>
                <div class="row" v-for="(parcela, index) in agregarParcelasData.data">
                  <div class="col-12 col-xs-6 col-sm" :class="!$q.screen.lt.sm && 'q-pr-sm'">
                    <q-input outlined v-model="parcela.num_fila" label="Número de fila" lazy-rules
                      :rules="[val => val && val.length > 0 || '']" clearable stack-label />
                  </div>
                  <div class="col-12 col-xs-6 col-sm" :class="!$q.screen.lt.sm && 'q-pl-sm'">
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

      </div>
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

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

const router = useRouter()
const $q = useQuasar()

function qNotifyError(error) {
  let message = !!error?.response?.data?.messages ?
    Object.values(error.response.data.messages).join(' ') :
    'Ha ocurrido un error'
  $q.notify({ message, color: 'negative' })
}

const parcelasColumnas = [
  { name: 'codigo_parcela', label: 'Núm. parcela', align: 'left', field: 'codigo_parcela', sortable: true },
  { name: 'estatus', label: 'Estatus', align: 'left', field: 'estatus', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const parcelas = ref([])
const secciones = ref([])

// Agregar parcelas
const dialogAgregarParcelas = ref(false)
const isLoadingAgregarParcelas = ref(false);

const seccionesOptions = []

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
        return { ...parcela }
      })
    ]
  }

  api.post('parcelas', postData)
    .then(response => {
      if (response.data) {
        agregarParcelasData.value = {
          codigo_seccion: null,
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
    .catch(error => qNotifyError(error))
    .finally(() => isLoadingAgregarParcelas.value = false)
}

const openDialogAgregarParcelas = (id) => {
  agregarParcelasData.value = {
    codigo_seccion: null,
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
  tipo_parcela: null,
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
    if (editarParcelaData.hasOwnProperty(i)) eEditarParcelaData[i] = parcelaData[i]
  })
  dialogEditarParcela.value = true
}

// Eliminar parcela
const selectedParcela = ref(null)
const dialogEliminarParcela = ref(false)
const isLoadingEliminarParcela = ref(false)

const openDialogEliminarParcela = (id) => {
  selectedParcela.value = parcelas.value.find(row => row.id == id)
  dialogEliminarParcela.value = true
}

const handleEliminarParcela = (id) => {
  isLoadingEliminarParcela.value = true
  api.delete('parcelas/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminarParcela.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        parcelas.value = parcelas.value.filter(parcela => parcela.id !== id)
      }
    })
    .catch(error => qNotifyError(error))
    .finally(() => isLoadingEliminarParcela.value = false)
}

const isLoadingEmpresas = ref(true)
const isLoadingAreas = ref(true)
const isLoadingSecciones = ref(true)
const isLoadingParcelas = ref(true)


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

  api.get('parcelas')
    .then(response => {
      if (response.data) parcelas.value = response.data;
    })
    .catch(e => console.log(e))
    .finally(() => isLoadingParcelas.value = false)
})
</script>
