<template>
  <div class="text-right q-gutter-xs">
    <q-btn
      size="sm"
      class="q-px-sm"
      label="Asignar mantenimientos"
      icon="handyman"
      color="primary"
      @click="agregarUbicacionesMantenimientoDialog.openDialog()"
    />
    <q-btn
      icon="list"
      size="sm"
      class="q-px-sm"
      label="Listas de mantenimiento"
      color="primary"
      @click="
        showDialogListasMantenimiento = true;
        showCrearNuevaListaMantenimiento = false;
      "
    ></q-btn>
    <q-btn
      size="sm"
      class="q-px-sm"
      label="Control trimestral"
      icon="event"
      color="primary"
      to="/app/mantenimiento/control-trimestral"
    />


      <div class="q-my-sm" style="width: 100%; font-size: 11px" v-if="filterDate.field?.value && (filterDate.desde || filterDate.hasta) || filterDate.mes">
        <q-btn icon="delete" color="negative" dense size="sm" @click="filterDate.desde = ''; filterDate.hasta = ''; filterDate.mes = null, filterDateClosePopup = true" />
        <template v-if="filterDate.mes">
          Mes: {{ filterDate.mes }} <span v-if="filterDate.field?.value && (filterDate.desde || filterDate.hasta)">| </span>
        </template>
        <template v-if="filterDate.field?.value && (filterDate.desde || filterDate.hasta)">
          {{ filterDate.field.label }}
          <template v-if="filterDate.desde"> desde el: {{ filterDate.desde }}</template>
          <template v-if="filterDate.hasta"> hasta el: {{ filterDate.hasta }}</template>
        </template>
      </div>
  </div>

  <div>
    <div class="row q-my-sm q-col-gutter-sm">
      <div class="col">
        <q-select
          dense
          outlined
          v-model="selectedLista"
          label="Lista seleccionada"
          :options="[
            {
              label: '-- Seleccionar todos --',
              value: null,
            },
            {
              label: '-- Mantenimientos sin asignar --',
              value: 'null',
            },
            ...listasMantenimiento.map((lista) => {
              return {
                label: [lista.resumen, lista.titulo, lista.subtitulo]
                  .filter((el) => !!el)
                  .join(' - '),
                value: lista.id,
              };
            }),
          ]"
        >
          <template v-slot:selected>
            {{ selectedLista.label || "-- Seleccionar todos --" }}
          </template>
        </q-select>
        <div class="text-left q-mt-xs q-gutter-xs">
          <template v-if="parseInt(selectedLista.value)">

            <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Imprimir lista`"
              icon="print"
              color="primary"
              @click="imprimirMantenimientoDialog.openDialog(selectedLista.value)"
            />

            <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Editar lista`"
              icon="edit"
              color="primary"
              @click="
                editarLoteOrdenesTrabajoDialog.openDialog(
                  null, selectedLista.value
                )
              "
            />

            <template v-if="parseInt(selectedLista.value) && selectedRows.length">
              <div style="border-right: 1px solid var(--q-primary); display: inline-flex; height: 20px; margin-bottom: -8px"></div>
            </template>

            <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Editar (${selectedRows.length})`"
              icon="edit"
              color="primary"
              v-if="selectedRows.length"
              @click="
                editarLoteOrdenesTrabajoDialog.openDialog(
                  selectedRows.map((r) => r.id)
                )
              "
            />

          </template>

          <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Seleccionar todo (${tableData.length})`"
              icon="check_box"
              color="primary"
              v-if="!selectedRows.length"
              @click="selectedRows = tableData"
            />
            <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Imprimir (${selectedRows.length})`"
              icon="print"
              color="primary"
              v-if="selectedRows.length"
              @click="imprimirMantenimientoDialog.openDialog()"
            />
            <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Editar (${selectedRows.length})`"
              icon="edit"
              color="primary"
              v-if="selectedRows.length"
              @click="
                editarLoteOrdenesTrabajoDialog.openDialog(
                  selectedRows.map((r) => r.id)
                )
              "
            />
            <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Borrar (${selectedRows.length})`"
              icon="delete"
              color="negative"
              v-if="selectedRows.length"
              @click="
                handleEliminarOrdenesMantenimientoLote(
                  selectedRows.map((r) => r.id)
                )
              "
            />
            <q-btn
              size="sm"
              class="q-px-sm"
              :label="`Deseleccionar`"
              icon="check_box"
              color="negative"
              v-if="selectedRows.length"
              @click="selectedRows = []"
            />

        </div>
      </div>
      <div class="col-auto">
        <div class="flex">
          <q-input
            dense
            outlined
            debounce="300"
            v-model="tableFilter"
            placeholder="Buscar..."
            style="width: 240px"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn dense outline icon="filter_alt" color="primary" class="q-ml-xs" @click="showDialogFilterDate = true"></q-btn>
        </div>
      </div>
    </div>
  </div>

  <q-virtual-scroll
    type="table"
    ref="tableRef"
    style="max-height: 70vh"
    :virtual-scroll-item-size="48"
    :virtual-scroll-sticky-size-start="48"
    :virtual-scroll-sticky-size-end="32"
    :items="tableData"
  >
    <template v-slot:before>
      <thead class="thead-sticky text-left">
        <tr>
          <th></th>
          <th v-for="col in tableColumns" :key="'1--' + col.name">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tr v-if="tableLoading">
        <td class="text-grey-5 text-center bg-grey-3" colspan="20">
          <q-spinner size="lg" color="primary"/>
        </td>
      </tr>
      <tr v-else-if="!tableData.length">
        <td class="text-grey-5 text-center bg-grey-3" colspan="20">
          <p class="q-mb-none q-py-lg">
            -- No hay resultados --
          </p>
        </td>
      </tr>
    </template>

    <template v-slot:after>
      <tfoot class="tfoot-sticky text-left">
        <tr>
          <th></th>
          <th v-for="col in tableColumns" :key="'2--' + col.name">
            {{ col.label }}
          </th>
        </tr>
      </tfoot>
    </template>

    <template v-slot="{ item: row, index }">
      <tr :key="index">
        <td>
          <q-checkbox v-model="selectedRows" :val="row"></q-checkbox>
        </td>
        <!-- Acciones -->
        <q-td>
          <div class="q-gutter-sm">
            <q-btn
              color="primary"
              dense
              flat
              size="sm"
              icon="edit"
              @click="editarOrdenTrabajoDialog.openDialog(row.id)"
            />
          </div>
        </q-td>

        <!-- Cliente -->
        <q-td
          style="
            max-width: 150px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          "
        >
          {{ row.ubicacion.propietario.propietario_nombre }} ({{
            row.ubicacion.propietario.propietario_identidad
          }})
        </q-td>

        <!-- Ubicación -->
        <q-td style="width: 1px">
          <a
            href="javascript:void(0)"
            @click="editarParcelaDialog.openDialog(row.ubicacion_id)"
            >{{ row.ubicacion.codigo_parcela }}</a
          >
          <q-icon
            name="info"
            class="q-ml-xs text-red-4"
            v-if="row?.notas?.length"
          >
            <q-tooltip
              anchor="top middle"
              self="bottom middle"
              max-width="240px"
              style="background: #000 !important; border: 1px solid #fff"
            >
              <div>{{ row.notas }}</div>
            </q-tooltip>
          </q-icon>
        </q-td>

        <!-- Contrato -->
        <q-td>
          {{
            row.ubicacion.contratos
              .filter(
                (c) =>
                  c.estatus == "Activo" &&
                  c.tipo_actividad == "mantenimiento_parcelas"
              )
              .map((c) => c.num_contrato)
              .join(", ")
          }}
        </q-td>

        <!-- Difuntos -->
        <q-td style="max-width: 150px; white-space: break-spaces">
          <ol
            class="q-my-none q-pl-sm"
            style="font-size: 0.75rem; letter-spacing: -0.25px"
          >
            <li
              v-for="puesto in row.ubicacion?.puestos?.filter(
                (p) => !!parseInt(p.ocupado)
              )"
              style="white-space: break-spaces"
            >
              {{ puesto.ocupante_nombre }}
            </li>
          </ol>
        </q-td>

        <!-- Mes -->
        <q-td>
          <template
            v-if="
              row.fecha_vencimiento &&
              new Date(row.fecha_vencimiento) != 'Invalid Date'
            "
          >
            {{ format(row.fecha_vencimiento, "yyyy-MM") }}
          </template>
          <template v-else>
            <span>-</span>
          </template>
        </q-td>
        <!-- Asignado el -->
        <q-td>
          <template
            v-if="
              row.fecha_asignado &&
              new Date(row.fecha_asignado) != 'Invalid Date'
            "
          >
            {{ format(row.fecha_asignado, "dd/MM/yyyy") }}
          </template>
          <template v-else>
            <span>-</span>
          </template>
        </q-td>
        <!-- Completado el -->
        <q-td>
          <template
            v-if="
              row.fecha_completado &&
              new Date(row.fecha_completado) != 'Invalid Date'
            "
          >
            {{ format(row.fecha_completado, "dd/MM/yyyy") }}
          </template>
          <template v-else>
            <span>-</span>
          </template>
        </q-td>

        <!-- Pagado hasta -->
        <q-td
          :class="
            row.ubicacion.vigente_hasta
              ? new Date(row.ubicacion.vigente_hasta) <
                startOfMonth(new Date(row.fecha_vencimiento))
                ? 'text-red-4 bg-red-1'
                : ''
              : ''
          "
        >
          <template
            v-if="
              row.ubicacion?.vigente_hasta &&
              new Date(row.ubicacion.vigente_hasta) != 'Invalid Date'
            "
          >
            {{ format(row.ubicacion.vigente_hasta, "dd/MM/yyyy") }}
          </template>
          <template v-else>
            <span>-</span>
          </template>
        </q-td>
        <!-- Último recibo -->
        <q-td>
          <template
            v-if="
              row.fecha_ultimo_recibo &&
              new Date(row.fecha_ultimo_recibo) != 'Invalid Date'
            "
          >
            {{ format(row.fecha_ultimo_recibo, "dd/MM/yyyy") }}
          </template>
          <template v-else>
            <span>-</span>
          </template>
        </q-td>
        <!-- Estatus -->
        <q-td>
          <q-badge :color="classEstatus[row.estatus]" :label="row.estatus" />
        </q-td>
        <!-- Notas -->
        <q-td
          style="
            width: 100px;
            max-width: 100px;
            font-size: 0.65rem;
            letter-spacing: -0.25px;
          "
        >
          {{ row.notas }}
        </q-td>
      </tr>
    </template>

  </q-virtual-scroll>


  <q-dialog v-model="showDialogFilterDate" class="j-dialog j-dialog-lg">
    <q-card>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div class="text-h6 q-mb-md">Filtros de búsqueda</div>

            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-12 text-center q-mb-sm">

                <q-btn-toggle
                  v-model="estatusOrdenes"
                  toggle-color="primary"
                  :options="[
                    { label: 'Todas', value: '' },
                    { label: 'Completadas', value: 'Completado' },
                    { label: 'Por entregar', value: 'Por entregar' },
                    { label: 'Por ejecutar', value: 'Por ejecutar' },
                  ]"
                  @click="selectedRows = []"
                />
              </div>
              <div class="col-5">
                <q-select
                  dense
                  outlined
                  v-model="filterDate.field"
                  :options="[
                    { label: 'Asignado', value: 'fecha_asignado' },
                    { label: 'Último recibo', value: 'fecha_ultimo_recibo' },
                    { label: 'Completado', value: 'fecha_completado' },
                  ]"
                  label="Filtrar por fecha"
                  clearable
                />
              </div>
              <div class="col">
                <q-input
                  type="date"
                  dense
                  outlined
                  v-model="filterDate.desde"
                  label="Desde"
                  clearable
                  @update:model-value="val => { if (val) filterDate.hasta = val }"
                />
              </div>
              <div class="col">
                <q-input
                  type="date"
                  dense
                  outlined
                  v-model="filterDate.hasta"
                  label="Hasta"
                  clearable
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  label="Mes asignado"
                  dense
                  outlined
                  v-model="filterDate.mes"
                  mask="####-##"
                  :hide-bottom-space="true"
                  readonly
                  clearable
                >
                  <template v-slot:append>
                    <q-icon
                      v-if="filterDate.mes"
                      name="close"
                      class="cursor-pointer"
                      @click="filterDate.mes = ''"
                    ></q-icon>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-date
                          v-model="filterDate.mes"
                          :default-year-month="
                            (
                              filterDate.mes ||
                              new Date().toISOString().substr(0, 7)
                            ).replace('-', '/')
                          "
                          default-view="Months"
                          emit-immediately
                          v-close-popup="filterDateClosePopup"
                          @update:model-value="filterDateClosePopup = true"
                          @navigation="filterDateClosePopup = false"
                          years-in-month-view
                        >
                          <div class="row items-center justify-end">
                            <q-btn
                              v-close-popup
                              label="Close"
                              color="primary"
                              flat
                            />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>

            <div class="text-right q-mt-md">
              <q-btn
                label="Cerrar"
                flat
                @click="showDialogFilterDate = false"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="showDialogListasMantenimiento"
    class="j-dialog j-dialog-xl"
  >
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="row">
          <div class="col">
            <div class="text-h6 q-mb-md">Listas de mantenimiento</div>
          </div>
          <div class="col-auto">
            <div class="text-right">
              <q-btn
                color="primary"
                label="Nueva lista"
                icon="add"
                @click="openDialogCrearListaMantenimiento(null)"
                v-if="!showCrearNuevaListaMantenimiento"
              />
              <q-btn
                color="primary"
                label="Volver"
                icon="arrow_back"
                @click="showCrearNuevaListaMantenimiento = false"
                v-else
              />
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-section v-if="showCrearNuevaListaMantenimiento">
        <q-form @submit="handleSubmitAgregarListaMantenimiento">
          <div class="row q-col-gutter-sm">
            <div class="col-3">
              <q-input
                type="date"
                outlined
                label="Fecha de asignación"
                dense
                v-model="crearListaData.fecha_asignado"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '']"
                hide-bottom-space
              ></q-input>
            </div>
            <div class="col-9">
              <q-input
                outlined
                label="Resumen (ej: Mes de enero de 2024)"
                dense
                v-model="crearListaData.resumen"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '']"
                hide-bottom-space
              ></q-input>
            </div>
            <div class="col-6">
              <q-input
                outlined
                label="Título (ej: Parque Araguaney)"
                dense
                v-model="crearListaData.titulo"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '']"
                hide-bottom-space
              ></q-input>
            </div>
            <div class="col-6">
              <q-input
                outlined
                label="Subtítulo (ej: Semana 01/08/2024 al 04/08/2024)"
                dense
                v-model="crearListaData.subtitulo"
              ></q-input>
            </div>
            <div class="col-12">
              <div class="q-gutter-md q-my-sm text-right">
                <q-btn
                  type="button"
                  label="Cerrar"
                  flat
                  color="primary"
                  @click="showDialogListasMantenimiento = false"
                />
                <q-btn
                  type="submit"
                  label="Guardar"
                  icon="save"
                  color="primary"
                  :loading="loadingSubmitCrearListaMantenimiento"
                />
              </div>
            </div>
          </div>
        </q-form>
      </q-card-section>
      <q-card-section v-else>
        <q-table
          flat
          dense
          :rows="listasMantenimiento"
          :columns="columnasListasMantenimiento"
          :pagination="{ rowsPerPage: 20 }"
          :loading="loadingListasMantenimiento"
        >
          <template v-slot:body-cell-fecha_asignado="props">
            <q-td :props="props">
              <template
                v-if="
                  props.row.fecha_asignado &&
                  new Date(props.row.fecha_asignado) != 'Invalid Date'
                "
              >
                {{ format(props.row.fecha_asignado, "dd/MM/yyyy") }}
              </template>
              <template v-else>
                <span>-</span>
              </template>
            </q-td>
          </template>
          <template v-slot:body-cell-acciones="props">
            <q-td class="q-gutter-x-xs" :props="props">
              <q-btn
                size="sm"
                class="q-px-sm"
                label="Cargar"
                icon="visibility"
                color="blue"
                @click="selectedLista = { label: [props.row.resumen, props.row.titulo, props.row.subtitulo]
                  .filter((el) => !!el)
                  .join(' - '), value: props.row.id }; showDialogListasMantenimiento = false;"
              />
              <q-btn
                size="sm"
                class="q-px-sm"
                label="Editar"
                icon="edit"
                color="primary"
                @click="openDialogCrearListaMantenimiento(props.row.id)"
              />
              <q-btn
                size="sm"
                class="q-px-sm"
                label="Eliminar"
                icon="delete"
                color="negative"
                @click="handleEliminarListaMantenimiento(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
  <DialogEditarOrdenTrabajo
    ref="editarOrdenTrabajoDialog"
    @updated="tableRequest(tablePagination)"
  />
  <DialogAgregarUbicacionesMantenimiento
    ref="agregarUbicacionesMantenimientoDialog"
    :listas="listasMantenimiento"
    @created="tableRequest(tablePagination)"
  />
  <DialogEditarLoteOrdenesTrabajo
    ref="editarLoteOrdenesTrabajoDialog"
    @updated="
      (val) => {
        if (!val?.mantener_marcados) {
          selectedRows = [];
        }
        tableRequest(tablePagination);
      }
    "
  />
  <DialogImprimirMantenimento
    ref="imprimirMantenimientoDialog"
    :lista="parseInt(selectedLista?.value)"
    :ids="selectedRows"
  />
  <DialogEditarParcela ref="editarParcelaDialog" />
</template>

<style>
.thead-sticky tr > *,
.tfoot-sticky tr > * {
  position: sticky;
  opacity: 1;
  z-index: 1;
  background: #fff;
  color: var(--q-primary);
}

.tfoot-sticky tr th {
  border-top: 1px solid #ccc;
}

.thead-sticky tr:last-child > * {
  top: 0;
}

.tfoot-sticky tr:first-child > * {
  bottom: 0;
}

.thead-custom-sticky tr > *,
.tfoot-custom-sticky tr > * {
  position: sticky;
  opacity: 1;
  z-index: 1;
  background-color: #000;
  color: #fff;
}

.thead-custom-sticky tr:last-child > * {
  top: 0;
}

.tfoot-custom-sticky tr:first-child > * {
  bottom: 0;
}
</style>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { qNotify } from "src/boot/jardines";
import DialogEditarOrdenTrabajo from "src/components/popups/DialogEditarOrdenTrabajo.vue";
import DialogEditarLoteOrdenesTrabajo from "src/components/popups/DialogEditarLoteOrdenesTrabajo.vue";
import DialogAgregarUbicacionesMantenimiento from "src/components/popups/DialogAgregarUbicacionesMantenimiento.vue";
import DialogImprimirMantenimento from "src/components/popups/DialogImprimirMantenimento.vue";
import DialogEditarParcela from "src/components/popups/DialogEditarParcela.vue";

import { format, lastDayOfMonth, startOfMonth } from "date-fns";

const editarOrdenTrabajoDialog = ref(null);
const editarLoteOrdenesTrabajoDialog = ref(null);
const agregarUbicacionesMantenimientoDialog = ref(null);
const imprimirMantenimientoDialog = ref(null);
const editarParcelaDialog = ref(null);

const estatusOrdenes = ref("");
const selectedLista = ref({
  value: "",
});

const filterDateClosePopup = ref(false);

const classEstatus = {
  "Por entregar": "primary",
  "Por ejecutar": "blue",
  Completado: "positive",
  Vencido: "negative",
};

const $q = useQuasar();

const showDialogFilterDate = ref(false);
const showDialogListasMantenimiento = ref(false);
const loadingSubmitCrearListaMantenimiento = ref(false);
const loadingListasMantenimiento = ref(true);
const showCrearNuevaListaMantenimiento = ref(false);

const openDialogCrearListaMantenimiento = (id = null) => {
  if (id) {
    api
      .get("mantenimiento/listas/" + id)
      .then((response) => {
        if (response.data) {
          crearListaData.value = response.data;
          crearListaData.value.fecha_asignado = new Date(
            crearListaData.value.fecha_asignado
          )
            .toISOString()
            .substr(0, 10);
        }
      })
      .catch((error) => qNotify(error, "error"))
      .finally(() => (showCrearNuevaListaMantenimiento.value = true));
  } else {
    crearListaData.value = {
      resumen: "",
      titulo: "",
      subtitulo: "",
      fecha_asignado: new Date().toISOString().substr(0, 10),
    };

    showCrearNuevaListaMantenimiento.value = true;
  }
};

const handleSubmitAgregarListaMantenimiento = () => {
  loadingSubmitCrearListaMantenimiento.value = true;

  console.log(crearListaData.value);

  api
    .post("mantenimiento/listas", crearListaData.value)
    .then((response) => {
      if (response.data) {
        showCrearNuevaListaMantenimiento.value = false;
        qNotify("Lista guardada exitosamente.", "positive");
        crearListaData.value = {
          resumen: "",
          titulo: "",
          subtitulo: "",
          fecha_asignado: "",
        };

        loadListasMantenimiento();
      }
    })
    .catch((error) => {
      console.log(error);
      qNotify(error, "error");
    })
    .finally(() => (loadingSubmitCrearListaMantenimiento.value = false));
};

const loadListasMantenimiento = () => {
  api
    .get("mantenimiento/listas")
    .then((response) => {
      if (response.data) {
        listasMantenimiento.value = response.data;
      }
    })
    .catch((error) => {
      console.log(error);
      qNotify(error, "error");
    })
    .finally(() => (loadingListasMantenimiento.value = false));
};

const crearListaData = ref({
  resumen: "",
  titulo: "",
  subtitulo: "",
  fecha_asignado: "",
});

const filterDate = ref({
  field: "",
  desde: "",
  hasta: "",
});

/* const filterDate = ref(format(new Date(), 'yyyy-MM')) */

const selectedRows = ref([]);

const tableData = ref([]);

const tableColumns = [
  { name: "acciones", label: "", align: "left" },
  { name: "cliente", label: "Cliente", align: "left" },
  {
    name: "ubicacion",
    label: "Ubicación",
    field: "ubicacion",
    align: "left",
    sortable: true,
  },
  {
    name: "contrato",
    label: "Contrato",
    align: "left",
    style: "width: 1px",
    field: (row) =>
      [
        ...new Set(
          row.ubicacion.contratos
            .filter((c) => c.estatus == "Activo")
            .map((c) => c.num_contrato)
        ),
      ].join(", "),
  },
  { name: "difuntos", label: "Difuntos", align: "left" },
  {
    name: "fecha_vencimiento",
    label: "Mes",
    align: "left",
    field: "fecha_vencimiento",
    sortable: true,
  },
  {
    name: "fecha_asignado",
    label: "Asignado el",
    align: "left",
    field: "fecha_asignado",
    sortable: true,
  },
  {
    name: "fecha_completado",
    label: "Completado el",
    align: "left",
    field: "fecha_completado",
    sortable: true,
  },
  {
    name: "vigente_hasta",
    label: "Pagado hasta",
    align: "left",
    field: "vigente_hasta",
    sortable: true,
  },
  {
    name: "fecha_ultimo_recibo",
    label: "Último recibo",
    align: "left",
    field: "fecha_ultimo_recibo",
    sortable: true,
  },
  {
    name: "estatus",
    label: "Estatus",
    align: "center",
    field: "estatus",
    headerStyle: "width: 100px",
  },
  {
    name: "notas",
    label: "Notas",
    align: "left",
    field: "notas",
    headerStyle: "width: 100px",
  },
];

const columnasListasMantenimiento = [
  {
    name: "fecha_asignado",
    label: "Fecha asignado",
    field: "fecha_asignado",
    align: "left",
    sortable: true,
  },
  { name: "resumen", label: "Resumen", field: "resumen", align: "left" },
  { name: "titulo", label: "Título", field: "titulo", align: "left" },
  { name: "subtitulo", label: "Subtítulo", field: "subtitulo", align: "left" },
  { name: "acciones" },
];

const listasMantenimiento = ref([]);

const tableRef = ref(null);
const tableLoading = ref(false);
const tableFilter = ref("");
const tablePagination = ref({
  page: 1,
  rowsPerPage: -1,
  sortBy: "",
  descending: true,
});

watch(estatusOrdenes, () => {
  //tableRef.value.requestServerInteraction()
  tableRequest(tablePagination.value);
});

watch(
  filterDate,
  () => {
    //tableRef.value.requestServerInteraction()
    tableRequest(tablePagination.value);
  },
  { deep: true }
);

watch(selectedLista, () => {
  //tableRef.value.requestServerInteraction()
  tableRequest(tablePagination.value);
});

watch(tableFilter, () => {
  //tableRef.value.requestServerInteraction()
  tableRequest(tablePagination.value)
})

const handleEliminarOrdenesMantenimientoLote = (ids, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: "Eliminar ordenes de mantenimiento",
      message:
        "¿Estás seguro de que quieres eliminar estas ordenes de mantenimiento?",
      cancel: true,
      persistent: true,
      ok: {
        label: "Eliminar",
        color: "primary",
        flat: true,
        icon: "delete",
      },
      cancel: {
        label: "Cancelar",
        color: "primary",
        flat: true,
        icon: "cancel",
      },
    }).onOk(() => {
      handleEliminarOrdenesMantenimientoLote(ids, true);
    });
  } else {
    tableLoading.value = true;
    ids.forEach((id) => {
      api
        .delete("mantenimiento/" + id)
        .catch((error) => qNotify(error, "error"));
      selectedRows.value = [];
    });

    setTimeout(() => {
      //tableRef.value.requestServerInteraction()
      tableRequest(tablePagination.value);
    }, 1000);
  }
};

const handleEliminarListaMantenimiento = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: "Eliminar lista mantenimiento",
      message:
        "¿Estás seguro de que quieres eliminar esta lista de mantenimiento? Las órdenes de trabajo se mantendrán sin asignar a ninguna lista.",
      cancel: true,
      persistent: true,
      ok: {
        label: "Eliminar",
        color: "primary",
        flat: true,
        icon: "delete",
      },
      cancel: {
        label: "Cancelar",
        color: "primary",
        flat: true,
        icon: "cancel",
      },
    }).onOk(() => {
      handleEliminarListaMantenimiento(id, true);
    });
  } else {
    loadingListasMantenimiento.value = true;

    api
      .delete("mantenimiento/listas/" + id)
      .then((response) => {
        if (response.data) {
          qNotify("Lista eliminada exitosamente.", "positive");
          loadListasMantenimiento();
        }
      })
      .catch((error) => qNotify(error, "error"));
  }
};

const handleEliminarOrdenMantenimiento = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: "Eliminar orden de trabajo",
      message: "¿Estás seguro de que quieres eliminar esta orden de trabajo?",
      cancel: true,
      persistent: true,
      ok: {
        label: "Eliminar",
        color: "primary",
        flat: true,
        icon: "delete",
      },
      cancel: {
        label: "Cancelar",
        color: "primary",
        flat: true,
        icon: "cancel",
      },
    }).onOk(() => {
      handleEliminarOrdenMantenimiento(id, true);
    });
  } else {
    tableLoading.value = true;
    api
      .delete("mantenimiento/" + id)
      .then((response) => {
        if (response.data) {
          $q.notify({ message: "Eliminado exitosamente.", color: "positive" });
          //tableRef.value.requestServerInteraction()
          tableRequest(tablePagination.value);
        }
      })
      .catch((error) =>
        qNotify(error, "error", {
          callback: () => handleEliminarOrdenMantenimiento(id),
        })
      )
      .finally(() => (tableLoading.value = false));
  }
};

const tableRequest = (props) => {
  console.log("props", props);

  const { page, rowsPerPage, sortBy, descending } = props.pagination
    ? props.pagination
    : props;

  tableLoading.value = true;

  let endpoint = "mantenimiento";

  const searchParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(props.pagination ? props.pagination : props).filter(
        ([k, v]) => v != null && k != "descending"
      )
    )
  );

  if (selectedLista.value?.value) {
    searchParams.append("f[lista_id]", selectedLista.value.value);
  }

  if (tableFilter.value) {
    searchParams.append("q", tableFilter.value);
  }

  if (sortBy) {
    searchParams.append("order", descending ? "DESC" : "ASC");
  }

  if (searchParams) {
    endpoint += "?" + searchParams.toString();
  }

  if (estatusOrdenes.value) {
    endpoint += "&f[estatus]=" + estatusOrdenes.value;
  }

  if (filterDate.value.field?.value) {
    endpoint += "&datefield=" + filterDate.value.field.value;
    endpoint += filterDate.value.desde ? `&from=${filterDate.value.desde}` : "";
    endpoint += filterDate.value.hasta ? `&to=${filterDate.value.hasta}` : "";
  }

  if (filterDate.value.mes) {
    endpoint += "&mes=" + filterDate.value.mes.substr(0, 7);
  }

  console.log("endpoint", endpoint);

  api
    .get(endpoint)
    .then((response) => {
      if (response.data) {
        console.log("Response", response.data);
        tableData.value = response.data.data;
        tablePagination.value.page = response.data.pager.currentPage;
        tablePagination.value.rowsPerPage = response.data.pager.perPage;
        tablePagination.value.rowsNumber = response.data.pager.total;
        tablePagination.value.sortBy = response.data.sortBy || null;
        tablePagination.value.descending = response.data.order == "DESC";
      }
    })
    .catch((e) => console.log(e))
    .finally(() => (tableLoading.value = false));
};

onMounted(() => {
  tableRequest(tablePagination.value);
  loadListasMantenimiento();
});
</script>
