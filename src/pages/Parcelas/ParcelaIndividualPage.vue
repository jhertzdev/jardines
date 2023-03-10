<template>
  <q-splitter v-model="splitterModel" :horizontal="$q.screen.lt.lg">

    <template v-slot:before>
      <q-tabs v-model="tab" :vertical="!$q.screen.lt.lg" class="text-grey-5" active-color="primary">
        <q-tab name="detalles" icon="view_timeline" label="Detalles" />
        <q-tab name="ubicacion" icon="location_on" label="Ubicación" />
        <q-tab name="venta" icon="attach_money" label="Venta" />
        <q-tab name="ocupacion" icon="grass" label="Ocupación" />
      </q-tabs>
    </template>

    <template v-slot:after>
      <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up">
        <q-tab-panel name="detalles">
          <q-card class="q-pa-md">
            <q-form>
              <q-card-section>
                <div class="text-h6">Detalles de la parcela</div>
              </q-card-section>

              <q-card-section>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Propietario</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <q-input dense outlined v-model="parcelaDetalles" placeholder="Selecciona un propietario" clearable />
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Descripción</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <q-input dense outlined v-model="parcelaDetalles" placeholder="Escribe una descripción" autogrow />
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Ubicación</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <div class="row q-col-gutter-sm">
                      <div class="col">
                        <q-input dense outlined v-model="parcelaDetalles" placeholder="Área" />
                      </div>
                      <div class="col">
                        <q-input dense outlined v-model="parcelaDetalles" placeholder="Sector" />
                      </div>
                      <div class="col">
                        <q-input dense outlined v-model="parcelaDetalles" placeholder="Parcela" />
                      </div>
                      <div class="col-auto text-grey-8 flex column justify-center">
                        |
                      </div>
                      <div class="col">
                        <q-input dense outlined v-model="parcelaDetalles" placeholder="Fila" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-sm-4 col-12 flex column justify-center">
                    <span class="text-grey-8">Parcela compartida</span>
                  </div>
                  <div class="col-sm-8 col-12">
                    <div class="q-gutter-sm">
                      <q-radio v-model="parcelaDetalles" val="1" label="Sí" />
                      <q-radio v-model="parcelaDetalles" val="" label="No" />
                    </div>
                  </div>
                </div>
                <template v-if="parcelaDetalles">
                  <q-separator class="q-mt-sm q-mb-lg" />
                  <div class="row q-col-gutter-sm q-mb-md" >
                    <div class="col-sm-4 col-12 flex column justify-center">
                      <span class="text-grey-8">Puestos</span>
                    </div>
                    <div class="col-sm-8 col-12">
                      <div class="row q-col-gutter-md">
                        <div class="col">
                          <q-input dense outlined v-model="parcelaDetalles" placeholder="Parcela" />
                        </div>
                        <div class="col">
                          <q-input dense outlined v-model="parcelaDetalles" placeholder="Parcela" />
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                
              </q-card-section>

              <q-card-actions class="justify-end">
                <q-btn flat label="Cancelar" v-close-popup />
                <q-btn type="submit" label="Agregar" color="primary" :loading="isLoadingAgregarEmpresa" />
              </q-card-actions>
            </q-form>
          </q-card>
        </q-tab-panel>
        <q-tab-panel name="ubicacion">
          Ubicación
        </q-tab-panel>
        <q-tab-panel name="venta">
          Venta
        </q-tab-panel>
        <q-tab-panel name="ocupacion">
          Ocupación
        </q-tab-panel>

      </q-tab-panels>
    </template>
  </q-splitter>
</template>

<script setup>

import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';

const route = useRoute()
const $q = useQuasar()
const splitterModel = ref(20)
const tab = ref('detalles')

/**
 * DETALLES
 */

const parcelaDetalles = ref(null);


</script>
