<template>
  <q-dialog v-model="dialog" class="j-dialog j-dialog-lg">
    <q-table :rows="parcelas" flat :columns="parcelasColumnas" row-key="id" :class="!$q.screen.lt.md && 'text-wrap'"
      ref="parcelasTableRef" v-model:pagination="parcelasTablePagination" :loading="parcelasTableLoading"
      :filter="parcelasTableFilter" @request="parcelasTableRequest" selection="multiple"
      v-model:selected="parcelasSelected">
      <template v-slot:top-right>
        <q-input dense debounce="300" v-model="parcelasTableFilter" placeholder="Buscar...">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-codigo_parcela="props">
        <q-td :props="props" style="width: 100px;" class="q-gutter-xs">
          {{ props.value }}
        </q-td>
      </template>
      <template v-slot:body-cell-propietario="props">
        <q-td :props="props" class="q-gutter-xs">
          <template v-if="props.row.cliente_nombre || props.row.cliente_identidad">
            {{ props.row.cliente_nombre }} ({{ props.row.cliente_identidad }})
          </template>
          <template v-else>-</template>
        </q-td>
      </template>
      <template v-slot:body-cell="props">
        <q-td :props="props">
          {{ props.value || '-' }}
        </q-td>
      </template>
    </q-table>
  </q-dialog>
</template>

<script setup>

  import { ref, onMounted } from 'vue';
  import { api } from 'src/boot/axios';
  import { useQuasar } from 'quasar';
  import { useRoute } from 'vue-router';
  import { qNotify } from 'src/boot/jardines';
  import DialogAgregarCliente from "src/components/popups/DialogAgregarCliente.vue";
  import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';
  import QSelectCliente from 'src/components/selects/QSelectCliente.vue'

  const dialog = ref(false)
  const parcelaData = ref({})
  const asignarParcelaForm = ref(null)

  const isLoadingParcela = ref(true)

  const handleSubmitAsignarParcela = () => {

  }

  const onValidationError = () => {

  }

  const openDialog = (id = null) => {
    isLoadingParcela.value = true;
    api.get('parcelas/' + id)
      .then(response => {
        parcelaData.value = response.data;
      })
      .finally(() => {
        isLoadingParcela.value = false
        dialog.value = true
      })

    /*isLoadingContrato.value = true
    api.get('contratos/' + id)
      .then(response => {
        if (response.data) {
          contratoData.value = response.data
          console.log(response.data);
          if (!contratoData.value.cliente) contratoData.value.cliente = {}
          contratoData.value.parcelasIds = contratoData.value.parcelas?.map(parcela => {
            console.log(parcela.id);
            return parcela.id
          }) || []
          contratoData.value.autocalcular_total = false
  
  
        }
      })
      .finally(() => isLoadingContrato.value = false)*/
  }

  defineExpose({ openDialog })

</script>