<template>
  <q-select v-model="props.modelValue" :dense="props.dense" :outlined="props.outlined" :options="options" :label="props.label || ''" :hint="props.hint || ''"
    :lazy-rules="props.required" :rules="[val => !props.required || (val && val.length > 0) || props.rule ]" :style="!props.rule && 'margin-bottom: -20px;'"
    :clearable="clearable" use-input input-debounce="500" @filter="filterFn" emit-value map-options @update:model-value="updateValue"/>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted, watch } from 'vue'

const filterFn = (val, update) => {
  let params = val ? {s: val} : null
  getOptions(params).then(() => {
    update()
  })
}

watch(() => props.modelValue, val => {
  // TODO: Optimizar para que no solicite las opciones dos veces
  let params = val ? {s: val} : null
  getOptions(params).then(() => {
    update()
  })
})

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
    type: String
  }
})

const emit = defineEmits(['update:modelValue'])

const updateValue = (value) => {
  console.log(value);
  emit('update:modelValue', value)
}

const options = ref([]);

async function getOptions(params = null) {

  const initOptions = []

  if (props.modelValue) {
    const response = await api.get('clientes/' + props.modelValue + '?with[]=data');
    if (response.data) {
      initOptions.push({
        label: `${response.data.nombre_completo} (${response.data.num_identidad})`,
        value: response.data.id,
      })
    }
  }

  console.log('propsss', props, initOptions);

  let endpoint = 'clientes';
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

  searchParams.append('sortBy', 'id');
  searchParams.append('order', 'desc');

  endpoint += '?' + searchParams.toString();
  console.log(endpoint);

  try {
    const response = await api.get(endpoint)
    if (response.data) {

      console.log(response.data);
      options.value = []
      response.data.data.forEach(row => {
        options.value.push({
          label: `${row.nombre_completo} (${row.num_identidad})`,
          value: row.id,
        })
      })

      // Si falta identificar al cliente seleccionado
      if (props?.modelValue && !options.value.map(val => val.id).includes(props.modelValue)) {
        const response2 = await api.get('clientes/' + props.modelValue)
        if (response2.data) {
          options.value.push({
            label: `${response2.data.nombre_completo} (${response2.data.num_identidad})`,
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
