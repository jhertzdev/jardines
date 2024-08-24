<template>
  <q-splitter v-model="splitterModel" :horizontal="$q.screen.lt.md">

    <template v-slot:before>
      <q-tabs v-model="tab" :vertical="!$q.screen.lt.md" class="text-grey-5" active-color="primary">
        <q-tab name="empresas" icon="business" label="Empresas" />
        <q-tab name="areas" icon="crop_square" label="Areas" />
        <q-tab name="secciones" icon="grass" label="Secciones" />
        <q-tab name="contratos" icon="document_scanner" label="Contratos" />
        <q-tab name="productos" icon="yard" label="Productos" />
        <q-tab name="configuracion" icon="settings" label="Configuración" />
      </q-tabs>
    </template>

    <template v-slot:after>
      <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up">
        <q-tab-panel name="empresas">
          <div class="q-gutter-md">
            <q-btn label="Agregar" icon="add" color="primary" @click="dialogAgregarEmpresa = true" />
          </div>
          <q-separator class="q-my-lg" />

          <div class="q-pb-lg text-center" v-if="isLoadingEmpresas">
            <q-spinner size="xl" color="primary" />
          </div>

          <q-table :rows="empresas" :columns="empresasColumnas" row-key="name" :class="!$q.screen.lt.md && 'text-wrap'"
            v-else>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
                <q-btn outline icon="edit" size="sm" color="blue" dense @click="openDialogEditarEmpresa(props.row.id)" />
                <q-btn outline icon="delete" size="sm" color="negative" dense
                  @click="openDialogEliminarEmpresa(props.row.id)" />
              </q-td>
            </template>
          </q-table>

        </q-tab-panel>

        <q-tab-panel name="areas">
          <div class="q-gutter-md">
            <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregarArea" />
          </div>
          <q-separator class="q-my-lg" />

          <div class="q-pb-lg text-center" v-if="isLoadingAreas">
            <q-spinner size="xl" color="primary" />
          </div>

          <q-table :rows="areas" :columns="areasColumnas" row-key="name" :class="!$q.screen.lt.md && 'text-wrap'"
            v-else>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
                <q-btn outline icon="edit" size="sm" color="blue" dense @click="openDialogEditarArea(props.row.id)" />
                <q-btn outline icon="delete" size="sm" color="negative" dense
                  @click="openDialogEliminarArea(props.row.id)" />
              </q-td>
            </template>
          </q-table>

        </q-tab-panel>

        <q-tab-panel name="secciones">
          <div class="q-gutter-md">
            <q-btn label="Agregar" icon="add" color="primary" @click="openDialogAgregarSeccion" />
          </div>
          <q-separator class="q-my-lg" />

          <div class="q-pb-lg text-center" v-if="isLoadingSecciones">
            <q-spinner size="xl" color="primary" />
          </div>

          <q-table :rows="secciones" :columns="seccionesColumnas" row-key="name" :class="!$q.screen.lt.md && 'text-wrap'"
            v-else>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
                <q-btn outline icon="edit" size="sm" color="blue" dense @click="openDialogEditarSeccion(props.row.id)" />
                <q-btn outline icon="delete" size="sm" color="negative" dense
                  @click="openDialogEliminarSeccion(props.row.id)" />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="contratos">
          <QTabPanelContratosContent />
        </q-tab-panel>

        <q-tab-panel name="productos">
          <QTabPanelProductosContent />
        </q-tab-panel>

        <q-tab-panel name="configuracion">
          <QTabPanelConfiguracionContent />
        </q-tab-panel>

      </q-tab-panels>
    </template>

    <!-- Modals -->

    <!-- Crear empresa -->
    <q-dialog v-model="dialogAgregarEmpresa" class="j-dialog">
      <q-card class="q-pa-md">
        <q-form @submit="handleAgregarEmpresa">
          <q-card-section>
            <div class="text-h6">Agregar empresa</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input outlined v-model="agregarEmpresaData.razon_social" label="Razón social *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Escribe un nombre de razón social.']" clearable />
            <q-input outlined v-model="agregarEmpresaData.rif" label="RIF *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Escribe una número de RIF.']" clearable />
            <q-select outlined v-model="agregarEmpresaData.tipo_actividad" :options="tiposEmpresa"
              label="Selecciona un tipo *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Selecciona un tipo de empresa.']" emit-value map-options
              clearable />
          </q-card-section>

          <q-card-actions class="justify-end">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingAgregarEmpresa" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Editar empresa -->
    <q-dialog v-model="dialogEditarEmpresa" class="j-dialog">
      <q-card class="q-pa-md">
        <q-form @submit="handleEditarEmpresa">
          <q-card-section>
            <div class="text-h6">Editar empresa</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input outlined v-model="editarEmpresaData.razon_social" label="Razón social *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Escribe un nombre de razón social.']" clearable />
            <q-input outlined v-model="editarEmpresaData.rif" label="RIF *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Escribe una número de RIF.']" clearable />
            <q-select outlined v-model="editarEmpresaData.tipo_actividad" :options="tiposEmpresa"
              label="Selecciona un tipo *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Selecciona un tipo de empresa.']" emit-value map-options
              clearable />
          </q-card-section>

          <q-card-actions class="justify-end">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" label="Editar" color="primary" :loading="isLoadingEditarEmpresa" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Eliminar empresa -->
    <q-dialog v-model="dialogEliminarEmpresa" class="j-dialog">
      <q-card class="q-pa-md text-center">
        <q-card-section>
          <div class="text-h6">Eliminar empresa</div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
        </q-card-section>
        <q-card-section>
          ¿Estás seguro de que quieres eliminar "<span class="text-weight-bold">{{ selectedEmpresa.razon_social
          }}</span>"? Esta
          acción no se puede deshacer.
        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Eliminar" color="negative" @click="handleEliminarEmpresa(selectedEmpresa.id)"
            :loading="isLoadingEliminarEmpresa" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Crear / Editar area -->
    <q-dialog v-model="dialogAgregarEditarArea" class="j-dialog">
      <q-card class="q-pa-md">
        <q-form @submit="handleAgregarEditarArea">
          <q-card-section>
            <div class="text-h6">{{ agregarEditarAreaData.id ? 'Editar' : 'Agregar' }} área</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input outlined v-model="agregarEditarAreaData.nombre" label="Nombre *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Escribe el nombre del área.']" clearable />
          </q-card-section>

          <q-card-actions class="justify-end">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingAgregarEditarArea" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Eliminar area -->

    <q-dialog v-model="dialogEliminarArea" class="j-dialog">
      <q-card class="q-pa-md text-center">
        <q-card-section>
          <div class="text-h6">Eliminar sección</div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
        </q-card-section>
        <q-card-section>
          ¿Estás seguro de que quieres eliminar "<span class="text-weight-bold">{{ selectedArea.nombre }}</span>"? Esta
          acción no se puede deshacer.
        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Eliminar" color="negative" @click="handleEliminarArea(selectedArea.id)"
            :loading="isLoadingEliminarArea" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Crear / Editar sección -->
    <q-dialog v-model="dialogAgregarEditarSeccion" class="j-dialog">
      <q-card class="q-pa-md">
        <q-form @submit="handleAgregarEditarSeccion">
          <q-card-section>
            <div class="text-h6">{{ agregarEditarSeccionData.id ? 'Editar' : 'Agregar' }} sección</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input outlined v-model="agregarEditarSeccionData.nombre" label="Nombre *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Escribe el nombre del sección.']" clearable />
            <q-select outlined v-model="agregarEditarSeccionData.area_id" :options="areasOptions"
              label="Selecciona un área *" lazy-rules :rules="[val => val && val.length > 0 || 'Selecciona un área.']"
              emit-value map-options clearable />
            <q-input outlined v-model="agregarEditarSeccionData.codigo_seccion" label="Código de sección *" lazy-rules
              :rules="[val => val && val.length > 0 || 'Escribe un código.']" clearable />
            <q-input outlined v-model="agregarEditarSeccionData.descripcion" label="Descripción" />
          </q-card-section>

          <q-card-actions class="justify-end">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingAgregarEditarSeccion" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Eliminar sección -->

    <q-dialog v-model="dialogEliminarSeccion" class="j-dialog">
      <q-card class="q-pa-md text-center">
        <q-card-section>
          <div class="text-h6">Eliminar sección</div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <q-avatar round size="100px" font-size="80px" color="negative" text-color="white" icon="close" />
        </q-card-section>
        <q-card-section>
          ¿Estás seguro de que quieres eliminar "<span class="text-weight-bold">{{ selectedSeccion.nombre }}</span>"? Esta
          acción no se puede deshacer.
        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Eliminar" color="negative" @click="handleEliminarSeccion(selectedSeccion.id)"
            :loading="isLoadingEliminarSeccion" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-splitter>
</template>

<style lang="scss">
.q-table__container.text-wrap th,
.q-table__container.text-wrap td {
  white-space: break-spaces !important;
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

</style>

<script setup>

import { ref, reactive, watch, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { qNotify } from 'src/boot/jardines';

// Components
import QTabPanelContratosContent from 'src/components/configuracion/QTabPanelContratosContent.vue';
import QTabPanelProductosContent from 'src/components/configuracion/QTabPanelProductosContent.vue';
import QTabPanelConfiguracionContent from 'src/components/configuracion/QTabPanelConfiguracionContent.vue';

const $q = useQuasar()

const tab = ref('configuracion')
const splitterModel = ref(20)
const selectedEmpresa = ref(null)

/**
 * EMPRESAS
 */

// Agregar empresa
const dialogAgregarEmpresa = ref(false)
const isLoadingAgregarEmpresa = ref(false)
const agregarEmpresaData = reactive({
  razon_social: null,
  rif: null,
  tipo_actividad: null,
})
const tiposEmpresa = [
  {
    label: "Venta de parcelas",
    value: "venta_parcelas"
  },
  {
    label: "Matenimiento",
    value: "mantenimiento_parcelas"
  },
]

const handleAgregarEmpresa = () => {
  isLoadingAgregarEmpresa.value = true
  let postData = { ...agregarEmpresaData }

  api.post('empresas', postData)
    .then(response => {
      if (response.data) {
        Object.keys(agregarEmpresaData).forEach((i) => agregarEmpresaData[i] = null)
        dialogAgregarEmpresa.value = false
        $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
        empresas.value.push(response.data)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingAgregarEmpresa.value = false)
}

// Editar empresa
const dialogEditarEmpresa = ref(false)
const isLoadingEditarEmpresa = ref(false)
const editarEmpresaData = reactive({
  id: null,
  razon_social: null,
  rif: null,
  tipo_actividad: null,
})

const openDialogEditarEmpresa = (id) => {
  let empresaData = empresas.value.find(row => row.id == id)
  Object.keys(empresaData).forEach((i) => {
    if (editarEmpresaData.hasOwnProperty(i)) editarEmpresaData[i] = empresaData[i]
  })
  dialogEditarEmpresa.value = true
}

const handleEditarEmpresa = () => {
  isLoadingEditarEmpresa.value = true
  let postData = { ...editarEmpresaData }

  api.post('empresas', postData)
    .then(response => {
      if (response.data) {
        Object.keys(editarEmpresaData).forEach((i) => editarEmpresaData[i] = null)
        dialogEditarEmpresa.value = false
        $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
        empresas.value.push(response.data)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingEditarEmpresa.value = false)
}

// Eliminar empresa
const dialogEliminarEmpresa = ref(false)
const isLoadingEliminarEmpresa = ref(false)
const openDialogEliminarEmpresa = (id) => {
  selectedEmpresa.value = empresas.value.find(row => row.id == id)
  dialogEliminarEmpresa.value = true
}

const handleEliminarEmpresa = (id) => {
  isLoadingEliminarEmpresa.value = true
  api.delete('empresas/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminarEmpresa.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        empresas.value = empresas.value.filter(empresa => empresa.id !== id)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingEliminarEmpresa.value = false)
}

const empresasColumnas = [
  { name: 'rif', label: 'RIF', align: 'left', field: 'rif', sortable: true },
  { name: 'razon_social', label: 'Razón social', align: 'left', field: 'razon_social', sortable: true },
  { name: 'direccion', align: 'left', label: 'Dirección', field: 'direccion', sortable: true },
  {
    name: 'tipo_actividad', label: 'Actividad comercial', field: 'tipo_actividad', sortable: true,
    format: val => tiposEmpresa.find(tipo => tipo.value == val)?.label || val
  },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const empresas = ref([])

/**
 * AREAS
 */

 const areasColumnas = [
  { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const areas = ref([])
const areasOptions = [];

// Agregar o editar seccion
const dialogAgregarEditarArea = ref(false)
const isLoadingAgregarEditarArea = ref(false);

const agregarEditarAreaData = reactive({
  id: null,
  codigo_seccion: null,
  nombre: null,
  descripcion: null,
})

const handleAgregarEditarArea = () => {
  isLoadingAgregarEditarArea.value = true
  let postData = { ...agregarEditarAreaData }

  if (postData.id) {

    $q.notify({ message: 'Editado!! exitosamente.', color: 'positive' })

  } else {

    api.post('areas', postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarEditarAreaData).forEach((i) => agregarEditarAreaData[i] = null)
          dialogAgregarEditarArea.value = false
          $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
          areas.value.push(response.data)
        }
      })
      .catch(error => qNotify(error, 'error', { callback: handleAgregarEditarArea } ))
      .finally(() => isLoadingAgregarEditarArea.value = false)

  }

}

const openDialogAgregarArea = (id) => {
  Object.keys(agregarEditarAreaData).forEach((i) => agregarEditarAreaData[i] = null)
  dialogAgregarEditarArea.value = true
}

const openDialogEditarArea = (id) => {
  let seccionData = areas.value.find(row => row.id == id)
  seccionData.id = id
  Object.keys(seccionData).forEach((i) => {
    if (agregarEditarAreaData.hasOwnProperty(i)) agregarEditarAreaData[i] = seccionData[i]
  })
  dialogAgregarEditarArea.value = true
}

// Eliminar seccion
const selectedArea = ref(null)
const dialogEliminarArea = ref(false)
const isLoadingEliminarArea = ref(false)

const openDialogEliminarArea = (id) => {
  selectedArea.value = areas.value.find(row => row.id == id)
  dialogEliminarArea.value = true
}

const handleEliminarArea = (id) => {
  isLoadingEliminarArea.value = true
  api.delete('areas/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminarArea.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        areas.value = areas.value.filter(seccion => seccion.id !== id)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingEliminarArea.value = false)
}

/**
 * SECCIONES
 */

const seccionesColumnas = [
  { name: 'codigo_seccion', label: 'Código', align: 'left', field: 'codigo_seccion', sortable: true },
  { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
  { name: 'descripcion', align: 'left', label: 'Descripción', field: 'descripcion', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
]

const secciones = ref([])
const seccionesOptions = [];

// Agregar o editar seccion
const dialogAgregarEditarSeccion = ref(false)
const isLoadingAgregarEditarSeccion = ref(false);

const agregarEditarSeccionData = reactive({
  id: null,
  area_id: null,
  codigo_seccion: null,
  nombre: null,
  descripcion: null,
})

const handleAgregarEditarSeccion = () => {
  isLoadingAgregarEditarSeccion.value = true
  let postData = { ...agregarEditarSeccionData }

  console.log(postData);

  if (postData.id) {

    $q.notify({ message: 'Editado!! exitosamente.', color: 'positive' })

  } else {

    api.post('secciones', postData)
      .then(response => {
        if (response.data) {
          Object.keys(agregarEditarSeccionData).forEach((i) => agregarEditarSeccionData[i] = null)
          dialogAgregarEditarSeccion.value = false
          $q.notify({ message: 'Agregado exitosamente.', color: 'positive' })
          secciones.value.push(response.data)
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoadingAgregarEditarSeccion.value = false)

  }

}

const openDialogAgregarSeccion = (id) => {
  Object.keys(agregarEditarSeccionData).forEach((i) => agregarEditarSeccionData[i] = null)
  dialogAgregarEditarSeccion.value = true
}

const openDialogEditarSeccion = (id) => {
  let seccionData = secciones.value.find(row => row.id == id)
  seccionData.id = id
  Object.keys(seccionData).forEach((i) => {
    if (agregarEditarSeccionData.hasOwnProperty(i)) agregarEditarSeccionData[i] = seccionData[i]
  })
  dialogAgregarEditarSeccion.value = true
}

// Eliminar seccion
const selectedSeccion = ref(null)
const dialogEliminarSeccion = ref(false)
const isLoadingEliminarSeccion = ref(false)

const openDialogEliminarSeccion = (id) => {
  selectedSeccion.value = secciones.value.find(row => row.id == id)
  dialogEliminarSeccion.value = true
}

const handleEliminarSeccion = (id) => {
  isLoadingEliminarSeccion.value = true
  api.delete('secciones/' + id)
    .then(response => {
      if (response.data) {
        dialogEliminarSeccion.value = false
        $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
        secciones.value = secciones.value.filter(seccion => seccion.id !== id)
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoadingEliminarSeccion.value = false)
}

/**
 * LLAMADAS
 */

const isLoadingEmpresas = ref(true)
const isLoadingAreas = ref(true)
const isLoadingSecciones = ref(true)
const isLoadingParcelas = ref(true)

watch(areas, newAreas => {
  console.log(newAreas);
  areasOptions.splice(0, areasOptions.length)
  newAreas.forEach(area => {
    areasOptions.push(
      {
        label: area.nombre,
        value: area.id
      }
    );
  })

  console.log(areasOptions);
}, {deep: true})

watch(secciones, newSecciones => {
  seccionesOptions.splice(0, seccionesOptions.length)
  newSecciones.forEach(seccion => {
    seccionesOptions.push(
      {
        label: `${seccion.nombre} (${seccion.codigo_seccion})`,
        value: seccion.codigo_seccion
      }
    );
  })
}, {deep: true})

onMounted(() => {
  api.get('empresas')
    .then(response => {
      if (response.data) empresas.value = response.data;
    })
    .catch(e => console.log(e))
    .finally(() => isLoadingEmpresas.value = false)

  api.get('areas')
    .then(response => {
      if (response.data) {
        areas.value = response.data;
      }
    })
    .catch(e => console.log(e))
    .finally(() => isLoadingAreas.value = false)

  api.get('secciones')
    .then(response => {
      if (response.data) {
        secciones.value = response.data;
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
    .finally(() => isLoadingSecciones.value = false)

})

</script>
