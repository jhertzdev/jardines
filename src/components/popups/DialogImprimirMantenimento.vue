<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog j-dialog-xl">
    <q-card class="q-pa-md">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section class="q-pa-md">

          <q-markup-table dense style="max-height: 400px">
            <thead>
              <tr>
                <th colspan="6">
                  <q-input label="Resumen (ej: Mes de enero de 2024)" dense v-model="data.titles.resumen"></q-input>
                </th>
              </tr>
              <tr>
                <th colspan="5">
                  <q-input label="Título (ej: Parque Araguaney)" dense v-model="data.titles.titulo"></q-input>
                </th>
                <th colspan="1">
                  <q-input label="Subtítulo (ej: Semana 01/08/2024 al 04/08/2024)" dense v-model="data.titles.subtitulo"></q-input>
                </th>
              </tr>
              <tr>
                <th colspan="6" class="text-right">
                  <q-btn label="Ordenar por tipo de ubicación" class="q-my-xs" size="sm" @click="ordenarPorParcelaUbicacion" color="primary" />
                </th>
              </tr>
              <tr>
                <th></th>
                <th class="text-left">Ubicación</th>
                <th class="text-left">Contrato</th>
                <th class="text-left">Asignado el</th>
                <th class="text-left">Vigente hasta</th>
                <th class="text-left">Difunto(s)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in data.ids ?? []" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td>
                  {{ row.ubicacion.codigo_parcela }}
                </td>
                <td>{{ (row.ubicacion.contratos
                  .filter(c => c.estatus == 'Activo')
                  .map(c => c.num_contrato))
                  .sort().filter(function(item, pos, ary) {
                    return !pos || item != ary[pos - 1];
                  }).join(', ') }}
                </td>
                <td>
                  <template v-if="row.created_at && new Date(row.created_at) != 'Invalid Date'">
                    {{ format(row.created_at, 'dd/MM/yyyy') }}
                  </template>
                  <template v-else>
                    <span>-</span>
                  </template>
                </td>
                <td>
                  <template v-if="row.ubicacion.vigente_hasta && new Date(row.ubicacion.vigente_hasta) != 'Invalid Date'">
                    {{ format(row.ubicacion.vigente_hasta, 'dd/MM/yyyy') }}
                  </template>
                  <template v-else>
                    <span>-</span>
                  </template>
                </td>
                <td>
                  <ol class="q-my-none q-pl-sm">
                    <li v-for="puesto in row.ubicacion?.puestos?.filter(p => !!parseInt(p.ocupado))">
                      {{ puesto.ocupante_nombre }}
                    </li>
                  </ol>
                  <div v-if="!row.ubicacion?.puestos?.filter(p => !!parseInt(p.ocupado)).length">--</div>
                </td>
              </tr>
            </tbody>
          </q-markup-table>

        </q-card-section>

        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Imprimir" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

import { format, getDate, getMonth, getYear, lastDayOfMonth } from 'date-fns';

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const data = reactive({
  ids: [],
  lista: null,
  titles: {}
})

const ordenarPorParcelaUbicacion = () => {
  data.ids = data.ids.sort(function(a, b) {
    return b.ubicacion.tipo_parcela.tipo_parcela.localeCompare(a.ubicacion.tipo_parcela.tipo_parcela) ||
      a.ubicacion.codigo_seccion.localeCompare(b.ubicacion.codigo_seccion) ||
      a.ubicacion.num_parcela - b.ubicacion.num_parcela;
  });
}

const props = defineProps({
  ids: {
    type: Array,
    required: false,
    default: () => [],
  },
  lista: {
    type: Number,
    required: false,
    default: null,
  },
})

watch(props, () => {
  data.lista = props.lista
  data.ids = props.ids || []
}, { deep: true })


const handleSubmit = () => {

  let endpoint = 'mantenimiento/imprimir';

  const searchParams = new URLSearchParams();

  if (data.ids.length) {
    searchParams.append('id', data.ids.map(row => row.id).join(','));
  }

  for(let key in data.titles) {
    searchParams.append(key, data.titles[key]);
  }

  endpoint += '?' + searchParams.toString();

  api
    .get(endpoint, { responseType: "blob" })
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

}

const openDialog = (listaId) => {

  if (!!parseInt(listaId)) {
    data.lista = parseInt(listaId)

    api.get('mantenimiento/listas/' + props.lista)
      .then(response => {
        if (response.data) {
          data.titles.resumen = response.data.resumen
          data.titles.titulo = response.data.titulo
          data.titles.subtitulo = response.data.subtitulo
        }
      })

    api.get(`mantenimiento?f[lista_id]=${props.lista}&rowsPerPage=-1&sortBy=orden&order=ASC`)
      .then(response => {
        if (response.data) {
          data.ids = response.data.data
          dialog.value = true
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoadingSubmit.value = false)
  } else if (data.ids.length) {
    dialog.value = true
  } else {
    qNotify('Debe seleccionar una lista o un listado de mantenimientos.', 'error')
  }


}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
