<template>
  <div class="q-gutter-md">
    <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregar" />
  </div>
  <q-separator class="q-my-lg" />

  <div class="q-pb-lg text-center" v-if="isLoading">
    <q-spinner size="xl" color="primary" />
  </div>

  <q-table :rows="parcelas" :columns="columnas" row-key="name" :class="!$q.screen.lt.md && 'text-wrap'" v-else>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
        <q-btn outline icon="edit" size="sm" color="blue" dense @click="openDialogEditar(props.row.id)" />
        <q-btn outline icon="delete" size="sm" color="negative" dense @click="openDialogEliminar(props.row.id)" />
      </q-td>
    </template>
  </q-table>

  <!-- Agregar / Editar -->
  <q-dialog allow-focus-outside v-model="dialogAgregarEditar" class="j-dialog j-dialog-lg">
    <q-card class="q-pa-md">
      <q-form @submit="handleAgregarEditar">
        <q-card-section>
          <div class="text-h6">{{ agregarEditarData.id ? 'Editar' : 'Agregar' }} producto</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <div class="row">
            <div class="col-12">
              <q-input outlined v-model="agregarEditarData.nombre" label="Nombre del producto *" lazy-rules
                :rules="[val => val && val.length > 0 || 'Escribe el nombre del producto.']" />
            </div>
            <div class="col-12">
              <q-select :options="['Parcela', 'Columbario', 'Nicho']" outlined v-model="agregarEditarData.tipo_parcela"
                :rules="[val => val && val.length > 0 || 'Selecciona un tipo de producto.']" label="Tipo de producto"
                clearable />
            </div>
            <div class="col-12">
              <q-input outlined v-model="agregarEditarData.precio" label="Precio base" type="number" step="0.01"
                clearable>
                <template v-slot:prepend>
                  <q-icon name="attach_money" />
                </template>
              </q-input>
            </div>
            <div class="col-12 q-py-lg">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-4">
                  <q-input outlined v-model="agregarEditarData.largo" label="Largo" type="number" step="0.01"/>
                </div>
                <div class="col-12 col-sm-4">
                  <q-input outlined v-model="agregarEditarData.ancho" label="Ancho" type="number" step="0.01"/>
                </div>
                <div class="col-12 col-sm-4">
                  <q-input outlined v-model="agregarEditarData.profundidad" label="Profundidad" type="number" step="0.01"/>
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="text-h6 q-py-md text-center">Puestos
                <q-icon name="help_outline" size="sm" class="q-mb-xs">
                  <q-tooltip max-width="200px" class="text-center bg-black">Para el caso de parcelas dobles, los nombres pueden ser "Inferior" y "Superior". Productos de un único puesto pueden llamarse "Único".</q-tooltip>
                </q-icon>
              </div>
              <div class="row" v-for="(_, index) in agregarEditarData.puestos" v-if="agregarEditarData.puestos?.length">
                <div class="col-12 col-sm-9" :class="!$q.screen.lt.sm && 'q-pr-sm'">
                  <q-input outlined v-model="agregarEditarData.puestos[index]" label="Nombre del puesto" lazy-rules
                    :rules="[val => val && val.length > 0 || '']" clearable stack-label />
                </div>
                <div class="parcela-item-actions col-sm-3 col-12 text-center">
                  <q-btn class="btn-agregar-item" icon="add" color="primary" @click="agregarPuestoItem" />
                  <q-btn class="btn-eliminar-item" icon="delete" outline
                    :color="agregarEditarData.puestos.length < 2 ? 'grey' : 'negative'" @click="eliminarPuestoItem(index)"
                    :disable="agregarEditarData.puestos.length < 2" />
                </div>
              </div>
              <div v-else class="text-center">
                <q-btn color="primary" label="Agregar puesto" @click="agregarPuestoItem" />
              </div>
            </div>
            <div class="col-12">
              <div class="text-h6 q-py-md text-center">Contratos
                <q-icon name="help_outline" size="sm" class="q-mb-xs">
                  <q-tooltip max-width="200px" class="text-center bg-black">Definir los contratos que lleva asociados este producto. Una vez adquirido por un propietario, se generarán estos contratos con los valores por defecto definidos abajo.</q-tooltip>
                </q-icon>
              </div>
              <template v-if="agregarEditarData.id">
                <table class="full-width">
                  <tbody>
                    <template v-for="(contrato, index) in agregarEditarData.contratos">
                      <tr>
                        <th>Código</th>
                        <td>{{ contrato.contrato_tipo_id }}</td>
                        <th>Cuota mensual</th>
                        <td>{{ contrato.valor_cuota_mensual }}</td>
                        <td rowspan="4" class="q-gutter-xs">
                          <q-btn dense icon="edit" outline color="blue" style="display: block;"
                          @click="openDialogEditarContratoParcela(agregarEditarData.id, index)" />
                          <q-btn dense icon="delete" outline color="negative" style="display: block;"
                            @click="eliminarContratoParcela(agregarEditarData.id, contrato.contrato_tipo_id)" />
                        </td>
                      </tr>
                      <tr>
                        <th>Valor total</th>
                        <td>{{ contrato.valor_total }}</td>
                        <th>Núm. cuotas</th>
                        <td>{{ contrato.numero_cuotas }}</td>
                      </tr>
                      <tr>
                        <th>Valor venta</th>
                        <td>{{ contrato.valor_venta }}</td>
                        <th>Períodos &times; cuota</th>
                        <td>{{ contrato.periodos_por_cuota }}</td>
                      </tr>
                      <tr>
                        <th>Cuota inicial</th>
                        <td>{{ contrato.valor_cuota_inicial }}</td>
                        <th>Días preaviso</th>
                        <td>{{ contrato.dias_preaviso }}</td>
                      </tr>
                      <tr>
                        <td colspan="5">
                          <q-separator class="q-my-md" />
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
                <div class="text-center">
                  <q-btn color="primary" label="Agregar contrato" @click="openDialogAgregarContratoParcela(agregarEditarData.id)" />
                </div>
              </template>
              <template v-else>
                <div class="row" v-for="(contrato, index) in agregarEditarData.contratos"
                  v-if="agregarEditarData.contratos?.length">
                  <div class="col-12 col-sm-9" :class="!$q.screen.lt.sm && 'q-pr-sm'">
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-input outlined v-model="contrato.contrato_tipo_id" label="Código de contrato" lazy-rules hide-bottom-space
                        :rules="[val => val && val.length > 0 || '']" clearable stack-label />
                      </div>
                      <div class="col-6">
                        <q-input outlined v-model="contrato.valor_total" label="Valor total" type="number" step="0.01" stack-label />
                      </div>
                      <div class="col-6">
                        <q-input outlined v-model="contrato.valor_venta" label="Valor venta" type="number" step="0.01" stack-label />
                      </div>
                      <div class="col-6">
                        <q-input outlined v-model="contrato.valor_cuota_inicial" label="Cuota inicial" type="number" step="0.01" stack-label />
                      </div>
                      <div class="col-6">
                        <q-input outlined v-model="contrato.valor_cuota_mensual" label="Cuota mensual" type="number" step="0.01" stack-label />
                      </div>
                      <div class="col-6">
                        <q-input outlined v-model="contrato.numero_cuotas" label="Núm. cuotas" type="number" step="1" stack-label />
                      </div>
                      <div class="col-6">
                        <q-input outlined v-model="contrato.periodos_por_cuota" label="Períodos por cuota" type="number" step="1" stack-label />
                      </div>
                      <div class="col-6">
                        <q-input outlined v-model="contrato.dias_preaviso" label="Días preaviso" type="number" step="1" stack-label />
                      </div>
                      <div class="col-12" v-if="agregarEditarData.contratos.length > index + 1 ">
                        <q-separator class="q-mt-sm q-mb-md"/>
                      </div>
                    </div>
                  </div>
                  <div class="parcela-item-actions col-sm-3 col-12 flex column justify-center items-center q-gutter-sm">
                    <q-btn class="btn-agregar-item" icon="add" color="primary" @click="agregarContratoItem" style="margin-right: 0;"/>
                    <q-btn class="btn-eliminar-item" icon="delete" outline
                      :color="agregarEditarData.contratos.length < 2 ? 'grey' : 'negative'"
                      @click="eliminarContratoItem(index)" :disable="agregarEditarData.contratos.length < 2" />
                  </div>
                </div>
                <div v-else class="text-center">
                  <q-btn color="primary" label="Agregar contrato" @click="agregarContratoItem" />
                </div>
              </template>
            </div>
          </div>

        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" :label="agregarEditarData.id ? 'Editar' : 'Agregar'" color="primary"
            :loading="isLoadingAgregarEditar" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <!-- Eliminar -->
  <q-dialog allow-focus-outside v-model="dialogEliminar" class="j-dialog">
    <q-card class="q-pa-md text-center">
      <q-card-section>
        <div class="text-h6">Eliminar contrato</div>
      </q-card-section>
      <q-card-section class="q-py-none">
        <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
      </q-card-section>
      <q-card-section>
        ¿Estás seguro de que quieres eliminar "<span class="text-weight-bold">{{ selected.nombre }}</span>"? Esta acción
        no se puede deshacer.
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn label="Eliminar" color="negative" @click="handleEliminar(selected.id)" :loading="isLoadingEliminar" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Agregar contrato -->
  <q-dialog allow-focus-outside v-model="dialogAgregarEditarContrato" class="j-dialog">
    <q-card class="q-pa-md text-center">
      <q-form @submit="handleAgregarEditarContrato(agregarEditarContratoData.parcela_tipo_id)">
        <q-card-section>
          <div class="text-h6">{{ agregarEditarContratoData.id ? 'Editar' : 'Agregar' }} contrato</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.contrato_tipo_id" :readonly="!!agregarEditarContratoData.id" label="Código de contrato" lazy-rules hide-bottom-space
              :rules="[val => val && val.length > 0 || '']" stack-label />
            </div>
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.valor_total" label="Valor total" type="number" step="0.01" stack-label />
            </div>
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.valor_venta" label="Valor venta" type="number" step="0.01" stack-label />
            </div>
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.valor_cuota_inicial" label="Cuota inicial" type="number" step="0.01" stack-label />
            </div>
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.valor_cuota_mensual" label="Cuota mensual" type="number" step="0.01" stack-label />
            </div>
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.numero_cuotas" label="Núm. cuotas" type="number" step="1" stack-label />
            </div>
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.periodos_por_cuota" label="Períodos por cuota" type="number" step="1" stack-label />
            </div>
            <div class="col-6">
              <q-input outlined v-model="agregarEditarContratoData.dias_preaviso" label="Días preaviso" type="number" step="1" stack-label />
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Agregar" type="submit" color="primary" :loading="isLoadingAgregarEditarContrato" />
        </q-card-actions>
      </q-form>
    </q-card>

  </q-dialog>

</template>

<script setup>

import { api } from 'src/boot/axios'
import { qNotify, $bs, $usd, $toFixed } from 'src/boot/jardines';
import { ref, reactive, onMounted } from 'vue'

const isLoading = ref(true)
const isLoadingAgregarEditar = ref(false)
const isLoadingEliminar = ref(false)
const isLoadingAgregarEditarContrato = ref(false)

const dialogAgregarEditar = ref(false)
const dialogEliminar = ref(false)
const dialogAgregarEditarContrato = ref(false)

const parcelas = ref([])
const selected = ref({})

const columnas = [
  { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
  { name: 'tipo_parcela', label: 'Tipo de parcela', align: 'left', field: 'tipo_parcela', sortable: true },
  { name: 'cantidad_puestos', label: 'Cant. puestos', align: 'left', field: 'cantidad_puestos', sortable: true },
  { name: 'precio', label: 'Precio', align: 'left', field: 'precio', sortable: true, format: (val) => val ? $bs(val) : '-' },
  { name: 'medidas', label: 'Medidas', align: 'left', format: (_, row) => row.largo && row.ancho && row.profundidad &&
    `${$toFixed(row.largo)}\u00D7${$toFixed(row.ancho)}\u00D7${$toFixed(row.profundidad)}` ||
    '-'
  },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const agregarEditarData = reactive({
  id: null,
  nombre: null,
  tipo_parcela: null,
  cantidad_puestos: null,
  nombres_puestos: null,
  precio: null,
  largo: null,
  ancho: null,
  profundidad: null,
  puestos: [],
  contratos: [],
})

const agregarEditarContratoData = reactive({
  id: null,
  parcela_tipo_id: null,
  contrato_tipo_id: null,
  valor_total: null,
  valor_venta: null,
  valor_cuota_inicial: null,
  valor_cuota_mensual: null,
  numero_cuotas: null,
  periodos_por_cuota: null,
  dias_preaviso: null,
})

const openDialogAgregar = () => {
  Object.keys(agregarEditarData).forEach((i) => agregarEditarData[i] = null)
  dialogAgregarEditar.value = true
}

const openDialogEditar = (id) => {
  let data = parcelas.value.find(row => row.id == id)
  Object.keys(data).forEach((i) => {
    if (agregarEditarData.hasOwnProperty(i)) agregarEditarData[i] = data[i]
  })
  dialogAgregarEditar.value = true
}

const openDialogAgregarContratoParcela = (parcelaId) => {
  Object.keys(agregarEditarContratoData).forEach((i) => agregarEditarContratoData[i] = null)
  agregarEditarContratoData.parcela_tipo_id = parcelaId
  dialogAgregarEditarContrato.value = true
}

const openDialogEditarContratoParcela = (parcelaId, indexContrato) => {
  let data = parcelas.value.find(row => row.id == parcelaId)
  let contrato = data.contratos && data.contratos[indexContrato]

  if (!contrato) return;

  Object.keys(contrato).forEach((i) => {
    if (agregarEditarContratoData.hasOwnProperty(i)) agregarEditarContratoData[i] = contrato[i]
  })

  contrato['id'] = contrato.contrato_tipo_id
  dialogAgregarEditarContrato.value = true
}

const handleAgregarEditar = () => {

  isLoadingAgregarEditar.value = true
  let postData = { ...agregarEditarData }

  if (postData.id) {

    api.post('parcelas/tipos/' + postData.id, postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarEditarData).forEach((i) => agregarEditarData[i] = null)
          dialogAgregarEditar.value = false
          qNotify('Editado exitosamente.')
          let index = parcelas.value.findIndex(row => row.id == postData.id)
          if (index > -1) {
            parcelas.value[index] = response.data
          }
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoadingAgregarEditar.value = false)

  } else {

    console.log(postData);

    api.post('parcelas/tipos', postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarEditarData).forEach((i) => agregarEditarData[i] = null)
          dialogAgregarEditar.value = false
          qNotify('Agregado exitosamente.')
          parcelas.value.push(response.data)
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoadingAgregarEditar.value = false)

  }

}

const handleAgregarEditarContrato = (parcelaTipoId) => {
  isLoadingAgregarEditarContrato.value = true
  let postData = { ...agregarEditarContratoData }

  api.post('parcelas/tipos/' + parcelaTipoId + '/guardarContrato', postData)
    .then(response => {
      if (response.data) {
        Object.keys(agregarEditarContratoData).forEach((i) => agregarEditarContratoData[i] = null)
        qNotify('Editado exitosamente.')
        let index = parcelas.value.findIndex(row => row.id == parcelaTipoId)

        if (index > -1) {
          let contratoIndex = parcelas.value[index].contratos.findIndex(contrato => contrato.contrato_tipo_id == response.data.contrato_tipo_id)
          if (contratoIndex > -1) {
            parcelas.value[index].contratos[contratoIndex] = response.data
          } else {
            if (!parcelas.value[index].contratos?.length) {
              parcelas.value[index].contratos = []
            }
            parcelas.value[index].contratos.push(response.data)
          }
        }

        dialogAgregarEditarContrato.value = false
        dialogAgregarEditar.value = false

      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingAgregarEditarContrato.value = false)

}

const openDialogEliminar = (id) => {
  selected.value = parcelas.value.find(row => row.id == id)
  dialogEliminar.value = true
}

const handleEliminar = (id) => {
  isLoadingEliminar.value = true
  api.delete('parcelas/tipos/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminar.value = false
        qNotify('Eliminado exitosamente.')
        parcelas.value = parcelas.value.filter(row => row.id !== id)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingEliminar.value = false)
}

const agregarPuestoItem = () => {
  if (agregarEditarData.puestos?.length) {
    agregarEditarData.puestos.push('');
  } else {
    agregarEditarData.puestos = [''];
  }
}

const eliminarPuestoItem = index => {
  agregarEditarData.puestos.splice(index, 1)
}

const agregarContratoItem = () => {
  const formatoContrato = {
    contrato_tipo_id: null,
    valor_total: null,
    valor_venta: null,
    valor_cuota_inicial: null,
    valor_cuota_mensual: null,
    numero_cuotas: null,
    periodos_por_cuota: null,
    dias_preaviso: null,
  }
  if (agregarEditarData.contratos?.length) {
    agregarEditarData.contratos.push(formatoContrato);
  } else {
    agregarEditarData.contratos = [formatoContrato];
  }
}

const eliminarContratoItem = index => {
  agregarEditarData.contratos.splice(index, 1)
}

const eliminarContratoParcela = (parcelaId, contratoId) => {

  const index = parcelas.value.findIndex(p => p.id == parcelaId);
  if (index < 0) return;

  let postData = {
    parcela_tipo_id: parcelas.value[index].id,
    contrato_tipo_id: contratoId,
  }

  api.post('parcelas/tipos/eliminarContrato', postData)
    .then(response => {
      console.log(response);
      if (response.status == 200) {
        qNotify('Eliminado exitosamente.')
        parcelas.value[index].contratos = parcelas.value[index].contratos.filter(contrato => {
          return contrato.contrato_tipo_id !== contratoId
        })
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => dialogAgregarEditar.value = false)

}

onMounted(() => {
  api.get('parcelas/tipos')
    .then(response => {
      if (response.data) parcelas.value = response.data;
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoading.value = false)
});

</script>
