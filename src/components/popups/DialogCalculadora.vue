<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-lg" @keydown.enter="handleCopyClipboard">
    <q-card class="q-pa-md">
      <q-card-section class="flex items-center justify-between">
        <div class="text-h6">
          <q-icon name="calculate" size="sm" color="primary"></q-icon> Calculadora de servicios
        </div>
        <span>Tasa BCV: <q-badge class="text-h6 q-ml-xs">{{ tasa }}</q-badge></span>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div class="col-12">
            <q-select dense v-model="selectedProduct"
              :options="filteredProductos"
              label="Producto"
              option-label="nombre_producto"
              option-value="id"
              clearable outlined use-input
              @filter="filterFn"
              fill-input input-debounce="0"
            />
          </div>
          <div class="col">
            <q-input dense type="number" min="1" v-model="calculoData.cantidad" :label="!!parseInt(selectedProduct?.requiere_ubicaciones) ? 'Ubicaciones' : 'Cantidad'" outlined />
          </div>
          <div class="col" v-if="!!parseInt(selectedProduct?.pagable_cuotas)">
            <q-input dense class="bg-green-1" type="number" min="1" v-model="calculoData.cuotas" label="Cuotas" outlined autofocus placeholder="1" stack-label />
          </div>
          <div class="col-auto">
            <q-input dense min="1" step="0.01" :model-value="$dinero(parseFloat(precios.precio_ref) || 0)" label="Precio ($)" outlined readonly />
          </div>
          <div class="col-auto">
            <q-input dense min="1" step="0.01" :model-value="$dinero(parseFloat(precios.precio_total) || 0)" label="Precio (Bs.)" outlined readonly />
          </div>
        </div>
        <div class="row q-mt-sm">
          <div class="col-12">
            <q-input type="textarea" class="no-resize" outlined v-model="calculoData.descripcion" rows="4" label="Descripción del servicio">
              <template v-slot:append>
                <q-btn dense flat icon="content_copy" color="primary" @click="handleCopyClipboard" label="Copiar" size="sm"/>
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch} from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { useAppStore } from 'src/stores/app.store';
import { $dinero } from 'src/boot/jardines';

const $q = useQuasar()
const dialog = ref(false)
const productos = ref([])
const filteredProductos = ref([])
const selectedProduct = ref(null)
const appStore = useAppStore()

const tasa = computed(() => {
  // Seleccionar la tasa de la moneda que contenga "Bs" en el símbolo
  let nuevaTasa = appStore.monedas.find(moneda => moneda.simbolo.includes('Bs'))?.tasa || 1
  return Number(nuevaTasa)
})

const precios = computed(() => {
  let precioLinea = Number(selectedProduct.value?.precio_ref) * (calculoData.value?.cantidad || 1)

  let pagableCuotas = false;

  if (parseInt(selectedProduct.value?.pagable_cuotas)) {
    pagableCuotas = true;
    precioLinea = precioLinea / 12 * (calculoData.value?.cuotas || 1)
  }

  let precioRef = precioLinea.toFixed(2) || '';
  let precioTotal = precioLinea ? (precioLinea * tasa.value).toFixed(2) : '';

  if (selectedProduct.value) {
    let cuotasString = ':';

    if (pagableCuotas) {
      cuotasString = calculoData.value?.cuotas > 1 ? ` × ${calculoData.value.cuotas} meses:` : ' × 1 mes:';
    }

    calculoData.value.descripcion = `Tasa BCV de hoy: *${tasa.value.toFixed(2)}*\n\n${selectedProduct.value.nombre_producto}${cuotasString}\n*${$dinero(parseFloat(precioRef) || 0)}$ (${$dinero(parseFloat(precioTotal) || 0)} Bs.)*`;
  }

  return {
    precio_ref: precioRef,
    precio_total: precioTotal,
  }
})

const calculoData = ref({
  cantidad: 1,
  cuotas: null,
  descripcion: '',
})

const openDialog = () => {
  dialog.value = true;

  api.get('servicios')
    .then(response => {
      if (response.data) {
        productos.value = response.data
        selectedProduct.value = productos.value.find(p => p.nombre_producto == 'Mantenimiento de parcelas')
      }
    })
}

const filterFn = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase()
    filteredProductos.value = productos.value.filter(v => v?.nombre_producto.toLowerCase().indexOf(needle) > -1)
  })
}

const handleCopyClipboard = () => {
  $q.notify({
    message: 'Copiado al portapapeles.',
    color: 'positive',
    icon: 'content_copy',
  })

  navigator.clipboard.writeText(calculoData.value.descripcion)
}

onMounted(() => {
  appStore.getMonedas()
})

defineExpose({ openDialog })
</script>
