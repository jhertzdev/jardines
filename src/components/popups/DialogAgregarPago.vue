<template>
  <q-dialog allow-focus-outside v-model="showModalAgregarPago" class="j-dialog j-dialog-xl">
    <q-card>
      <q-card-section class="q-pa-none">
        <div class="row">
          <div class="col-12 col-md-5 q-py-lg">
            <div class="text-h6 text-primary text-center q-mb-lg">Detalles del recibo</div>
            <q-list separator bordered>
              <q-item v-for="item in transaccionData?.lineas || []">
                <q-item-section style="display: block">
                  <span>{{ item.descripcion }}</span> <span class="text-grey text-caption">x {{ item.cantidad }}</span>
                </q-item-section>
                <q-item-section side class="text-right">
                  <div class="text-body2 text-dark">REF. {{ $dinero(item.total_ref) }}</div>
                  <div class="text-caption">{{ transaccionData?.simbolo }} {{ $dinero(item.total_ref * (transaccionData?.tasa_actual || 1)) }}</div>
                </q-item-section>
              </q-item>
            </q-list>
            <q-table flat square bordered hide-bottom hide-header :columns="totalsColumns" :rows="totalsData" :pagination="{ rowsPerPage: 0 }">
              <template v-slot:body="props">
                <q-tr :props="props" class="text-right" :class="props.rowIndex + 1 == totalsData.length && 'bg-primary text-white'" v-show="!!props.row.total">
                  <q-td key="tipo" :props="props" class="text-right">
                    <span class="text-weight-bold" style="font-size: .95rem">{{ props.row.tipo || '-' }}</span>
                  </q-td>
                  <q-td key="total" :props="props" class="text-right">
                    <div class="q-pl-xl" :class="props.rowIndex + 1 == totalsData.length && 'text-h5'">{{ $dinero(props.row.total) }}</div>
                    <div class="text-grey">{{ $dinero(props.row.total * (transaccionData?.tasa_actual || 1)) }} {{ transaccionData?.simbolo }}</div>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <q-separator class="q-my-md" />
            <div class="q-pl-md">
              <q-input type="textarea" outlined v-model="transaccionData.descripcion" rows="4" label="Descripción del recibo" placeholder="Escribe una descripción para el recibo, que se mostrará en la versión impresa" readonly/>
            </div>
          </div>
          <div class="col-12 col-md-7 q-pa-lg text-center">
            <div class="text-h6 text-primary">Cantidad total a pagar</div>
            <div class="q-my-lg">
              <div class="text-h3">
                <span class="text-body1 text-grey-9">{{ transaccionData?.simbolo }}</span> {{ $dinero(totalBalance * (transaccionData?.tasa_actual || 1) ) }}
              </div>
              <div class="text-h6">
                <span class="text-caption text-grey-9">REF.</span> {{ $dinero(totalBalance) }}
              </div>
            </div>

            <q-table flat bordered hide-bottom hide-header
              class="q-mt-md" selection="multiple"
              v-model:selected="metodosPagoSelected"
              :rows="metodosPago" :columns="metodosPagoColumnas">
              <template v-slot:body-cell-cantidad="props">
                <q-td :props="props" class="text-center">
                  <template v-if="metodosPagoSelected.includes(props.row)">
                    <q-input dense v-model="props.row[props.col.name]" type="number" step="0.01" label="Cantidad pagada"
                      @update:model-value="val => props.row['monto_transaccion'] = val / props.row.tasa * transaccionData.tasa_actual" required>
                      <template v-slot:append>
                        <span class="text-body1 text-primary">{{ props.row.simbolo }}</span>
                      </template>
                    </q-input>
                    <q-input dense v-model="props.row['referencia']" label="Referencia" v-if="props.row['tipo_metodo'] != 'Efectivo'"
                      debounce="500" @update:model-value="val => handleVerificarReferencia(props.row, val)" :error="props.row.referencias_usadas?.length > 0 && !props.row['referencia_usada']" hide-bottom-space>
                      <template v-slot:error>
                        La refencia ya ha sido usada.
                      </template>
                    </q-input>
                    <q-checkbox dense class="q-mt-xs" v-if="props.row.referencias_usadas?.length > 0" :model-value="!!props.row['referencia_usada']" @update:model-value="props.row['referencia_usada'] = !props.row['referencia_usada']" label="Utilizar referencia igualmente" />
                  </template>
                </q-td>
              </template>
            </q-table>

            <div class="q-gutter-md q-my-sm text-right">
              <q-btn label="Cerrar" flat color="primary" @click="showModalAgregarPago = false" />
              <q-btn label="Guardar" icon="credit_card" color="primary" @click="handleSubmitAgregarPago" />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, onMounted, watch, toRef } from "vue";
  import { api } from "src/boot/axios";
  import { useRouter } from "vue-router";
  import { $dinero, qNotify } from 'src/boot/jardines';
  import { useAppStore } from "src/stores/app.store";
  import { format } from "date-fns";

  const appStore = useAppStore();
  const router = useRouter()

  const isLoading = ref(false)
  const isLoadingSubmit = ref(false)
  const cajas = ref([])

  const monedas = computed(() => {
    return appStore.monedas.filter(moneda => !parseInt(moneda.es_principal))
  })

  const monedaPrincipal = computed(() => {
    return appStore.monedas.find(moneda => parseInt(moneda.es_principal))
  })

  const tipoTransaccion = ref('Pendiente')

  const searchQuery = ref('')

  const transaccionData = ref({
    lineas: [],
    descripcion: ''
  })

  const showModalAgregarPago = ref(false)

  const transaccionId = ref(null)
  const cajaId = ref(null)

  const openDialog = (id = null, defaultData = {}) => {

    metodosPagoSelected.value = []

    metodosPago.value.forEach(metodo => {
      delete metodo.cantidad;
      delete metodo.monto_transaccion;
      delete metodo.referencia;
      delete metodo.referencia_usada;
      delete metodo.referencias_usadas;
    })

    if (id) {
      transaccionId.value = id
      api.get('caja/transacciones/' + id)
        .then((response) => {
          console.log(response.data);
          transaccionData.value = response.data;
          showModalAgregarPago.value = true;
        })
    } else {

      if (defaultData.caja_id) {
        cajaId.value = defaultData.caja_id
      }

      transaccionData.value = defaultData
      showModalAgregarPago.value = true;
    }

  }

  const totalsData = computed(() =>[
    {
      tipo: 'Subtotal',
      total: transaccionData.value?.subtotal
    },
    {
      tipo: 'Impuestos',
      total: transaccionData.value?.impuestos
    },
    {
      tipo: 'Descuentos',
      total: transaccionData.value?.descuentos
    },
    {
      tipo: 'Pagado',
      total: transaccionData.value?.total_pagado
    },
    {
      tipo: 'Total',
      total: transaccionData.value?.balance
    }
  ])

  const metodosPago = ref([])

  const metodosPagoSelected = ref([])

  const metodosPagoColumnas = [
    { name: 'metodo', label: 'Método de pago', align: 'left', field: 'metodo' },
    { name: 'cantidad', label: 'Cantidad', align: 'left', field: 'cantidad' },
  ]

  const totalBalance = computed(() => {
    let totalFinal = transaccionData.value.balance || 0

    let totalPagado = 0

    // Tomar en cuenta la tasa de cada método de pago para restar del total final
    for (let i = 0; i < metodosPagoSelected.value.length; i++) {
      let metodo = metodosPagoSelected.value[i];
      totalPagado += (metodo.cantidad || 0) / (metodo.tasa || 1);
    }

    let balance = totalFinal - totalPagado;

    return balance;
  })

  const handleVerificarReferencia = (row, value) => {
    api.post('caja/transacciones/verificarReferencia', { referencia: value })
      .then(response => {
        console.log('response', response);
        if (response.data?.data) {
          row.referencias_usadas = response.data.data
        } else {
          row.referencias_usadas = null
        }

        if (!row.referencia_usada) row.referencia_usada = false
      })
      .catch(error => qNotify(error, 'error', { callback: handleVerificarReferencia }))
  }

  const handleSubmitAgregarPago = () => {

    if (!metodosPagoSelected?.value?.length) {
      qNotify('Debes seleccionar al menos un método de pago', 'error')
      return;
    }

    let error = false;

    metodosPagoSelected.value.forEach(metodo => {
      console.log(metodo);
      if (!metodo.cantidad || parseFloat(metodo.cantidad) <= 0) {
        error = `El pago por "${metodo.metodo}" debe tener una cantidad válida.`;
        return;
      }

      if (metodo.tipo_metodo != 'Efectivo' && !metodo.referencia) {
        error = `El pago por "${metodo.metodo}" debe tener una referencia.`
        return;
      }

      if (metodo.referencias_usadas?.length && !metodo.referencia_usada) {
        error = `Confirma el uso de la referencia por "${metodo.metodo}".`
        return;
      }
    });

    if (error) {
      qNotify(error, 'error')
      return;
    }

    let postData = {
      pagos: metodosPagoSelected?.value?.map(pago => {
        return {
          metodo_pago_id: pago.id,
          monto: pago.cantidad,
          monto_transaccion: pago.monto_transaccion,
          referencia: pago.referencia,
          moneda_id: pago.moneda_id,
          tasa_ref: pago.tasa,
          caja_id: cajaId.value ? cajaId.value : appStore.cajaSeleccionada?.id,
          cliente_id: transaccionData.value.cliente_id,
          transaccion_id: transaccionData.value.id,
        }
      }),
      caja_id: cajaId.value ? cajaId.value : appStore.cajaSeleccionada?.id,
    }

    console.log('postData', postData);

    if (transaccionId.value) {
      api.post('caja/transacciones/' + transaccionData.value.id + '/pagos', postData)
        .then(response => {
          qNotify('Pago agregado correctamente', 'positive')
          showModalAgregarPago.value = false
          //transaccionesTableRef.value.requestServerInteraction()
        })
        .catch(error => {
          qNotify(error, 'error')
        });
    } else {
      showModalAgregarPago.value = false
      emit('updated', postData)
    }
  }

  onMounted(() => {
    /*if (transaccionesTableRef.value) {
      transaccionesTableRef.value.requestServerInteraction()
    }*/

    api.get('caja/cajas')
      .then(response => {
        if (response.data) {
          cajas.value = response.data
        }
      })
      .catch(error => qNotify(error, 'error'))
      .finally(() => isLoading.value = false)

    api.get('caja/metodos')
      .then(response => {
        if (response.data) {
          console.log('Metodos', response.data)
          metodosPago.value = response.data
        }
      })
      .catch(e => console.log(e))

    appStore.getMonedas()
  })


defineExpose({ openDialog })
const emit = defineEmits(['updated'])

</script>
