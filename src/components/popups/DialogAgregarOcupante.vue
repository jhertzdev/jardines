<template>
  <q-dialog allow-focus-outside v-model="dialog" class="j-dialog">
    <q-card>
      <q-card-section>
        <div class="text-h6">Agregar ocupante</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <QSelectCliente dense outlined clearable v-model="agregarOcupanteData.ocupante_id"
              label="Selecciona un ocupante" />
          </div>
          <div class="col-12 text-right text-caption text-grey-6">
            <template v-if="parseInt(agregarOcupanteData.ocupante_id)">
              <q-btn id="btnEditPlotOwner" flat dense class="q-mr-sm" size="sm" label="Editar" icon="edit"
                color="primary" @click="(e) =>agregarDifuntoDialog.openDialog(agregarOcupanteData.ocupante_id, e)"
              />
            </template>
            <span>¿El difunto no existe?</span>
            <q-btn flat dense class="q-ml-sm" size="sm" label="Agregar" color="primary"
              @click="(e) => agregarDifuntoDialog.openDialog(null, e)" />
          </div>
          <div class="col-12">
            <q-input type="datetime-local" dense outlined stack-label label="Fecha de inhumación"
              v-model="agregarOcupanteData.fecha_inhumacion" />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn color="primary" label="Agregar" icon="add" :loading="isLoadingPuestos" @click="handleOcuparPuesto" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <DialogAgregarDifunto ref="agregarDifuntoDialog" @created="handleCreatedDifunto" @updated="handleUpdatedDifunto"
    :difunto="true" />
</template>

<script setup>
  import { ref } from 'vue';
  import QSelectCliente from 'src/components/selects/QSelectCliente.vue';
  import QSelectDatetime from 'src/components/selects/QSelectDatetime.vue';
  import { useQuasar } from 'quasar';
  import { api } from 'src/boot/axios';

  const agregarOcupanteData = ref({
    ocupante_id: null,
    fecha_inhumacion: null
  });
  const isLoadingPuestos = ref(false);
  const $q = useQuasar();

  const agregarDifuntoDialog = ref(null)

  const dialog = ref(false)
  const dataId = ref(null)

  const openDialog = (id, event = null) => {
    dataId.value = id;
    getData();
    dialog.value = true
  }

  function getData() {
    api
      .get("parcelas/" + dataId.value)
      .then((response) => {
        console.log('parceladata', response)
      })
      //.finally(() => (isLoadingDetalles.value = false));
  }

  defineExpose({ openDialog })

  const handleOcuparPuesto = () => {
    isLoadingPuestos.value = true;

    let postData = agregarOcupanteData.value;

    api.post("parcelas/" + dataId.value + "/ocupar", postData)
      .then((response) => {
        if (response.data) {
          getData();
          $q.notify({
            message: "Fallecido asignado exitosamente.",
            color: "positive",
          });
        }
      })
      .catch((error) => qNotify(error, "error", { callback: handleOcuparPuesto }))
      .finally(() => (isLoadingPuestos.value = false));
  };
</script>
