<template>
  <q-select
    v-bind="$attrs"
    v-model="selectedId"
    :options="options"
    :rules="[val => !props.required || (val && val.length > 0) || props.rule ]"
    :style="!props.rule && 'margin-bottom: -20px;'"
    :label="props.label"
    use-input
    input-debounce="500"
    @filter="filterFn"
    emit-value
    map-options
    @update:model-value="updateValue"/>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
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
  required: {
    type: Boolean,
    default: false
  }
})

const selectedId = ref(props.modelValue ? props.modelValue.toString() : null);

const filterFn = (val, update) => {
  let params = val ? {s: val} : null
  getOptions(params).then(() => {
    update()
  })
}

watch(() => props.modelValue, async (val) => {

  selectedId.value = val ? val.toString() : null

  let params = val ? {s: val} : null
  await getOptions(params)

  console.log('update', val, options.value);

  // If the modelValue is set and it's not in the options, fetch it
  if (selectedId.value && !options.value.find(option => option.value === selectedId.value)) {
    const response = await api.get('clientes/' + selectedId.value)
    if (response.data) {
      options.value.push({
        label: `${response.data.nombre_completo} (${response.data.num_identidad ? response.data.num_identidad : 'ID#' + response.data.id})`,
        value: response.data.id,
      })
    }
  }

})

const emit = defineEmits(['update:modelValue', 'selected'])

const fullData = ref([])

const updateValue = (value) => {
  emit('update:modelValue', value)

  if (fullData.value.length) {
    let itemData = fullData.value.find(item => value === item.id);
    if (itemData) {
      emit('selected', itemData)
    }
  }
}

const options = ref([]);

async function getOptions(params = null) {

  const initOptions = []

  if (selectedId.value) {
    const response = await api.get('clientes/' + selectedId.value + '?with[]=data');
    if (response.data) {
      initOptions.push({
        label: `${response.data.nombre_completo} (${response.data.num_identidad ? response.data.num_identidad : 'ID#' + response.data.id})`,
        value: response.data.id,
      })
    }
  }

  //console.log('propsss', props, initOptions);

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
  //console.log(endpoint);

  try {
    const response = await api.get(endpoint)
    if (response.data) {

      //console.log(response.data);
      options.value = []

      fullData.value = response.data.data;

      response.data.data.forEach(row => {
        options.value.push({
          label: `${row.nombre_completo} (${row.num_identidad ? row.num_identidad : 'ID#' + row.id})`,
          value: row.id,
        })
      })

      // Si falta identificar al cliente seleccionado
      if (props?.modelValue && !options.value.map(val => val.id).includes(selectedId.value)) {
        const response2 = await api.get('clientes/' + selectedId.value)
        if (response2.data) {
          fullData.value.push(response2.data);
          options.value.push({
            label: `${response2.data.nombre_completo} (${response2.data.num_identidad ? response2.data.num_identidad : 'ID#' + response2.data.id})`,
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
