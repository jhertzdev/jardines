<template>

  <div class="row full-width">
    <div class="col-md-4 col-12">
      <q-card class="q-pa-md" :class="$q.screen.lt.md ? 'q-mb-sm' : 'q-mr-sm'">
        <table class="info-table">
          <tr>
            <th colspan="2" style="text-align: right;">CONTRATOS</th>
          </tr>
        </table>
      </q-card>
    </div>
    <div class="col-md-8 col-12">
      <div :class="$q.screen.lt.md ? 'q-mt-sm q-py-md' : 'q-ml-sm q-px-md'">

        <div class="q-gutter-md">
          <q-btn label="Generar contratos" icon="description" color="primary" @click="openDialogGenerarContratos" />
        </div>
        <q-separator class="q-my-lg" />

        <q-table
          :rows="contratos"
          :columns="contratosColumnas"
          row-key="id"
          :class="!$q.screen.lt.md && 'text-wrap'"
          ref="contratosTableRef"
          v-model:pagination="contratosTablePagination"
          :loading="contratosTableLoading"
          :filter="contratosTableFilter"
          @request="contratosTableRequest"
        >
          <template v-slot:top-right>
            <q-input dense debounce="300" v-model="contratosTableFilter" placeholder="Buscar...">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
          <template v-slot:body-cell-actions="props">
            <!--<q-td :props="props" style="width: 100px;" class="q-gutter-xs">
              <q-btn outline icon="visibility" size="sm" color="blue" dense
                @click="router.push('/parcelas/' + props.row.id)" />
              <q-btn outline icon="delete" size="sm" color="negative" dense
                @click="openDialogEliminarParcela(props.row.id)" />
            </q-td>-->
          </template>
          <template v-slot:body-cell="props">
            <q-td :props="props">
              {{ props.value || '-' }}
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </div>

  <DialogGenerarContratosMultiple ref="generarContratosDialog" @created="handleGenerarContratos" />

</template>

<script setup>

import { ref, reactive, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

// Dialogs
import DialogGenerarContratosMultiple from "src/components/popups/DialogGenerarContratosMultiple.vue";

const generarContratosDialog = ref(null)

const openDialogGenerarContratos = () => {
  generarContratosDialog.value.openDialog()
}

const handleGenerarContratos = (data) => {
  console.log('Contratos Generados', data);
}

const parcelas = ref([])

</script>
