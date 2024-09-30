<template>
  <div class="q-pa-md">
    <template v-if="isLoading">
      <div class="text-center q-py-xl">
        <q-spinner size="xl" color="primary" />
      </div>
    </template>
    <template v-else>
      <q-virtual-scroll
        type="table"
        dense
        style="max-height: 70vh"
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        :virtual-scroll-sticky-size-end="32"
        :items="filteredUbicaciones"
        separator="cell"
      >
        <template v-slot:before>
          <thead class="thead-sticky text-left">
            <tr>
              <th class="sticky-col first-col text-center" style="border-right: 1px solid var(--q-primary)" colspan="3">
                <q-input v-model="busqueda" outlined dense label="Buscar..." clearable />
              </th>
              <th :colspan="cantidadMeses">
                  <q-input class="q-mr-sm" label="Fecha de inicio" dense outlined v-model="fechaDesde" mask="####-##" :hide-bottom-space="true" readonly clearable style="width: 220px; display: inline-flex">
                    <template v-slot:append>
                      <q-icon v-if="fechaDesde" name="close" class="cursor-pointer" @click="fechaDesde = ''"></q-icon>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="fechaDesde" default-view="Months" emit-immediately v-close-popup="filterDateClosePopup"
                            @update:model-value="isLoading = true; filterDateClosePopup = true; cargarObservacionesUbicaciones()" @navigation="isLoading = true; filterDateClosePopup = true; cargarObservacionesUbicaciones()"
                            :default-year-month="(fechaDesde || new Date().toISOString().substr(0, 7)).replace('-', '/')" years-in-month-view>
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                  <q-select class="q-mr-sm" size="sm" dense outlined v-model="cantidadMeses" :options="[6, 12, 24]" style="display: inline-flex; min-width: 60px;" label="Meses" hide-dropdown-icon />
                  <q-btn size="sm" class="q-mb-sm" flat icon="keyboard_double_arrow_left" @click="agregarMeses(-12)"/>
                  <q-btn size="sm" class="q-mb-sm" flat icon="chevron_left" @click="agregarMeses(-3)"/>
                  <q-btn size="sm" class="q-mb-sm" flat icon="chevron_right" @click="agregarMeses(3)"/>
                  <q-btn size="sm" class="q-mb-sm" flat icon="keyboard_double_arrow_right" @click="agregarMeses(12)"/>

              </th>
            </tr>
            <tr>
              <th class="sticky-col first-col">Ubicación</th>
              <th class="sticky-col second-col">Contrato</th>
              <th class="sticky-col third-col">Difuntos</th>
              <th v-for="mes in columnasMeses" :key="mes.name" class="text-center">
                {{ mes.name }}
              </th>
            </tr>
          </thead>
        </template>

        <template v-slot="{ item: row, index }">
          <tr :key="index">
            <td class="sticky-col first-col">{{ row.codigo_seccion }}-{{ row.num_parcela }}</td>
            <td class="sticky-col second-col">{{ row.num_contrato }}</td>
            <td class="sticky-col third-col">
              <template v-if="row.difuntos">
                <ol class="q-ma-none q-pl-sm">
                  <li v-for="difunto in row.difuntos.split(',')" style="line-height: 1; font-size: .6rem" :key="difunto">
                    {{ difunto }}
                  </li>
                </ol>
              </template>
              <template v-else>
                <span class="text-grey-5">-- Vacío --</span>
              </template>
            </td>
            <td v-for="mes in columnasMeses" :key="mes.name" class="casilla" :class="{ 'marcado': row.observaciones[mes.name].marcado }" :style="`background-color: ${row.observaciones[mes.name].color || '#fff'};`">
              {{ row.observaciones[mes.name].texto }}
              <q-popup-proxy cover transition-show="scale" transition-hide="scale" @hide="row.observaciones[mes.name].changed && guardarObservacion(row.observaciones[mes.name], row.id, mes.name)" @show="row.observaciones[mes.name].changed = false">
                <div class="q-pa-sm q-gutter-xs">
                  <div class="row">
                    <div class="col-6">
                      <q-select dense :options="[
                        '#fdfd96',
                        '#84b6f4',
                        '#ff6961',
                        '#77dd77',
                      ]" outlined v-model="row.observaciones[mes.name].color" label="Color" clearable @update:model-value="row.observaciones[mes.name].changed = true">
                        <template v-slot:option="scope">
                          <q-item v-bind="scope.itemProps">
                            <q-badge :style="`background-color: ${scope.opt || '#000'};`" />
                          </q-item>
                        </template>
                        <template v-slot:selected>
                          <q-badge v-if="row.observaciones[mes.name].color" :style="`background-color: ${row.observaciones[mes.name].color};`" />
                        </template>
                      </q-select>
                    </div>
                    <div class="col-6">
                      <q-checkbox v-model="row.observaciones[mes.name].marcado" label="Marcado" @update:model-value="row.observaciones[mes.name].changed = true" />
                    </div>
                  </div>
                  <q-input autofocus type="textarea" outlined v-model="row.observaciones[mes.name].texto" label="Descripción" style="width: 320px" autogrow @update:model-value="row.observaciones[mes.name].changed = true" />
                </div>
              </q-popup-proxy>
            </td>
          </tr>
        </template>
      </q-virtual-scroll>
    </template>
  </div>
</template>

<style lang="css" scoped>
  .q-markup-table td,
  .q-markup-table th {
    font-size: .75rem;
    letter-spacing: -0.25px;
  }

  .q-markup-table ol {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-transform: uppercase;
  }

  .q-markup-table ::marker {
    font-size: 8px;
    color: var(--q-primary);
  }

  .sticky-col {
    position: -webkit-sticky;
    position: sticky;
    background-color: white;
    z-index: 1;
  }

  .first-col {
    width: 80px;
    min-width: 80px;
    max-width: 80px;
    left: 0px;
  }

  .second-col {
    left: 80px;
    width: 80px;
    min-width: 80px;
    max-width: 80px;
  }

  .third-col {
    left: 160px;
    width: 150px;
    min-width: 150px;
    max-width: 150px;
    border-right: 1px solid var(--q-primary);
  }

  .second-row th {
    top: 28px !important;
  }

  .thead-sticky {
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .thead-sticky {
    background: white;
  }

  .q-table td.marcado:before,
  .q-table td.marcado:after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  .q-table td.marcado:before {
    background: linear-gradient(to top right, transparent calc(50% - 1px), var(--q-primary) 50%, transparent calc(50% + 1px) );
  }

  .q-table td.marcado:after {
    background: linear-gradient(to left top, transparent calc(50% - 1px), var(--q-primary) 50%, transparent calc(50% + 1px) );
  }

  td.casilla {
    text-align: center;
    font-size: .6rem;
    width: 80px;
    min-width: 80px;
    max-width: 80px;
    max-height: 28px;
    height: 28px;
    white-space: wrap;
    line-height: 1;
  }
</style>

<script setup>

  import { ref, onMounted, computed } from 'vue';
  import { api } from 'src/boot/axios';
  import { useQuasar } from 'quasar';
  import { qNotify } from 'src/boot/jardines';
  import { format, add } from 'date-fns'

  const resumen = ref([])
  const ubicaciones = ref([])

  const busqueda = ref('')

  const filteredUbicaciones = computed(() => {
    let letras = busqueda.value.replace(/[^a-zA-Z]/gi, '').toLocaleLowerCase()
    let palabras = busqueda.value.split(' ')
    let numeros = busqueda.value.replace(/[^0-9]/gi, '')
    return ubicaciones.value.filter(ubicacion => {
      let encontrado = palabras.every(palabra => ubicacion.difuntos?.toLocaleLowerCase().includes(palabra.toLocaleLowerCase())) || false
      return (ubicacion.codigo_seccion.toLocaleLowerCase().includes(letras) && parseInt(ubicacion.num_parcela).toString().includes(numeros)) || encontrado
    })
  })

  const guardarObservacion = (observacion, ubicacionId, mes) => {
    let postData = {
      ubicacion_id: ubicacionId,
      fecha: mes,
      marcado: observacion.marcado,
      texto: observacion.texto,
      color: observacion.color
    }

    api.post('mantenimiento/resumen/observacion', postData)
      .then(response => {
        if (response.data) {
          let observacion = response.data

          if (!resumen.value[observacion.ubicacion_id]) {
            resumen.value[observacion.ubicacion_id] = {}
          }

          resumen.value[observacion.ubicacion_id][observacion.fecha] = observacion
        }
      })
      .catch(error => qNotify(error, 'error'))
  }

  const fechaDesde = ref(new Date().getFullYear() + '-01')
  const cantidadMeses = ref(24)
  const filterDateClosePopup = ref(false)

  const isLoading = ref(true)

  const columnasMeses = computed(() => {
    let meses = [];
    for (let index = 0; index < Array.from(Array(cantidadMeses.value).keys()).length; index++) {
      meses.push({
        name: format(add(new Date(fechaDesde.value.substr(0, 4), fechaDesde.value.substr(5, 2) - 1), { months: index }), "yyyy-MM")
      })
    }
    return meses
  })

  const agregarMeses = (num) => {
    isLoading.value = true;
    fechaDesde.value = format(add(new Date(fechaDesde.value.substr(0, 4), fechaDesde.value.substr(5, 2) - 1), { months: num }), "yyyy-MM")
    cargarObservacionesUbicaciones()
  }

  function cargarObservacionesUbicaciones() {

    ubicaciones.value.forEach(ubicacion => {
      ubicacion.observaciones = {}

      columnasMeses.value.forEach(mes => {
        if (resumen.value[ubicacion.id]?.[mes.name]) {
          ubicacion.observaciones[mes.name] = JSON.parse(JSON.stringify(resumen.value[ubicacion.id][mes.name]))
        } else {
          ubicacion.observaciones[mes.name] = {
            color: '',
            marcado: false,
            texto: ''
          }
        }
      })

      isLoading.value = false;

    })

  }

  onMounted(() => {

    isLoading.value = true

    api.get('mantenimiento/resumen')
      .then(response => {
        if (response.data) {
          ubicaciones.value = response.data.ubicaciones;
          resumen.value = response.data.resumen;
          cargarObservacionesUbicaciones();
        }
      })
      .catch(error => qNotify(error, 'error'))
  })

</script>
