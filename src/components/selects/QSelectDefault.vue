<template>
  <q-select v-model="model" :dense="props.dense" :outlined="props.outlined" :options="options" :label="props.label || ''"
    :hint="props.hint || ''" :lazy-rules="props.required" :rules="[val => !props.required || (val && val.length > 0) || props.rule ]"
    :clearable="clearable" :style="!props.rule && 'margin-bottom: -20px;'" emit-value map-options @update:model-value="updateValue" />
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted } from 'vue'

const model = ref(props.modelValue);

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

  let endpoint = 'secciones';
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
          label: `${row.nombre} (${row.codigo_seccion})`,
          value: row.codigo_seccion,
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