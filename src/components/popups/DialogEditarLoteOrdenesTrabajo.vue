<template>
  <!-- Crear cliente -->
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog">
    <q-card class="q-pa-md" style="width: 100%">
      <q-form @submit="handleSubmit" :class="isLoadingSubmit && 'form-disabled'" class="no-bottoms">
        <q-card-section>
          <div class="text-h6">{{ tituloLista || 'Editar lote' }}</div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm">
              <q-input :label="data.fecha_vencimiento ? 'Mes asignado' : 'Mes asignado: -- No cambiar --'" dense outlined v-model="data.fecha_vencimiento" mask="####-##" :hide-bottom-space="true" readonly clearable>
                <template v-slot:append>
                  <q-icon v-if="data.fecha_vencimiento" name="close" class="cursor-pointer" @click="data.fecha_vencimiento = ''"></q-icon>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="data.fecha_vencimiento" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                        @update:model-value="filterDateClosePopup = true" @navigation="filterDateClosePopup = false"
                        :default-year-month="(data.fecha_vencimiento || new Date().toISOString().substr(0, 7)).replace('-', '/')" years-in-month-view>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm">
              <q-select dense outlined v-model="data.estatus" :options="[
                {label: '-- No cambiar --', value: null},
                {label: 'Por entregar', value: 'Por entregar'},
                {label: 'Por ejecutar', value: 'Por ejecutar'},
                {label: 'Completado', value: 'Completado'},
                {label: 'Vencido', value: 'Vencido'}
              ]" @update:model-value="val => {
                if (val == null) {
                  data.fecha_completado = null;
                } else if (val != 'Completado') {
                  data.fecha_completado = null
                } else {
                  data.fecha_completado = format(new Date(), 'yyyy-MM-dd')
                }
              }" label="Estatus" stack-label emit-value map-options></q-select>
            </div>
            <div class="col-12 col-sm">
              <q-input dense outlined type="date" v-model="data.fecha_asignado" :label="data.fecha_asignado ? 'Fecha asignado' : 'Fecha asignado: -- No cambiar --'" stack-label clearable />
            </div>
            <div class="col-12 col-sm">
              <q-input dense outlined type="date" v-model="data.fecha_completado" label="Fecha completado" stack-label :readonly="data.estatus != 'Completado'" :disable="data.estatus != 'Completado'" clearable />
            </div>
          </div>
          <div class="row q-col-gutter-sm q-mt-xs">
            <div class="col">
              <q-select label="Lista de mantenimiento" dense outlined v-model="data.lista_id" :options="[
                  {
                    label: '-- No cambiar --',
                    value: null,
                  },
                  {
                    label: '-- Mantenimientos sin asignar --',
                    value: -1,
                  },
                  ...listasMantenimiento.map((lista) => {
                    return {
                      label: [lista.resumen, lista.titulo, lista.subtitulo]
                        .filter((el) => !!el)
                        .join(' - '),
                      value: lista.id,
                    };
                  }),
                ]" map-options emit-value map-option-label="resumen" stack-label>
              </q-select>
            </div>
            <div class="col-auto flex">
              <q-btn label="Ordenar por tipo de ubicación" size="sm" icon="sort" @click="ordenarPorParcelaUbicacion" color="primary" />
            </div>
          </div>
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-markup-table flat dense separator="cell">
              <thead>
                <tr>
                  <th></th>
                  <th class="text-left">Ubicación</th>
                  <th class="text-left">Puestos</th>
                  <th class="text-left">Notas internas</th>
                  <th class="text-left">Características</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in data.rows" :key="row.id">
                  <td>
                    {{ index + 1 }}
                    <q-btn icon="sort" dense size="sm" flat color="primary" v-if="!!selectedLista">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-card>
                          <q-card-section class="q-pa-sm flex column q-gutter-xs">
                            <q-btn icon="vertical_align_top" label="Al principio" dense outline size="sm" color="primary" @click="reordenar(index, 0)"></q-btn>
                            <q-btn icon="keyboard_arrow_up" label="Subir" dense outline size="sm" color="primary" @click="reordenar(index, index - 1)" :disabled="index === 0"></q-btn>
                            <q-btn icon="keyboard_arrow_down" label="Bajar" dense outline size="sm" color="primary" @click="reordenar(index, index + 1)" :disabled="index === data.rows.length - 1"></q-btn>
                            <q-btn icon="vertical_align_bottom" label="Al final" dense outline size="sm" color="primary" @click="reordenar(index, data.rows.length - 1)"></q-btn>
                          </q-card-section>
                        </q-card>
                      </q-popup-proxy>
                    </q-btn>
                  </td>
                  <td>{{ row.ubicacion }}</td>
                  <td style="max-width: 240px; white-space: break-spaces;">
                    <ol class="q-pl-md" v-if="row.difuntos?.length">
                      <li v-for="difunto in row.difuntos" style="white-space: break-spaces; font-size: 11px">
                        {{ difunto.ocupante_nombre }}
                      </li>
                    </ol>
                    <span class="text-grey-5 text-italic" v-else>-- Vacío --</span>
                  </td>
                  <td>
                    <q-input type="textarea" autogrow dense outlined v-model="row.notas" label="Notas internas" stack-label/>
                  </td>
                  <td>
                    <div class="row">
                      <div class="col" v-for="o in row.observaciones" :key="o.title">
                        <q-input dense outlined v-model="o.value" :label="o.title" stack-label :class="o.isLast && 'bg-yellow-3'" @update:model-value="o.isLast = null"/>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>

          </q-markup-table>

          <div class="text-right">
            <q-checkbox v-model="mantenerMarcados" label="Mantener marcadas al guardar" />
          </div>

        </q-card-section>
        <q-card-actions class="justify-end">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn type="submit" label="Guardar" icon="save" color="primary" :loading="isLoadingSubmit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { qNotify } from 'src/boot/jardines';

import { format, getDate, getMonth, getYear, lastDayOfMonth } from 'date-fns';

import QSelectUbicacion from '../selects/QSelectUbicacion.vue';

const $q = useQuasar()
const dialog = ref(false)
const isLoadingSubmit = ref(false)

const mantenerMarcados = ref(true)

const filterDateClosePopup = ref(false)

const nuevaPosicion = ref(null)

const data = ref({
  rows: [],
  fecha_vencimiento: null,
  fecha_completado: null,
  fecha_asignado: null,
  estatus: null,
  lista_id: null,
})

const observacionesPorTipoUbicacion = {
  Parcela: [
    { title: 'Observación', value: ''},
    { title: 'Base', value: ''},
    { title: 'Placas / Fotos / Letras', value: ''},
    { title: 'Grama', value: ''}
  ],
  Nicho: [
    { title: 'Observación', value: ''},
    { title: 'Placas / Nombre', value: ''},
    { title: 'Foto', value: ''},
  ],
  Columbario: [
    { title: 'Observación', value: ''},
    { title: 'Placas / Nombre', value: ''},
    { title: 'Foto', value: ''},
  ]
}

const handleSubmit = () => {

  let postData = JSON.parse(JSON.stringify(data.value))

  let keys = ['fecha_vencimiento', 'fecha_completado', 'fecha_asignado', 'estatus']

  keys.forEach(key => {
    if (postData[key] === null || postData[key] === '') delete postData[key];
  });

  if (postData.fecha_vencimiento?.length < 10) {
    postData.fecha_vencimiento = postData.fecha_vencimiento + '-01'
  }

  if (selectedLista.value) {
    postData.update_order = true;
  }

  console.log(postData)

  api.post('mantenimiento/editarLote', postData)
    .then(response => {

      console.log(response)

      if (response.data) {
        dialog.value = false
        data.value = {
          rows: [],
          fecha_vencimiento: null,
          fecha_completado: null,
          fecha_asignado: null,
          estatus: null,
        }

        $q.notify({ message: 'Actualizado exitosamente.', color: 'positive' })
        emit('updated', { mantener_marcados: mantenerMarcados.value, data: response.data })
      }
    })
    .catch(error => { console.log(error); qNotify(error, 'error', { callback: handleSubmit }) })
    .finally(() => isLoadingSubmit.value = false)
}

const ordenarPorParcelaUbicacion = () => {
  data.value.rows = data.value.rows.sort(function(a, b) {
    return b.tipo_parcela.localeCompare(a.tipo_parcela) || a.codigo_seccion.localeCompare(b.codigo_seccion) || a.num_parcela - b.num_parcela;
  });
}

function reordenar(from, to) {
  data.value.rows.splice(to, 0, data.value.rows.splice(from, 1)[0]);
};

const listasMantenimiento = ref([])
const tituloLista = ref('')
const selectedLista = ref(null)

const openDialog = (ids, listaId = null) => {

  if (parseInt(listaId)) {

    data.value.lista_id = listaId
    selectedLista.value = listaId

    api.get(`mantenimiento?f[lista_id]=${parseInt(listaId)}&rowsPerPage=-1&sortBy=orden&order=ASC`)
      .then(response => {
        data.value.rows = response.data?.data?.map(row => {
          return {
            id: row.id,
            ubicacion_id: row.ubicacion_id,
            ubicacion: row.ubicacion?.codigo_parcela,
            codigo_seccion: row.ubicacion?.codigo_seccion,
            num_parcela: row.ubicacion?.num_parcela,
            estatus: row.estatus,
            observaciones: row.observaciones,
            ultimas_observaciones: row.ultimas_observaciones,
            tipo_parcela: row.ubicacion?.tipo_parcela?.tipo_parcela,
            notas: row.notas,
            difuntos: row.ubicacion?.puestos?.filter(p => !!parseInt(p.ocupado)),
          }
        })

        loadObservaciones()

        dialog.value = true
      });

    api.get(`mantenimiento/listas/${parseInt(listaId)}`)
      .then(response => {
        if (response.data) {
          tituloLista.value = [response.data.resumen, response.data.titulo, response.data.subtitulo].filter(el => !!el).join(' - ')
        }
      })


  } else {

    data.value.lista_id = null
    selectedLista.value = null;

    api.get(`mantenimiento?id=${ids.join(',')}&rowsPerPage=-1`)
      .then(response => {
        var ordering = {}, // map for efficient lookup of sortIndex
          sortOrder = ids;
        for (var i=0; i<sortOrder.length; i++)
          ordering[sortOrder[i]] = i;

        console.log('response', response);

        data.value.rows = response.data?.data?.map(row => {
          return {
            id: row.id,
            ubicacion_id: row.ubicacion_id,
            ubicacion: row.ubicacion?.codigo_parcela,
            codigo_seccion: row.ubicacion?.codigo_seccion,
            num_parcela: row.ubicacion?.num_parcela,
            estatus: row.estatus,
            observaciones: row.observaciones,
            ultimas_observaciones: row.ultimas_observaciones,
            tipo_parcela: row.ubicacion?.tipo_parcela?.tipo_parcela,
            notas: row.notas,
            difuntos: row.ubicacion?.puestos?.filter(p => !!parseInt(p.ocupado)),
          }
        }).sort(function(a, b) {
          /* ORDERNAR POR TIPO DE PARCELA
          if (x.tipo_parcela > y.tipo_parcela) {
            return -1;
          }
          if (x > y) {
            return 1;
          }
          return 0;
          */

          if ( ordering[a.id] < ordering[b.id] ){
            return -1;
          }
          if ( ordering[a.id] > ordering[b.id] ){
            return 1;
          }
          return 0;

        });

        loadObservaciones()
        tituloLista.value = null
        dialog.value = true

      })
  }

  function loadObservaciones()
  {
    data.value.rows.forEach((row, index) => {
      if (!row.observaciones?.length) {
        data.value.rows[index].observaciones = JSON.parse(JSON.stringify(observacionesPorTipoUbicacion[row.tipo_parcela]))
      } else {
        let observacionesPlantilla = JSON.parse(JSON.stringify(observacionesPorTipoUbicacion[row.tipo_parcela]))

        observacionesPlantilla.forEach((obs, key) => {
          let rowObservacion = row.observaciones.find(o => o.title == obs?.title)
          if (rowObservacion?.value) {
            observacionesPlantilla[key].value = rowObservacion.value
          }
        })

        row.observaciones = observacionesPlantilla
      }

      if (row.ultimas_observaciones?.length) {

        row.observaciones.forEach(observacion => {

          let ultimaObservacion = row.ultimas_observaciones.find(o => o.title == observacion.title)
          if (!observacion.value && ultimaObservacion?.value) {
            observacion.value = ultimaObservacion.value
            observacion.isLast = true
          }

        })

      }
    })
  }


  api
    .get("mantenimiento/listas")
    .then((response) => {
      if (response.data) {
        listasMantenimiento.value = response.data;
      }
    })
    .catch((error) => {
      console.log(error);
      qNotify(error, "error")
    });

}

defineExpose({ openDialog })
const emit = defineEmits(['created'])

</script>
