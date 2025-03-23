<template>

<div class="flex justify-end q-mb-md">
  <q-btn icon="print" color="primary" label="Imprimir" size="sm" @click="handleDescargarReporteIngresos"></q-btn>
</div>

<q-markup-table separator="cell" wrap-cells class="results-table q-mb-sm">
  <thead>
    <tr>
      <th>N°</th>
      <th>Comprobante</th>
      <th># Cto.</th>
      <th>Nombre del cliente</th>
      <th>Doc. Identidad</th>
      <th>Método</th>
      <th>Referencia</th>
      <template v-for="metodo in tiposMetodo">
        <th v-for="moneda in appStore.monedas" :key="moneda.id" class="text-center">{{ metodo }} ({{ moneda.simbolo }})</th>
      </template>
    </tr>
  </thead>
  <tbody>

    <tr v-for="(ingreso, key) in ingresos?.ingresos || []" :key="ingreso.id">
      <td>{{ key + 1 }}</td>
      <td>{{ ingreso.num_transaccion }}</td>
      <td>{{ ingreso.num_contrato }}</td>
      <td>{{ ingreso.nombre_cliente }}</td>
      <td>{{ ingreso.ident_cliente }}</td>
      <td>{{ ingreso.metodo }}</td>
      <td>{{ ingreso.referencia }}</td>
      <template v-for="metodo in tiposMetodo">
        <td v-for="moneda in appStore.monedas" :key="moneda.id" class="text-center">
          <template v-if="ingreso.tipo_metodo === metodo && moneda.id == ingreso.moneda_id">
            {{ $dinero(ingreso.monto) }}
          </template>
        </td>
      </template>
    </tr>


  </tbody>
</q-markup-table>

</template>

<script setup>

import { ref, reactive, onMounted, computed } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { qNotify, $dinero } from 'src/boot/jardines';
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
  api.get(`caja/reportes/ingresos?caja_id=${appStore.cajaSeleccionada.id}&tipo=ultimo`)
    .then(response => {
      console.log(response);
      if (response.data) {
        ingresos.value = response.data
      }
    })
    .catch(e => {
      qNotify(e, 'error')
    })
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
