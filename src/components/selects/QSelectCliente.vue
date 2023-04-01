<template>
  <q-select v-model="props.modelValue" :dense="props.dense" :outlined="props.outlined" :options="options" :label="props.label || ''" :hint="props.hint || ''"
    :lazy-rules="props.required" :rules="[val => !props.required || (val && val.length > 0) || props.rule ]" :style="!props.rule && 'margin-bottom: -20px;'"
    :clearable="clearable" use-input input-debounce="500" @filter="filterFn" emit-value map-options @update:model-value="updateValue"/>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted } from 'vue'

const filterFn = (val, update) => {
  let params = val ? {s: val} : null
  getOptions(params).then(() => {
    update()
  })
}

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
  modelValue: {
    type: String
  }
})

const emit = defineEmits(['update:modelValue'])

const updateValue = (value) => {
  emit('update:modelValue', value)
}

const options = ref([]);

async function getOptions(params = null) {

  let endpoint = 'clientes';
  if (params) {
    const searchParams = new URLSearchParams(params);
    endpoint += '?' + searchParams.toString();
  }

  try {
    const response = await api.get(endpoint)
    if (response.data) {
      options.value = []
      response.data.forEach(row => {
        options.value.push({
          label: `${row.nombre_completo} (${row.num_identidad})`,
          value: row.id,
        })
      })
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
