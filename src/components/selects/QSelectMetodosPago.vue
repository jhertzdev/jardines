<template>
  <q-select v-model="props.modelValue" :dense="props.dense" :outlined="props.outlined" :options="options" :label="props.label || ''"
    :hint="props.hint || ''" :lazy-rules="props.required" :rules="[val => !props.required || (val && val.length > 0) || props.rule ]"
    :clearable="clearable" :multiple="props.multiple" :use-chips="!!props.multiple" emit-value map-options @update:model-value="updateValue" />
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted } from 'vue'
import { useAppStore } from 'src/stores/app.store';

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
  multiple: {
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

const appStore = useAppStore()

async function getOptions() {

  let endpoint = 'caja/metodos';

  try {
    const response = await api.get(endpoint)

    if (response.data) {
      options.value = []
      response.data.forEach(row => {
        options.value.push({
          label: appStore.metodosDePago.find(item => item.id == row.id)?.metodo,
          value: parseInt(row.id),
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