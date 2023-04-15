<template>
  <div class="q-pa-md">
    <div class="text-h6 text-center">Parcela {{ parcelaDetalles.codigo_seccion }}-{{ parcelaDetalles.num_parcela }}</div>
  </div>

  <q-splitter v-model="splitterModel" :horizontal="$q.screen.lt.md">

    <template v-slot:before>
      <q-tabs v-model="tab" :vertical="!$q.screen.lt.md" class="text-grey-5" active-color="primary">
        <q-tab name="detalles" icon="view_timeline" label="Detalles" />
        <q-tab name="puestos" icon="crop_landscape" label="Puestos" />
        <q-tab name="contratos" icon="attach_money" label="Contratos" />
      </q-tabs>
    </template>

    <template v-slot:after>
      <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up">
        <q-tab-panel name="detalles">
          <q-card class="q-pa-md">
            <q-form @submit="handleSubmitDetalles" :class="isLoadingDetalles && 'form-disabled'">
              <q-card-section>
                <div class="text-h6">Detalles de la parcela</div>
              </q-card-section>

              <q-card-section>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Propietario</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <QSelectCliente dense outlined clearable v-model="parcelaDetalles.propietario_id" />
                  </div>
                </div>
                <div class="row q-mb-md">
                  <div class="col-12 text-right text-caption text-grey-6">
                    <span>¿El cliente no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                      color="primary" @click="agregarClienteDialog.openDialog()" />
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Pariente más cercano
                      <q-icon name="help_outline">
                        <q-tooltip anchor="top middle" self="bottom middle" max-width="240px">
                          Opcional. Es el principal beneficiario de la parcela y controla los derechos de entierro del
                          propietario después de su muerte.
                        </q-tooltip>
                      </q-icon>
                    </span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <QSelectCliente dense outlined clearable v-model="parcelaDetalles.pariente_mas_cercano" />
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Estatus de la parcela</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <QSelectEstatusParcela dense outlined required v-model="parcelaDetalles.estatus" />
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Descripción</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <q-input dense outlined v-model="parcelaDetalles.descripcion" placeholder="Escribe una descripción"
                      autogrow />
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Ubicación</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-md-5">
                        <QSelectSeccion dense outlined required clearable v-model="parcelaDetalles.codigo_seccion"
                          label="Sector" />
                      </div>
                      <div class="col-6 col-md">
                        <q-input class="input-num-parcela" dense outlined v-model="parcelaDetalles.num_parcela"
                          :stack-label="!!parcelaDetalles.codigo_seccion" label="Parcela">
                          <template v-slot:prepend v-if="parcelaDetalles.codigo_seccion">
                            <span>{{ parcelaDetalles.codigo_seccion }}</span>
                          </template>
                        </q-input>
                      </div>
                      <div class="col-auto text-grey-8 flex column justify-center" :class="$q.screen.lt.md && 'hide'">
                        |
                      </div>
                      <div class="col-6 col-md">
                        <q-input dense outlined v-model="parcelaDetalles.num_fila" label="Fila" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Características</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <table class="full-width text-center">
                      <thead>
                        <tr>
                          <th>Tipo de parcela</th>
                          <th>Largo &times; Ancho &times; Alto</th>
                          <th>Puestos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <td>
                          {{ parcelaData.tipo_parcela?.nombre }}
                        </td>
                        <td>
                          {{ parseFloat(parcelaData.tipo_parcela?.largo).toFixed(2) }} &times;
                          {{ parseFloat(parcelaData.tipo_parcela?.ancho).toFixed(2) }} &times;
                          {{ parseFloat(parcelaData.tipo_parcela?.profundidad).toFixed(2) }}
                        </td>
                        <td>
                          {{ parcelaData.puestos?.length }}
                        </td>
                      </tbody>
                    </table>
                  </div>
                </div>

              </q-card-section>

              <q-card-actions class="justify-end">
                <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingDetalles" />
              </q-card-actions>
            </q-form>
          </q-card>
        </q-tab-panel>
        <q-tab-panel name="puestos">


          <div class="full-width q-pa-lg text-center" v-if="!parcelaData.puestos?.length">
            <p>No hay puestos asociados a esta parcela.</p>
          </div>

          <q-card class="q-pa-md" v-else>
            <q-form @submit="handleSubmitPuestos" :class="isLoadingPuestos && 'form-disabled'">
              <q-card-section>
                <div class="text-h6">Puestos de la parcela</div>
              </q-card-section>
              <q-card-section>
                <div class="row q-col-gutter-sm q-mb-md" v-for="puesto in (parcelaData.puestos || [])">
                  <div class="col-sm-3 col-12 flex column justify-center">
                    <span class="text-grey-8">{{ puesto.nombre }}</span>
                    <span>
                      <q-badge color="negative" v-if="parseInt(puesto.ocupado)">
                        Ocupado
                      </q-badge>
                      <q-badge color="positive" v-else>
                        Disponible
                      </q-badge>
                    </span>
                  </div>
                  <div class="col-sm-9 col-12">
                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-md-7">
                        <QSelectCliente dense outlined clearable v-model="puestosData[puesto.id].ocupante_id"
                          label="Selecciona un ocupante" />
                      </div>
                      <div class="col-12 col-md-5">
                        <q-input dense outlined label="Fecha de inhumación"
                          v-model="puestosData[puesto.id].fecha_inhumacion" type="datetime-local" stack-label />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row q-mb-md">
                  <div class="col-12 text-right text-caption text-grey-6">
                    <span>¿El difunto no existe?</span> <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar"
                      color="primary" @click="agregarClienteDialog.openDialog()" />
                  </div>
                </div>
              </q-card-section>
              <q-card-actions class="justify-end">
                <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingPuestos" />
              </q-card-actions>
            </q-form>
          </q-card>
        </q-tab-panel>
        <q-tab-panel name="contratos">
          <div class="full-width q-pa-lg text-center" v-if="!parcelaData.contratos?.length">
            <p>No hay contratos asociados a esta parcela.</p>
            <q-btn color="primary" label="Generar contratos" to="/contratos" />
            <!--<q-btn color="primary" label="Generar contratos" @click="openDialogGenerarContratos" />-->
          </div>
          <q-card class="q-pa-md" v-else>
            <q-form @submit="handleSubmitDetalles" :class="isLoadingDetalles && 'form-disabled'">
              <q-card-section>
                <div class="text-h6">Contratos</div>
              </q-card-section>

              <q-card-section>

                <div class="row q-col-gutter-md">
                  <div class="col-md-6 col-12" v-for="contrato in parcelaData.contratos">
                    <q-card class="my-card">
                      <q-card-section class="bg-primary text-white">
                        <q-badge class="float-right" color="white" text-color="primary">
                          {{ contrato.estatus }}
                        </q-badge>
                        <div class="text-h5">{{ contrato.codigo_contrato }}-{{ contrato.num_contrato }}</div>
                        <p class="q-mb-none">{{ contrato.nombre_contrato }}</p>
                      </q-card-section>
                      <q-card-section>
                        <table class="full-width">
                          <tbody>
                            <tr>
                              <th>Comprador</th>
                              <td class="text-right">{{ contrato.comprador_nombre }} ({{ contrato.comprador_identidad }})
                              </td>
                            </tr>
                            <tr>
                              <th>Vendedor</th>
                              <td class="text-right">{{ contrato.razon_social }}</td>
                            </tr>
                            <tr>
                              <th>Fecha de emisión</th>
                              <td class="text-right">{{ contrato.fecha_emision || '-' }}</td>
                            </tr>
                            <tr>
                              <th>Fecha de vencimiento</th>
                              <td class="text-right">{{ contrato.fecha_vencimiento || '-' }}</td>
                            </tr>
                            <tr>
                              <th>Valor total</th>
                              <td class="text-right">{{ $money.$bs(contrato.valor_total) || '-' }}</td>
                            </tr>
                            <tr>
                              <th>Número de cuotas</th>
                              <td class="text-right">{{ contrato.numero_cuotas || '-' }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </q-card-section>

                      <q-separator />

                      <q-card-actions class="justify-end">
                        <q-btn label="Ver" icon="picture_as_pdf" color="primary"
                          @click="handleDownloadPdf(contrato.id)" />
                        <!--<q-btn label="Editar" icon="edit" color="primary" />
                        <q-btn label="Borrar" icon="delete" color="negative" />-->
                      </q-card-actions>
                    </q-card>
                  </div>
                </div>

              </q-card-section>

              <q-card-actions class="justify-end">
                <q-btn type="submit" label="Guardar" color="primary" :loading="isLoadingDetalles" />
              </q-card-actions>
            </q-form>
          </q-card>
        </q-tab-panel>

      </q-tab-panels>
    </template>
  </q-splitter>

  <!-- Dialogs -->
  <DialogAgregarCliente ref="agregarClienteDialog" />
  <DialogGenerarContratosIndividual ref="generarContratosDialog" @created="handleGenerarContratos" :params="contratosParams" />
</template>

<script setup>

import { ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { qNotify } from 'src/boot/jardines';
import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
import DialogGenerarContratosIndividual from "src/components/popups/DialogGenerarContratosIndividual.vue";

// Components
import QSelectCliente from 'src/components/selects/QSelectCliente.vue'
import QSelectEstatusParcela from 'src/components/selects/QSelectEstatusParcela.vue'
import QSelectSeccion from 'src/components/selects/QSelectSeccion.vue'

const route = useRoute()
const $q = useQuasar()
const splitterModel = ref(20)
const tab = ref('detalles')

/**
 * DETALLES
 */

const parcelaDetalles = ref({
  propietario_id: null,
  pariente_mas_cercano: null,
  estatus: null,
  descripcion: null,
  codigo_seccion: null,
  num_parcela: null,
  num_fila: null
});

const puestosData = ref({});

const agregarClienteDialog = ref(null)
const generarContratosDialog = ref(null)

const openDialogGenerarContratos = () => {
  generarContratosDialog.value.openDialog()
}

const contratosParams = ref([])

const parcelaData = ref([])

const isLoadingDetalles = ref(true)
const isLoadingPuestos = ref(false)

const handleGenerarContratos = () => {
  getData();
}

const handleSubmitDetalles = () => {

  isLoadingDetalles.value = true;

  let postData = { ...parcelaDetalles.value }

  api.post('parcelas/' + route.params.id + '/detalles', postData)
    .then(response => {
      console.log(postData);
      if (response.data) {
        getData();
        $q.notify({ message: 'Guardado exitosamente.', color: 'positive' })
      }
    })
    .catch(error => qNotify(error, 'error', {callback: handleSubmitDetalles}))
    .finally(() => isLoadingDetalles.value = false)

}

const handleSubmitPuestos = () => {

  isLoadingPuestos.value = true;

  let postData = Object.values(puestosData.value).map(puesto => {
    return { ...puesto }
  })

  api.post('parcelas/' + route.params.id + '/puestos', postData)
    .then(response => {
      console.log(postData);
      if (response.data) {
        getData();
        $q.notify({ message: 'Guardado exitosamente.', color: 'positive' })
      }
    })
    .catch(error => qNotify(error, 'error', {callback: handleSubmitPuestos}))
    .finally(() => isLoadingPuestos.value = false)

}

function getData() {

  isLoadingDetalles.value = true;

  api.get('parcelas/' + route.params.id)
    .then(response => {
      parcelaData.value = response.data;

      Object.keys(response.data).forEach((i) => {
        if (parcelaDetalles.value.hasOwnProperty(i)) parcelaDetalles.value[i] = response.data[i]
      })

      if (response.data?.puestos) {
        response.data.puestos.forEach(puesto => {
          puestosData.value[puesto.id] = puesto;
        });
      }
    })
    .finally(() => isLoadingDetalles.value = false)

  api.get('parcelas/params')
    .then(response => {
      if (response.data) {
        contratosParams.value = response.data
      }
    })
}

const handleDownloadPdf = (contratoId) => {
  api.get('contratos/' + contratoId + '/pdf', { responseType: 'blob' })
    .then((response) => {
      console.log(response);
      window.open(URL.createObjectURL(response.data));
    })
    .catch(async error => {
      error.response.data = JSON.parse(await error.response.data.text());
      qNotify(error, 'error', { callback: () => handleDownloadPdf(contratoId) });      
    })
}

onMounted(() => getData());

</script>
