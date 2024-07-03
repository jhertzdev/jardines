<template>
  <q-select v-model="props.modelValue" :dense="props.dense" :outlined="props.outlined" :options="options" :label="props.label || ''" :hint="props.hint || ''"
    :lazy-rules="props.required" :rules="[val => !props.required || (val && val.length > 0) || props.rule ]"
    :clearable="clearable" use-input input-debounce="500" @filter="filterFn" emit-value map-options :multiple="multiple" :use-chips="multiple" @update:model-value="updateValue"/>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { obtenerValoresFaltantes } from 'src/boot/jardines'
import { ref, onMounted } from 'vue'

const filterFn = (val, update) => {
  let params = val ? {q: val} : null
  getOptions(params).then(() => {
    update()
  })
}

const props = defineProps({
  dense: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: true,
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
  rules: {
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

const emit = defineEmits(['update:modelValue'])

const fullData = ref([])

const updateValue = (value) => {
  emit('update:modelValue', value)

  if (fullData.value.length) {
    let itemData = fullData.value.find(item => item.id == value)
    if (itemData) {
      emit('selected', itemData)
    }
  }
}

const options = ref([]);

async function getOptions(params = null) {

  let endpoint = 'contratos';
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

      console.log('Contratos', response.data);
      options.value = []

      fullData.value = response.data.data;

      response.data.data.forEach(row => {
        options.value.push({
          label: `${row.codigo_contrato}-${row.num_contrato}`,
          value: row.id,
        })
      })

      // Obtener valores seleccionados previamente

      const valoresFaltantes = obtenerValoresFaltantes(props.modelValue, options.value);
      if (valoresFaltantes.length) {
        const response2 = await api.get('contratos?id=' + valoresFaltantes.join(',') + '&rowsPerPage=-1')
        if (response2.data) {
          console.log('response2', response2.data);
          response2.data.data.forEach(row => {
            fullData.value.push(row);
            options.value.push({
              label: `${row.codigo_contrato}-${row.num_contrato}`,
              value: row.id,
            })
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
