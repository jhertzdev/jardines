<template>
  <div class="row q-col-gutter-md" style="display:none">
    <div class="col-sm-4 col-12">
      <q-card class="my-card q-mb-md" v-for="option in dashboardOptions">
        <q-card-section class="bg-primary text-white">
          <div class="text-h4"><q-icon :name="option.icon" /> {{ option.name }}</div>
          <q-skeleton height="50px" type="QBadge" dark style="margin-left: auto; margin-right: 0;" v-if="isLoading" />
          <div class="text-right text-h3" v-else>{{ option.count }}</div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat icon-right="arrow_forward_ios" @click="router.push(option.path)">Ver {{ option.name }}</q-btn>
        </q-card-actions>
      </q-card>
    </div>
    <div class="col-sm-8 col-12">
      <q-card class="q-mb-md">
        <q-card-section>
          <q-input debounce="500" v-model="searchQuery" placeholder="Buscar..." />
        </q-card-section>
      </q-card>
      <q-card>
        <template v-if="searchResults.clientes">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Clientes</div>
          </q-card-section>
          <q-card-section v-if="!searchResults.clientes.length">
            No hay clientes que mostrar.
          </q-card-section>
          <q-card-section v-else>
            <q-markup-table flat bordered separator="cell" wrap-cells>
              <thead>
                <tr>
                  <th class="text-left">Cliente</th>
                  <th class="text-left">Ubicación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cliente in searchResults.clientes">
                  <td>{{ `${cliente.nombre} ${cliente.apellido}`}}
                    <br/>
                    ({{ `${cliente.doc_identidad}-${cliente.doc_numero}` }}) <q-badge>{{ cliente.tipo_cliente }}</q-badge></td>
                  <td>
                    <btn-link :label="`${parcela.codigo_seccion}-${parcela.num_parcela}`" :to="`/app/ubicaciones/${parcela.id}`" v-for="parcela in cliente.parcelas" />
                    <br/>
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </template>
        <template v-if="searchResults.parcelas">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Ubicaciones</div>
          </q-card-section>
          <q-card-section v-if="!searchResults.parcelas.length">
            No hay ubicaciones que mostrar.
          </q-card-section>
          <q-card-section v-else>
            <q-markup-table flat bordered separator="cell" wrap-cells>
              <thead>
                <tr>
                  <th class="text-left">Ubicación</th>
                  <th class="text-left">Estatus</th>
                  <th class="text-left">Propietario/a</th>
                  <th class="text-left">Ocupante/s</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="parcela in searchResults.parcelas">
                  <td>
                    <router-link :to="`/app/ubicaciones/${parcela.id}`">
                      {{ `${parcela.codigo_seccion}-${parcela.num_parcela}` }}
                    </router-link>
                  </td>
                  <td>{{ parcela.estatus }}</td>
                  <td>
                    <template v-if="parcela.propietario_id">
                      {{ parcela.propietario_nombre }}<br/>({{ parcela.propietario_identidad }})
                    </template>
                    <template v-else> - </template>
                  </td>
                  <td>
                    {{ parcela.puestos
                        .map(p => `${p.ocupante_nombre} (${p.ocupante_identidad})`)
                        .join(', ') || '-' }}
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </template>
        <template v-if="searchResults.contratos">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Contratos</div>
          </q-card-section>
          <q-card-section v-if="!searchResults.contratos.length">
            No hay contratos que mostrar.
          </q-card-section>
          <q-card-section v-else>
            <q-markup-table flat bordered separator="cell" wrap-cells>
              <thead>
                <tr>
                  <th class="text-left">Parcela</th>
                  <th class="text-left">Estatus</th>
                  <th class="text-left">Propietario/a</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contrato in searchResults.contratos">
                  <td>{{ contrato.codnum_contrato }}</td>
                  <td>{{ contrato.estatus }}</td>
                  <td>
                    <template v-if="contrato.propietario_id">
                      {{ contrato.propietario_nombre }}<br/>({{ contrato.propietario_identidad }})
                    </template>
                    <template v-else> - </template>
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </template>
      </q-card>
    </div>
  </div>
</template>

<style>
.q-table .btn-link {
  margin: 2px 3px;
}

body:not(.q-body--prevent-scroll) .page-dashboard .card-busqueda {
  height: calc(100vh - 90px) !important;
  box-shadow: none !important;
}

body:not(.q-body--prevent-scroll) .page-dashboard .card-busqueda-row {
  flex-flow: column !important;
}

body:not(.q-body--prevent-scroll) .page-dashboard .card-busqueda-row .results-wrapper {
  width: 100%;
  padding: 10px 15px;
  height: 90%;
}

body:not(.q-body--prevent-scroll) .page-dashboard .card-busqueda-close {
  display: none !important
}
</style>

<script setup>

import { ref, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { qNotify } from 'src/boot/jardines';
import BtnLink from "components/BtnLink.vue"

const $q = useQuasar()

const isLoading = ref(true)

const searchQuery = ref('')

watch(searchQuery, query => {

  if (!query || query.length < 3) return searchResults.value = {};

  const searchParams = new URLSearchParams;
  searchParams.append('q', query)

  api.get('search?' + searchParams.toString())
    .then(response => {
      if (response.data) searchResults.value = response.data
    })
    .catch(error => console.log(error))

})

const dashboardOptions = ref([
  {
    name: "Clientes",
    path: "/app/clientes",
    key: "clientes",
    icon: "people",
    count: 0,
  },
  {
    name: "Parcelas",
    path: "/app/parcelas",
    key: "parcelas",
    icon: "yard",
    count: 0,
  },
])

const searchResults = ref({});

const emit = defineEmits(['toggleBusqueda'])

onMounted(() => {
  api.get('pages/dashboard')
    .then(response => {
      if (response.data) {
        Object.keys(response.data).forEach(k => {
          let index = dashboardOptions.value.findIndex(option => option.key === k)
          if (index > -1) {
            dashboardOptions.value[index].count = response.data[k]
          }
        });
      }
    })
    .catch(error => qNotify(error, 'error'))
    .finally(() => isLoading.value = false)

  emit('toggleBusqueda', true)
})


const router = useRouter()




</script>
