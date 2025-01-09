<template>

<div class="flex justify-end q-mb-md">
  <q-btn icon="print" color="primary" label="Imprimir" size="sm" @click="handleDescargarReporteIngresos"></q-btn>
</div>

<q-markup-table flat bordered separator="cell" wrap-cells class="results-table q-mb-sm">
  <thead>
    <tr>
      <th>Fecha</th>
      <th>Método de pago</th>
      <th>Efectivo ($)</th>
      <th>Ingreso Bs.</th>
      <th>Tasa BCV</th>
      <th>Conversión en $</th>
    </tr>
  </thead>
  <tbody>

    <tr v-for="(ingreso, fecha) in ingresos?.ingresos || []" :key="ingreso.id">
      <td>{{ fecha }}</td>
      <td>
        {{ $dinero(ingreso.totales['Transferencia']['$']) }}
      </td>
      <td>
        {{ $dinero(ingreso.totales['Efectivo']['$']) }}
      </td>
      <td>
        {{ $dinero(ingreso.totales['Bs.']) }}
      </td>
      <td>
        {{ $dinero(ingreso.tasa) }}
      </td>
      <td>
        {{ $dinero(ingreso.totales['Bs.'] / ingreso.tasa) }}
      </td>
    </tr>


  </tbody>
</q-markup-table>

</template>

<script setup>

import { ref, reactive, onMounted, computed } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify, $dinero, $bs, $usd, $toFixed } from 'src/boot/jardines';
import { useQuasar } from "quasar";
import { useAppStore } from 'src/stores/app.store';

const router = useRouter()
const $q = useQuasar()
const appStore = useAppStore()

onMounted(() => {
  appStore.getMetodosDePago()
  appStore.getMonedas()
  getReporteIngresos()
})

const ingresos = ref([])

const tiposMetodo = computed(() => appStore.metodosDePago.reduce((a, c) => {
    if (!a.find(v => v.tipo_metodo === c.tipo_metodo)) {
      a.push(c);
    }
    return a;
  }, []).map(i => i.tipo_metodo)
);

function getReporteIngresos() {
  api.get(`caja/reportes/ingresos?&tipo=mensual&mes=2024-10`)
    .then(response => {
      console.log(response);
      if (response.data) {
        ingresos.value = response.data
      }
    })
    .catch(e => console.log(e))
}

const handleDescargarReporteIngresos = () => {
  api.get(`caja/reportes/ingresos?caja_id=${appStore.cajaSeleccionada.id}&tipo=ultimo&print=1`, { responseType: "blob" })
  .then((response) => {
    console.log(response);
    window.open(URL.createObjectURL(response.data));
  })
  .catch(async (error) => {
    error.response.data = JSON.parse(await error.response.data.text());
    qNotify(error, "error", {
      callback: () => handleDescargarReporteIngresos(),
    });
  });
};

</script>
