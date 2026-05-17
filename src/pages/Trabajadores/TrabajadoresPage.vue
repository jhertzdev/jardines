<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md items-center q-mb-md">
      <div class="col-grow">
        <div class="text-h5 text-primary">Gestión de Personal</div>
        <div class="text-subtitle2 text-grey-7">Listado de trabajadores y aspirantes</div>
      </div>
      <div class="col-auto">
        <q-btn label="Agregar Personal" icon="add" color="primary" @click="openDialogAgregarTrabajador" unelevated />
      </div>
    </div>

    <q-separator class="q-my-lg" />

    <div class="q-pb-lg text-center" v-if="isLoading">
      <q-spinner size="xl" color="primary" />
    </div>

    <div v-else>
      <div class="row items-center q-mb-md q-gutter-sm">
        <q-btn-toggle v-model="currentFilter" spread no-caps toggle-color="primary" color="white" text-color="black"
          unelevated border :options="filterOptions" class="j-filter-toggle shadow-1" />
        <q-spacer />
        <q-input dense debounce="300" v-model="filter" placeholder="Buscar..." outlined class="bg-white">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <q-table :rows="filteredTrabajadores" :columns="columns" row-key="id" :filter="filter"
        :filter-method="customFilter" :loading="isLoading" :visible-columns="visibleColumnNames"
        v-model:pagination="trabajadoresTablePagination" class="j-table-premium shadow-2 rounded-borders">
        <template v-slot:body-cell-nombre_completo="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{ props.row.nombre }} {{ props.row.apellido }}</div>
            <div class="text-caption text-grey-7">{{ props.row.cedula }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-tipo="props">
          <q-td :props="props">
            {{ props.row.tipo.charAt(0).toUpperCase() + props.row.tipo.slice(1) }}
          </q-td>
        </template>

        <template v-slot:body-cell-estatus="props">
          <q-td :props="props">
            <q-badge :color="props.row.estatus === 'activo' ? 'positive' : 'negative'"
              :label="props.row.estatus ? props.row.estatus.toUpperCase() : ''" />
          </q-td>
        </template>

        <template v-slot:body-cell-etiqueta="props">
          <q-td :props="props">
            <q-badge v-if="props.row.etiqueta_texto" :style="{ backgroundColor: props.row.color_etiqueta || '#eee' }"
              text-color="white">
              {{ props.row.etiqueta_texto }}
            </q-badge>
            <span v-else>-</span>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-btn flat round icon="description" size="sm" color="grey-8" @click="openFichaTecnica(props.row)">
              <q-tooltip>Ver Ficha Técnica</q-tooltip>
            </q-btn>
            <q-btn flat round icon="edit" size="sm" color="blue" @click="openDialogEditarTrabajador(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat round icon="delete" size="sm" color="negative" @click="confirmEliminar(props.row)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Dialogo Agregar/Editar -->
    <q-dialog v-model="dialogFormData.visible" persistent position="right" maximized>
      <q-card style="width: 500px; max-width: 90vw;">
        <q-form @submit="handleSaveTrabajador">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">{{ dialogFormData.isEdit ? 'Editar' : 'Agregar' }} Personal</div>
            <q-spacer />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-separator class="q-my-sm" />

          <q-card-section class="q-gutter-y-sm scroll" style="height: calc(100vh - 150px)">
            <div class="text-subtitle2 text-primary">Información Básica</div>
            <div class="row q-col-gutter-sm">
              <q-input class="col-6" outlined v-model="formData.nombre" label="Nombre *" dense
                :rules="[val => !!val || 'Requerido']" hide-bottom-space />
              <q-input class="col-6" outlined v-model="formData.apellido" label="Apellido *" dense
                :rules="[val => !!val || 'Requerido']" hide-bottom-space />
            </div>
            <q-input outlined v-model="formData.cedula" label="Cédula / ID *" dense
              :rules="[val => !!val || 'Requerido']" hide-bottom-space />
            <q-input outlined v-model="formData.rif" label="RIF" dense />
            <q-input class="q-mb-sm" outlined v-model="formData.direccion" label="Dirección" dense type="textarea"
              rows="2" />

            <div class="row q-col-gutter-sm">
              <q-input class="col-6" outlined v-model="formData.telefono" label="Teléfono" dense />
              <q-input class="col-6" outlined v-model="formData.correo" label="Correo" dense type="email" />
            </div>

            <q-input outlined v-model="formData.fecha_nacimiento" label="Fecha de nacimiento" dense type="date"
              stack-label />

            <q-input outlined v-model="formData.datos_bancarios" label="Datos Bancarios" dense type="textarea"
              rows="2" />

            <q-separator class="q-my-md" />
            <div class="text-subtitle2 text-primary">Detalles Contractuales</div>

            <div class="row q-col-gutter-sm">
              <q-select class="col-6" outlined v-model="formData.tipo" :options="tipoOptions" label="Tipo *" dense
                emit-value map-options :rules="[val => !!val || 'Requerido']" hide-bottom-space />
              <q-select v-if="formData.tipo !== 'aspirante'" class="col-6" outlined v-model="formData.estatus"
                :options="estatusOptions" label="Estatus *" dense emit-value map-options
                :rules="[val => !!val || 'Requerido']" hide-bottom-space />
            </div>

            <!-- Campos condicionales para Trabajador -->
            <q-slide-transition>
              <div v-if="formData.tipo === 'trabajador'" class="q-gutter-y-sm">
                <div class="row q-col-gutter-sm">
                  <q-input class="col-6" outlined v-model="formData.fecha_ingreso" label="Fecha de Ingreso" dense
                    type="date" stack-label />
                  <q-input class="col-6" outlined v-model="formData.fecha_egreso" label="Fecha de Egreso" dense
                    type="date" stack-label :disable="formData.estatus === 'activo'" />
                </div>
              </div>
            </q-slide-transition>

            <q-input v-if="formData.estatus === 'inactivo'" outlined v-model="formData.motivo_inactividad"
              label="Motivo de Inactividad" dense type="textarea" rows="2" />

            <q-separator class="q-my-md" />
            <div class="text-subtitle2 text-primary">Personalización</div>
            <div class="row q-col-gutter-sm items-center">
              <q-input class="col-grow" outlined v-model="formData.etiqueta_texto" label="Texto de etiqueta" dense />
              <div class="col-auto">
                <q-btn icon="colorize" :style="{ backgroundColor: formData.color_etiqueta || '#888' }">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-color v-model="formData.color_etiqueta" no-header no-footer default-view="palette" :palette="[
                      '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
                      '#FFEB3B', '#607D8B', '#F44336', '#8BC34A', '#3F51B5'
                    ]" />
                  </q-popup-proxy>
                </q-btn>
              </div>
            </div>

            <q-input outlined v-model="formData.observaciones" label="Observaciones" dense type="textarea" rows="3" />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn type="submit" :label="dialogFormData.isEdit ? 'Actualizar' : 'Guardar'" color="primary" unelevated
              :loading="isLoadingSave" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Ficha Técnica -->
    <q-dialog v-model="fichaVisible">
      <q-card id="print-area-wrapper" style="width: 700px; max-width: 95vw;">
        <q-card-section class="bg-primary text-white row justify-between">
          <div class="text-h6">FICHA TÉCNICA DE PERSONAL</div>
          <q-spacer />
          <div>
            <q-btn icon="print" flat round dense @click="printFicha" />
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="q-pa-lg" id="print-area">
          <div class="row q-col-gutter-lg" v-if="selectedWorker">
            <div class="col-4 text-center">
              <div class="text-h6 q-mt-md">{{ selectedWorker.nombre }} {{ selectedWorker.apellido }}</div>
              <div class="text-subtitle2 text-grey-7">{{ selectedWorker.cedula }}</div>
              <div class="text-subtitle2 text-grey-7" v-if="selectedWorker.rif">RIF: {{ selectedWorker.rif }}</div>

              <div class="q-mt-sm">
                <q-chip :label="selectedWorker.tipo ? selectedWorker.tipo.toUpperCase() : ''"
                  :color="selectedWorker.tipo === 'trabajador' ? 'blue' : 'orange'" text-color="white" />
              </div>

              <div v-if="selectedWorker.tipo === 'trabajador'">
                <q-chip :label="selectedWorker.estatus?.toUpperCase()"
                  :color="selectedWorker.estatus === 'activo' ? 'green' : 'red'" text-color="white" />
              </div>
            </div>

            <div class="col-8">
              <div class="text-overline text-primary">Datos personales</div>
              <q-list dense>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Correo electrónico</q-item-label>
                    <q-item-label>{{ selectedWorker.correo || 'N/A' }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Teléfono</q-item-label>
                    <q-item-label>{{ selectedWorker.telefono || 'N/A' }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Fecha de nacimiento</q-item-label>
                    <q-item-label>{{ ensureDateString(selectedWorker.fecha_nacimiento) || 'N/A' }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Dirección</q-item-label>
                    <q-item-label>{{ selectedWorker.direccion || 'No especificada' }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator class="q-my-md" />
              <div class="text-overline text-primary">Información laboral</div>
              <q-list dense>
                <q-item v-if="selectedWorker.tipo !== 'aspirante'">
                  <q-item-section>
                    <q-item-label caption>Estatus actual</q-item-label>
                    <q-item-label>
                      <q-badge :color="selectedWorker.estatus === 'activo' ? 'positive' : 'negative'">
                        {{ selectedWorker.estatus ? selectedWorker.estatus.toUpperCase() : '' }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-if="selectedWorker.tipo === 'trabajador'">
                  <q-item-section>
                    <q-item-label caption>Fecha de ingreso</q-item-label>
                    <q-item-label>{{ ensureDateString(selectedWorker.fecha_ingreso) || 'N/A' }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-if="selectedWorker.tipo === 'trabajador' && selectedWorker.estatus !== 'activo'">
                  <q-item-section>
                    <q-item-label caption>Fecha de egreso</q-item-label>
                    <q-item-label>{{ ensureDateString(selectedWorker.fecha_egreso) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-if="selectedWorker.motivo_inactividad">
                  <q-item-section>
                    <q-item-label caption>Motivo de inactividad</q-item-label>
                    <q-item-label>{{ selectedWorker.motivo_inactividad }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="col-12" v-if="selectedWorker.observaciones">
              <q-separator class="q-my-sm" />
              <div class="text-overline text-primary">Observaciones</div>
              <div class="q-pa-sm bg-grey-1 rounded-borders">
                {{ selectedWorker.observaciones }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Confirmación Eliminar -->
    <q-dialog v-model="confirmDeleteVisible">
      <q-card v-if="workerToDelete">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">
            ¿Está seguro de que desea eliminar a <strong>{{ workerToDelete.nombre }} {{ workerToDelete.apellido
            }}</strong>?
          </span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="handleDeleteTrabajador" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { api } from "src/boot/axios"
import { useQuasar } from "quasar"
import { qNotify } from 'src/boot/jardines'

const $q = useQuasar()

const trabajadores = ref([])
const isLoading = ref(true)
const isLoadingSave = ref(false)
const filter = ref('')
const currentFilter = ref('todos')

const customFilter = (rows, terms, cols, scope) => {
  const lowerTerms = terms.toLowerCase()

  return rows.filter(row => {
    const nombreCompleto = `${row.nombre} ${row.apellido}`.toLowerCase()
    const telefono = (row.telefono || '').toLowerCase()
    const correo = (row.correo || '').toLowerCase()
    const cedula = (row.cedula || '').toLowerCase()
    const rif = (row.rif || '').toLowerCase()
    const direccion = (row.direccion || '').toLowerCase()
    const observaciones = (row.observaciones || '').toLowerCase()
    const etiquetaTexto = (row.etiqueta_texto || '').toLowerCase()

    return (
      nombreCompleto.includes(lowerTerms) ||
      telefono.includes(lowerTerms) ||
      correo.includes(lowerTerms) ||
      cedula.includes(lowerTerms) ||
      rif.includes(lowerTerms) ||
      direccion.includes(lowerTerms) ||
      observaciones.includes(lowerTerms) ||
      etiquetaTexto.includes(lowerTerms)
    )
  })
}

const trabajadoresTablePagination = ref({
  page: 1,
  rowsPerPage: 20,
  sortBy: 'nombre_completo',
  descending: false,
})

const columns = [
  { name: 'nombre_completo', label: 'Nombre completo', align: 'left', sortable: true, field: row => `${row.nombre} ${row.apellido}` },
  { name: 'tipo', label: 'Tipo', align: 'center', field: 'tipo', sortable: true },
  { name: 'telefono', label: 'Teléfono', align: 'left', field: 'telefono' },
  { name: 'correo', label: 'Correo', align: 'left', field: 'correo' },
  { name: 'observaciones', label: 'Observaciones', align: 'left', field: 'observaciones', style: 'max-width: 150px', classes: 'ellipsis' },
  { name: 'estatus', label: 'Estatus', align: 'center', field: 'estatus', sortable: true },
  { name: 'etiqueta', label: 'Etiqueta', align: 'center', field: 'etiqueta_texto' },
  { name: 'actions', label: 'Acciones', align: 'right' }
]

const visibleColumnNames = computed(() => {
  const names = columns.map(c => c.name)
  if (['aspirante', 'otros'].includes(currentFilter.value)) {
    return names.filter(n => n !== 'estatus')
  }
  return names
})

const tipoOptions = [
  { label: 'Trabajador', value: 'trabajador' },
  { label: 'Aspirante', value: 'aspirante' },
  { label: 'Otro', value: 'otro' }
]

const estatusOptions = [
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' }
]

// Date flattening helper
const ensureDateString = (val, format = 'DMY') => {
  if (!val) return ''

  let rawDate = ''

  // 1. Extraemos solo la parte de la fecha (YYYY-MM-DD)
  if (typeof val === 'object' && val.date) {
    if (val.date.startsWith('-0001')) return ''
    rawDate = val.date.split(' ')[0]
  } else if (typeof val === 'string') {
    rawDate = val.split(' ')[0]
  } else {
    return val
  }

  // 2. Reordenamos de YYYY-MM-DD a DD/MM/YYYY
  // Esto funciona tanto si viene con "-" como con "/"
  const parts = rawDate.split(/[-/]/)

  if (format === 'DMY') {
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
  } else if (format === 'YMD') {
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${year}-${month}-${day}`
    }
  }

  return rawDate // Retorno de seguridad si el formato no es el esperado
}

const filterOptions = computed(() => {
  const counts = {
    todos: trabajadores.value.length,
    trabajador: trabajadores.value.filter(t => t.tipo === 'trabajador').length,
    aspirante: trabajadores.value.filter(t => t.tipo === 'aspirante').length,
    otros: trabajadores.value.filter(t => !['trabajador', 'aspirante'].includes(t.tipo)).length
  }

  return [
    { label: `Todos (${counts.todos})`, value: 'todos' },
    { label: `Trabajadores (${counts.trabajador})`, value: 'trabajador' },
    { label: `Aspirantes (${counts.aspirante})`, value: 'aspirante' },
    { label: `Otros (${counts.otros})`, value: 'otros' }
  ]
})

const filteredTrabajadores = computed(() => {
  if (currentFilter.value === 'todos') return trabajadores.value
  if (currentFilter.value === 'otros') {
    return trabajadores.value.filter(t => !['trabajador', 'aspirante'].includes(t.tipo))
  }
  return trabajadores.value.filter(t => t.tipo === currentFilter.value)
})

const dialogFormData = reactive({
  visible: false,
  isEdit: false
})

const initialForm = {
  id: null,
  nombre: '',
  apellido: '',
  cedula: '',
  rif: '',
  direccion: '',
  fecha_nacimiento: '',
  fecha_ingreso: '',
  fecha_egreso: '',
  telefono: '',
  correo: '',
  tipo: 'trabajador',
  estatus: 'activo',
  motivo_inactividad: '',
  datos_bancarios: '',
  observaciones: '',
  color_etiqueta: '#1976D2',
  etiqueta_texto: ''
}

const formData = reactive({ ...initialForm })

const openDialogAgregarTrabajador = () => {
  window.dispatchEvent(new CustomEvent('closeSearchBar'))
  Object.assign(formData, initialForm)
  dialogFormData.isEdit = false
  dialogFormData.visible = true
}

const openDialogEditarTrabajador = (row) => {
  // Ensure dates are strings for the HTML input type="date"
  const cleanedRow = { ...row }
  cleanedRow.fecha_nacimiento = ensureDateString(row.fecha_nacimiento, 'YMD')
  cleanedRow.fecha_ingreso = ensureDateString(row.fecha_ingreso, 'YMD')
  cleanedRow.fecha_egreso = ensureDateString(row.fecha_egreso, 'YMD')

  Object.assign(formData, cleanedRow)
  dialogFormData.isEdit = true
  dialogFormData.visible = true
}

const handleSaveTrabajador = async () => {
  isLoadingSave.value = true
  try {
    const isUpdate = !!formData.id
    const url = isUpdate ? `trabajadores/${formData.id}` : 'trabajadores'

    // Final check to ensure we don't send objects accidentally
    const payload = { ...formData }
    payload.fecha_nacimiento = ensureDateString(payload.fecha_nacimiento, 'YMD')
    payload.fecha_ingreso = ensureDateString(payload.fecha_ingreso, 'YMD')
    payload.fecha_egreso = ensureDateString(payload.fecha_egreso, 'YMD')

    let response;
    if (isUpdate) {
      response = await api.put(url, payload)
    } else {
      response = await api.post(url, payload)
    }

    if (isUpdate) {
      const index = trabajadores.value.findIndex(t => t.id === formData.id)
      if (index !== -1) trabajadores.value[index] = response.data
    } else {
      trabajadores.value.push(response.data)
    }

    $q.notify({
      color: 'positive',
      message: `Personal ${isUpdate ? 'actualizado' : 'agregado'} con éxito`,
      icon: 'check'
    })
    dialogFormData.visible = false
  } catch (error) {
    qNotify(error, 'error')
  } finally {
    isLoadingSave.value = false
  }
}

const workerToDelete = ref(null)
const confirmDeleteVisible = ref(false)
const confirmEliminar = (row) => {
  workerToDelete.value = row
  confirmDeleteVisible.value = true
}

const handleDeleteTrabajador = async () => {
  if (!workerToDelete.value) return
  try {
    await api.delete(`trabajadores/${workerToDelete.value.id}`)
    trabajadores.value = trabajadores.value.filter(t => t.id !== workerToDelete.value.id)
    $q.notify({
      color: 'positive',
      message: 'Registro eliminado',
      icon: 'delete'
    })
  } catch (error) {
    qNotify(error)
  }
}

const selectedWorker = ref(null)
const fichaVisible = ref(false)

const openFichaTecnica = (row) => {
  selectedWorker.value = row
  fichaVisible.value = true
}

const printFicha = () => {
  if (!selectedWorker.value) return

  const win = window.open('', '_blank')
  const worker = selectedWorker.value

  // Mapeo de campos a etiquetas legibles
  const fieldLabels = {
    nombre: 'Nombre',
    apellido: 'Apellido',
    cedula: 'Cédula',
    rif: 'RIF',
    direccion: 'Dirección',
    fecha_nacimiento: 'Fecha de nacimiento',
    fecha_ingreso: 'Fecha de ingreso',
    fecha_egreso: 'Fecha de egreso',
    telefono: 'Teléfono',
    correo: 'Correo electrónico',
    tipo: 'Tipo',
    estatus: 'Estatus',
    motivo_inactividad: 'Motivo de inactividad',
    datos_bancarios: 'Datos bancarios',
    observaciones: 'Observaciones',
    etiqueta_texto: 'Etiqueta'
  }

  // Construir las filas de la tabla
  let rowsHtml = ''
  Object.keys(fieldLabels).forEach(key => {
    let val = worker[key]

    // Formateo de fechas
    if (key.includes('fecha_')) {
      val = ensureDateString(val)
    }

    // Formateo de estatus/tipo
    if (key === 'estatus' || key === 'tipo') {
      val = val ? val.toUpperCase() : 'N/A'
    }

    rowsHtml += `
      <tr>
        <th>${fieldLabels[key]}</th>
        <td>${val || 'N/A'}</td>
      </tr>
    `
  })

  console.log('Worker', worker)

  const closeScript = '<' + '/script>'

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ficha Técnica - ${worker.nombre} ${worker.apellido}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h2 { border-bottom: 2px solid #000; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #eee; width: 30%; }
      </style>
    </head>
    <body>
      <h2>FICHA TÉCNICA - ${worker.nombre} ${worker.apellido} (${worker.cedula})</h2>
      <p>Generado el: ${new Date().toLocaleString()}</p>
      
      <table>
        ${rowsHtml}
      </table>

      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 300);
        }
      ${closeScript}
    </body>
    </html>
  `

  win.document.write(html)
  win.document.close()
}

const loadTrabajadores = async () => {
  isLoading.value = true
  try {
    const response = await api.get('trabajadores')
    trabajadores.value = response.data
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadTrabajadores)
</script>

<style scoped>
.j-table-premium {
  border-radius: 12px;
}

.j-filter-toggle {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.j-filter-toggle :deep(.q-btn) {
  white-space: nowrap;
}

.q-list--dense>.q-item,
.q-item--dense {
  padding: 2px 2px;
}
</style>
