<template>
  <q-select v-model="props.modelValue" :dense="props.dense" :outlined="props.outlined" :options="options" :label="props.label || ''" :hint="props.hint || ''"
    :lazy-rules="props.required" :rules="[val => !props.required || (val && val.length > 0) || props.rule ]" :style="(!props.rule || props.hideBottomSpace) && 'margin-bottom: -20px;'"
    :clearable="clearable" use-input input-debounce="500" emit-value map-options @update:model-value="updateValue" :hide-bottom-space="props.hideBottomSpace"/>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted } from 'vue'

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
  },
  hideBottomSpace: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const updateValue = (value) => {
  emit('update:modelValue', value)
}

const options = ref([]);

async function getOptions(params = null) {

  let endpoint = 'empresas';

  const searchParams = new URLSearchParams();

  if (params) {
    Object.keys(params).forEach(key => {
      searchParams.append(key, params[key])
    });
  }

  if (Object.keys(props.filters).length) {
    Object.keys(props.filters).forEach(key => {
      searchParams.append(key, props.filters[key])
    });
  }

  endpoint += '?' + searchParams.toString();

  try {
    const response = await api.get(endpoint)
    if (response.data) {
      options.value = []
      response.data.forEach(row => {
        options.value.push({
          label: `${row.razon_social} (${row.rif})`,
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
