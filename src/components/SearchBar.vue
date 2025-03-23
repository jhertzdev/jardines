<template>
  <template v-if="showBusqueda">
    <q-card bordered class="q-mb-lg card-busqueda">
      <q-card-section class="q-pa-xs" style="height:100%">
        <!-- Close button -->
        <q-btn dense unelevated color="primary" icon="close" class="q-mr-sm card-busqueda-close" @click="toggleOpen()" style="position: absolute; top: 0; right: -8px; font-size: 0.5rem; z-index: 1;" />
        <div class="row card-busqueda-row" style="height:100%">
          <div class="flex column justify-center col-12 col-md-4 q-px-md">

            <q-input dense v-model="busqueda" placeholder="Buscar..." @keyup.enter="ejecutarBusqueda" :disable="isLoading">
              <template v-slot:append>
                <q-btn dense flat icon="filter_alt" color="primary" @click="showBusquedaAvanzada = true" />
                <q-btn dense unelevated icon="search" color="primary" @click="ejecutarBusqueda" :loading="isLoading" />
              </template>
            </q-input>
            <span class="text-caption text-grey-6 q-mt-xs" v-if="hintFiltrosAplicados.length">
              <q-btn dense round unelevated icon="close" color="red" @click="removerFiltrosAvanzados" style="font-size: 0.5rem" />
              {{ hintFiltrosAplicados }}
            </span>

            <!-- Agregar grupo de checkboxes -->
            <q-option-group
              class="q-mt-xs"
              v-model="filtrosBusqueda"
              :options="filtrosBusquedaOptions"
              type="checkbox"
              inline
              dense
            />
          </div>
          <div class="col-12 col-md-8 results-wrapper">

            <!-- Muted -->
            <div class="flex justify-center items-center" style="height:100%" v-if="!filtrosBusqueda.length">
              <span class="text-grey-5">No hay resultados para mostrar.</span>
            </div>
            <template v-else>
              <template v-if="filtrosBusqueda.includes('clientes')">
                <div class="text-body text-weight-bold text-primary">Clientes</div>
                <template v-if="resultados?.clientes?.length">
                  <q-markup-table flat bordered separator="cell" wrap-cells class="results-table q-mb-sm">
                    <thead>
                      <tr>
                        <th>Nombre completo</th>
                        <th>Núm. identidad</th>
                        <th>Estatus / Cuenta</th>
                        <th>Ubicaciones</th>
                        <th>Contratos</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in resultados.clientes" :key="row.id">
                        <td><a href="javascript:void(0)" @click="agregarClienteDialog.openDialog(row.id)">{{ row.nombre }} {{ row.apellido }}</a></td>
                        <td>{{ row.doc_identidad }}-{{ row.doc_numero }}</td>
                        <td class="text-center">
                          <q-badge class="q-px-xs q-mr-xs" v-if="row.estado_cliente" :class="{
                              'bg-primary': row.estado_cliente == 'Activo',
                              'bg-red-9 text-white': row.estado_cliente == 'Suspendido',
                              'bg-black': row.estado_cliente == 'Fallecido',
                              'bg-grey-4 text-black': row.estado_cliente == 'Inactivo'
                            }">
                            {{ row.estado_cliente }}
                          </q-badge>
                          <q-badge class="q-px-xs" v-if="row.estado_cuenta && !['Inactivo', 'Fallecido'].includes(row.estado_cliente)" :class="{
                            'bg-primary': row.estado_cuenta == 'Activo',
                            'bg-red-9 text-white': row.estado_cuenta == 'En mora',
                            'bg-grey-5 text-black': row.estado_cuenta == 'Inactivo'
                          }">
                            {{ row.estado_cuenta }}
                          </q-badge>
                        </td>
                        <td>
                          <q-badge v-for="ubicacion in row.ubicaciones || []" :style="ubicacion.estatus == 'Donado' ? 'background-color: #800080' : ''">
                            <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(ubicacion.id)" class="text-white">
                              {{ ubicacion.codigo_seccion }}{{ ubicacion.num_parcela }} {{ ubicacion.estatus == 'Donado' ? '(Donado)' : '' }}
                            </a>
                          </q-badge>
                        </td>
                        <td>
                          <template v-for="contrato in row.contratos || []">
                            <div class="badge-contrato">
                              <span :style="{
                                'background-color': contrato.etiqueta == 'Donado' ? '#800080' : (contrato.estatus == 'Activo' ? 'var(--q-primary)' : '#c62828'),
                                'border-color': contrato.etiqueta == 'Donado' ? '#800080' : (contrato.estatus == 'Activo' ? 'var(--q-primary)' : '#c62828'),
                              }">
                                <a href="javascript:void(0)" @click="verContratosDialog.openDialog(contrato.num_contrato, contrato.tipo_parcela)" class="text-white">
                                  {{ contrato.codigo_contrato }}{{ contrato.num_contrato }} {{ contrato.etiqueta == 'Donado' ? '(Donado)' : '' }}
                                  <template v-if="contrato.num_serie">
                                    <span>
                                      -{{ contrato.num_serie }}
                                    </span>
                                  </template>
                                </a>
                              </span>
                              <span> {{ contrato.posiciones.map(posicion => posicion.codigo_seccion + posicion.num_parcela).join(', ') }}</span>
                            </div>
                          </template>
                        </td>
                        <td style="font-size:.7rem; letter-spacing: -0.2px;">
                          <template v-if="row.descripcion_nota">
                            <div>

                              <q-badge :class="`badge-status-${slugify(row.estatus_nota)}`" class="q-mr-xs q-mt-xs text-black column" style="border: 1px solid #ccc; white-space: wrap; max-width: 320px; align-items: start;">
                                <span class="text-grey-6 q-mb-xs" style="font-size: .65rem">{{ new Date(row.fecha_ultima_nota) ? format(new Date(row.fecha_ultima_nota), 'dd/MM/yyyy HH:mm') : '-' }}</span>
                                <div style="max-width: 100%; white-space: break-spaces; line-height: 1.15;">
                                  {{ row.descripcion_nota }}
                                </div>
                              </q-badge>

                              <q-separator class="q-my-xs"></q-separator>
                            </div>
                          </template>
                          <p>{{ row.notas }}</p>
                        </td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </template>
                <template v-else>
                  <div class="text-grey-5 text-caption">No hay clientes que mostrar.</div>
                </template>
              </template>
              <template v-if="filtrosBusqueda.includes('fallecidos')">
                <div class="text-body text-weight-bold text-primary">Fallecidos</div>
                <template v-if="resultados?.fallecidos?.length">
                  <q-markup-table flat bordered separator="cell" wrap-cells class="results-table q-mb-sm">
                    <thead>
                      <tr>
                        <th>Nombre completo</th>
                        <th>Núm. ident.</th>
                        <th>Ubicación</th>
                        <th>Titular</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in resultados.fallecidos" :key="row.id">
                        <td><a href="javascript:void(0)" @click="agregarDifuntoDialog.openDialog(row.id)">{{ row.nombre }} {{ row.apellido }}</a></td>
                        <td>{{ row.doc_identidad }}-{{ row.doc_numero }}</td>


                        <td class="text-center">
                          <template v-if="row.ubicacion">
                            <div class="badge-contrato" v-for="ub in row.ubicacion">
                              <span>
                                <a href="javascript:void(0)" @click="verContratosDialog.openDialog(ub.num_contrato, ub.tipo_parcela)" class="text-white">
                                  {{ ub.num_contrato }}
                                  <template v-if="ub.num_serie">
                                    <span>
                                      -{{ ub.num_serie }}
                                    </span>
                                  </template>
                                </a>
                              </span>
                              <span> {{ ub.ubicacion }}</span>
                            </div>
                          </template>
                          <template v-else-if="row.puesto_id">
                            {{ row.codigo_seccion }}-{{ row.num_parcela }} ({{ row.puesto_nombre }})
                          </template>
                          <template v-else>
                            -
                          </template>
                        </td>

                        <td class="text-center">
                          <template v-if="row.ubicacion?.length">
                            <a href="javascript:void(0)" @click="agregarClienteDialog.openDialog(row.ubicacion[0].propietario_id)">{{ row.ubicacion[0].propietario_nombre }}</a> <br />
                            ({{ row.ubicacion[0].propietario_identidad }})
                            <q-badge class="q-px-xs q-mr-xs" v-if="row.ubicacion[0].estado_cliente">
                              {{ row.ubicacion[0].estado_cliente }}
                            </q-badge>
                            <q-badge class="q-px-xs" v-if="row.ubicacion[0].estado_cuenta">
                              {{ row.ubicacion[0].estado_cuenta }}
                            </q-badge>
                          </template>
                        </td>


                        <!--<td>
                          <template v-for="contrato in row.contratos || []">
                            <div class="badge-contrato">
                              <span>
                                {{ contrato.codigo_contrato }}{{ contrato.num_contrato }}
                                <template v-if="contrato.num_serie">
                                  <span>
                                    -{{ contrato.num_serie }}
                                  </span>
                                </template>
                              </span>
                              <span> {{ contrato.posiciones.map(posicion => posicion.codigo_seccion + posicion.num_parcela).join(', ') }}</span>
                            </div>
                          </template>
                        </td>
                        <td>
                          <q-badge v-for="ubicacion in row.ubicaciones || []">
                            {{ ubicacion.codigo_seccion }}{{ ubicacion.num_parcela }}
                          </q-badge>
                        </td>-->
                        <td style="font-size:.7rem; letter-spacing: -0.2px;">
                          <template v-if="row.contratos?.length">
                            <div style="font-size:.6rem; letter-spacing: -0.2px;">
                              Contratos: <template v-for="contrato in row.contratos">
                                <q-badge class="q-px-xs q-mr-xs" :class="{
                                    'bg-primary': contrato.estatus == 'Activo',
                                    'bg-red-9 text-white': contrato.estatus != 'Activo'
                                  }">
                                  <a href="javascript:void(0)" @click="verContratosDialog.openDialog(contrato.num_contrato, contrato.tipo_parcela)" class="text-white">
                                    <span style="font-size:.6rem;">
                                      {{ contrato.codigo_contrato }}{{ contrato.num_contrato }}
                                      <template v-if="contrato.num_serie">
                                        <span>
                                          -{{ contrato.num_serie }}
                                        </span>
                                      </template>
                                    </span>
                                  </a>
                                </q-badge>
                              </template>
                            </div>
                            <q-separator class="q-mt-xs q-mb-sm" color="grey-3"/>
                          </template>
                          <template v-if="row.ubicacion?.length && row.ubicacion[0].propietario_notas">
                            <div class="q-mb-xs"><span class="text-italic">Nota del cliente:</span> {{ row.ubicacion[0].propietario_notas }}</div>
                          </template>
                          <template v-if="row.notas">
                            <div class="q-mb-xs"><span class="text-italic">Nota del difunto:</span> {{ row.notas }}</div>
                          </template>

                        </td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </template>
                <template v-else>
                  <div class="text-grey-5 text-caption">No hay fallecidos que mostrar.</div>
                </template>
              </template>
              <div class="row q-col-gutter-sm">
                <div class="col-md-6" v-if="filtrosBusqueda.includes('contratos')">
                  <div class="text-body text-weight-bold text-primary">Contratos</div>
                  <template v-if="resultados?.contratos?.length">
                    <q-markup-table flat bordered separator="cell" wrap-cells class="results-table q-mb-sm">
                      <thead>
                        <tr>
                          <th>Núm. contrato</th>
                          <th>Propietario</th>
                          <th>Estatus</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="contrato in resultados.contratos" :key="contrato.id">
                          <td>
                            <q-badge>
                              <a class="text-white" href="javascript:void(0)" @click="verContratosDialog.openDialog(contrato.num_contrato, contrato.tipo_parcela)">
                              {{ contrato.codigo_contrato }}-{{ contrato.num_contrato }}</a>
                            </q-badge>
                          </td>
                          <td>
                            <template v-if="contrato.comprador_id">
                              <a href="javascript:void(0)" @click="agregarClienteDialog.openDialog(contrato.comprador_id)">{{ contrato.nombre_completo }} ({{  contrato.documento_ident }})</a>

                            </template>
                            <template v-else>
                              -
                            </template>
                          </td>
                          <td>{{ contrato.estatus }}</td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </template>
                  <template v-else>
                    <div class="text-grey-5 text-caption">No hay contratos que mostrar.</div>
                  </template>
                </div>
                <div class="col-md-6" v-if="filtrosBusqueda.includes('ubicaciones')">
                  <div class="text-body text-weight-bold text-primary">Ubicaciones</div>
                  <template v-if="resultados?.ubicaciones?.length">
                    <q-markup-table flat bordered separator="cell" wrap-cells class="results-table q-mb-sm">
                      <thead>
                        <tr>
                          <th>Ubicación</th>
                          <th>Propietario</th>
                          <th>Estatus</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="ubicacion in resultados.ubicaciones" :key="ubicacion.id">
                          <td>
                            <q-badge>
                              <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(ubicacion.id)" class="text-white">
                                {{ ubicacion.codigo_seccion }}{{ ubicacion.num_parcela }}
                              </a>
                            </q-badge>
                          </td>
                          <td>
                            <template v-if="ubicacion.propietario_id">
                              {{ ubicacion.nombre_completo }} ({{  ubicacion.documento_ident }})
                            </template>
                            <template v-else>
                              -
                            </template>
                          </td>
                          <td>{{ ubicacion.estatus }}</td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </template>
                  <template v-else>
                    <div class="text-grey-5 text-caption">No hay ubicaciones que mostrar.</div>
                  </template>
                </div>
                <div class="col-12" v-if="filtrosBusqueda.includes('servicios')">
                  <div class="text-body text-weight-bold text-primary">Servicios</div>
                  <template v-if="resultados?.servicios?.length">
                    <q-markup-table flat bordered separator="cell" wrap-cells class="results-table q-mb-sm">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Difunto</th>
                          <th>Ubicación</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="servicio in resultados.servicios" :key="servicio.id">
                          <td class="text-center" style="width: 170px">
                            <div class="badge-contrato">
                              <span style="font-size: 13px">
                                {{ servicio.clase_servicio }}
                              </span>
                              <span style="font-size: 13px"> {{ servicio.tipo_servicio }}</span>
                            </div>
                          </td>
                          <td>
                            {{ servicio.difunto }}
                          </td>
                          <td class="text-center" style="width: 80px">
                            <q-badge v-if="servicio.ubicacion_id">
                              <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(servicio.ubicacion_id)" class="text-white">
                                {{ servicio.ubicacion }}
                              </a>
                            </q-badge>
                          </td>
                          <td class="text-center" style="width: 80px">
                            {{ servicio.fecha_asignado }}
                          </td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </template>
                  <template v-else>
                    <div class="text-grey-5 text-caption">No hay ubicaciones que mostrar.</div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
    <q-dialog v-model="showBusquedaAvanzada" class="j-dialog j-dialog-lg">
      <q-card class="q-pa-md">
        <q-card-section class="q-py-none text-center">
          <div class="text-h6">Búsqueda avanzada</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="fechaCreadoDesde" type="date" label="Fecha desde" clearable />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="fechaCreadoHasta" type="date" label="Fecha hasta" clearable />
            </div>
            <div class="col-12 q-gutter-xs text-center">
              <q-btn dense unelevated label="Hoy" color="primary" @click="setFechasCreado('HOY')" class="q-px-sm"/>
              <q-btn dense unelevated label="Últ. 7 días" color="primary" @click="setFechasCreado('7D')" class="q-px-sm"/>
              <q-btn dense unelevated label="Últ. 30 días" color="primary" @click="setFechasCreado('30D')" class="q-px-sm"/>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </template>

  <DialogAgregarCliente ref="agregarClienteDialog" />
  <DialogAgregarDifunto ref="agregarDifuntoDialog" :difunto="true" />
  <DialogVerContratos ref="verContratosDialog" />
  <DialogEditarParcela ref="editarParcelaDialog" />

</template>

<script setup>
  import { ref, onMounted, computed } from "vue";
  import { useAppStore } from "src/stores/app.store";
  import { useRouter } from "vue-router";
  import { api } from "src/boot/axios";
  import { qNotify, slugify } from "src/boot/jardines";
  import { format } from 'date-fns';

  import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
  import DialogAgregarDifunto from "src/components/popups/DialogAgregarCliente.vue";
  import DialogVerContratos from "src/components/popups/DialogVerContratos.vue";
  import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";

  const agregarClienteDialog = ref(null)
  const agregarDifuntoDialog = ref(null)
  const verContratosDialog = ref(null)
  const editarParcelaDialog = ref(null)

  const appStore = useAppStore();
  const router = useRouter()
  const showBusqueda = ref(false)

  onMounted(() => {
    setTimeout(() => {
      toggleOpen()
    }, 50)
  })

  const toggleOpen = () => {
    showBusqueda.value = !showBusqueda.value

    if (showBusqueda.value) {
      document.body.classList.add('section-busqueda-open');
    } else {
      document.body.classList.remove('section-busqueda-open');
    }
  }

  const busqueda = ref('')
  const tipoBusqueda = ref('texto')
  const filtrosBusqueda = ref([
    'clientes',
    'fallecidos',
    'contratos',
    'ubicaciones',
    'servicios',
  ])
  const filtrosBusquedaOptions = [
    { label: 'Clientes', value: 'clientes' },
    { label: 'Fallecidos', value: 'fallecidos' },
    { label: 'Contratos', value: 'contratos' },
    { label: 'Ubicaciones', value: 'ubicaciones' },
    { label: 'Servicios', value: 'servicios' },
  ]

  const showBusquedaAvanzada = ref(false)
  const isLoading = ref(false)

  const fechaCreadoDesde = ref(null)
  const fechaCreadoHasta = ref(null)

  const resultados = ref({})

  function getYMD(date) {
    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero based
    let day = ("0" + date.getDate()).slice(-2);
    let ymd = `${year}-${month}-${day}`;
    return ymd;
  }

  function setFechasCreado(fecha) {
    let fechaHoy = new Date();

    if (fecha === 'HOY') {
      fechaCreadoDesde.value = getYMD(fechaHoy)
      fechaCreadoHasta.value = getYMD(fechaHoy)
    } else if (fecha === '7D') {
      let fecha7d = new Date();
      fecha7d.setDate(fechaHoy.getDate() - 7);
      fechaCreadoDesde.value = getYMD(fecha7d)
      fechaCreadoHasta.value = getYMD(fechaHoy)
    } else if (fecha === '30D') {
      let fecha30d = new Date();
      fecha30d.setDate(fechaHoy.getDate() - 30);
      fechaCreadoDesde.value = getYMD(fecha30d)
      fechaCreadoHasta.value = getYMD(fechaHoy)
    }
  }

  const hintFiltrosAplicados = computed(() => {
    let filtros = '';

    if (fechaCreadoDesde.value) {
      filtros += `desde ${fechaCreadoDesde.value}`;
    }

    if (fechaCreadoHasta.value) {
      filtros += ` hasta ${fechaCreadoHasta.value}`;
    }

    if (filtros.length) {
      filtros = filtros.trim();
      filtros = filtros.charAt(0).toUpperCase() + filtros.slice(1);
    }
    // Trim space and first char is uppercase
    return filtros;
  })

  function removerFiltrosAvanzados() {
    fechaCreadoDesde.value = null;
    fechaCreadoHasta.value = null;
  }

  function ejecutarBusqueda() {
    isLoading.value = true

    let params = {
      q: busqueda.value,
      include: filtrosBusqueda.value || '',
      desde: fechaCreadoDesde.value || null,
      hasta: fechaCreadoHasta.value || null,
    }

    console.log(params)

    api.post('busqueda', params)
      .then(response => {
        console.log(response);
        if (response.data) {
          resultados.value = response.data
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoading.value = false)

  }

  defineExpose({
    toggleOpen,
  })


</script>
