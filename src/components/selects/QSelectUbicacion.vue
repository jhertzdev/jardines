<template>
  <q-select v-model="selectedId" :dense="props.dense" :outlined="props.outlined" :options="options" :label="props.label || ''" :hint="props.hint || ''"
    :lazy-rules="props.required" :rules="[val => !props.required || (val && val.length > 0) || props.rule ]" :style="!props.rule && 'margin-bottom: -20px;'"
    :clearable="clearable" use-input input-debounce="500" @filter="filterFn" emit-value map-options @update:model-value="updateValue"/>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { obtenerValoresFaltantes } from 'src/boot/jardines'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  dense: {
    type: Boolean,
    default: false,
  },
  outlined: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: 'Selecciona una opción',
  },
  hint: {
    type: String,
    default: null,
  },
  rule: {
    type: String,
    default: '',
  },
  filters: {
    type: Object,
    default: {}
  },
  modelValue: {
    type: Array,
    default: []
  }
})

const selectedId = ref(props.modelValue ? props.modelValue.toString() : null);

const filterFn = (val, update) => {
  let params = val ? {q: val} : null
  getOptions(params).then(() => {
    update()
  })
}

watch(() => props.modelValue, async (val) => {

  selectedId.value = val ? val.toString() : null

  let params = val ? {s: val} : null
  await getOptions(params)

  // If the modelValue is set and it's not in the options, fetch it
  if (selectedId.value && !options.value.find(option => option.value === selectedId.value)) {
    const response = await api.get('parcelas/' + selectedId.value)
    if (response.data) {
      options.value.push({
        label: `${row.codigo_seccion}-${row.num_parcela} (${row.estatus})`,
        value: response.data.id,
      })
    }
  }

})

console.log('parcelprops', props.modelValue);

const emit = defineEmits(['update:modelValue', 'selected'])

const fullData = ref([])

const updateValue = (value) => {
  emit('update:modelValue', value)

  if (fullData.value.length) {
    let itemData = fullData.value.filter(item => value.includes(item.id));
    if (itemData) {
      emit('selected', itemData)
    }
  }
}

const options = ref([]);

async function getOptions(params = null) {

  let endpoint = 'parcelas';
  const searchParams = new URLSearchParams();

  if (params) {
    Object.keys(params).forEach(key => {
      searchParams.append(key, params[key])
    });
  }

  if (props.filters && Object.keys(props.filters).length) {
    Object.keys(props.filters).forEach(key => {
      searchParams.append(`f[${key}]`, props.filters[key])
    });
  }

  endpoint += '?' + searchParams.toString();
  console.log(endpoint);

  try {
    const response = await api.get(endpoint)
    if (response.data) {
      options.value = []

      fullData.value = response.data.data;

      response.data.data.forEach(row => {
        options.value.push({
          label: `${row.codigo_seccion}-${row.num_parcela} (${row.estatus})`,
          value: row.id,
        })
      })

      // Obtener valores seleccionados previamente

      // Si falta identificar la ubicación seleccionada
      if (props?.modelValue && !options.value.map(val => val.id).includes(selectedId.value)) {
        const response2 = await api.get('parcelas/' + selectedId.value)
        if (response2.data) {
          fullData.value.push(response2.data);
          options.value.push({
            label: `${response2.data.codigo_seccion}-${response2.data.num_parcela} (${response2.data.estatus})`,
            value: response2.data.id,
          })
        }
      }

      return true
    }
  } catch (error) {
    return false;
  }
}

onMounted(() => {
  getOptions()
})

</script>
