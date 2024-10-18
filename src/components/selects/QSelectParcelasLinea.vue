<template>
  <q-select ref="select" class="select-ubicaciones-linea" :hint="hint" option-label="codigo_parcela" option-value="id" v-model="props.modelValue" v-bind="$attrs" :options="options" :lazy-rules="props.required"
    input-debounce="500" @filter="filterFn" map-options multiple use-chips @update:model-value="updateValue">
    <!--<template v-slot:before-options v-if="ubicaciones.length" v-bind="$attrs">
      <div class="text-primary q-px-sm q-pt-xs">Sugerencias:</div>
        <q-list dense>
          <q-item clickable v-for="ubicacion in ubicaciones" @click="toggleOption(ubicacion)" :class="{'text-primary': props.modelValue.includes(ubicacion.id)}">
            <q-item-section>{{ ubicacion.codigo_parcela }}</q-item-section>
          </q-item>
        </q-list>
      <q-separator />
    </template>-->
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label :style="scope.opt.style">{{ scope.opt.codigo_parcela }} ({{ scope.opt.estatus }})</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup>

import { api } from 'src/boot/axios';
import { obtenerValoresFaltantes } from 'src/boot/jardines'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  required: {
    type: Boolean,
    default: false,
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
  },
  hint: {
    type: String,
    default: null,
  },
  ubicaciones: {
    type: Array,
    default: []
  }
})

const filterFn = (val, update) => {
  let params = val ? {q: val} : null
  getOptions(params).then(() => {
    update()
  })
}

const select = ref(null);

function toggleOption(option) {
  select.value.toggleOption(option);
}

watch(() => props.ubicaciones, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(() => props.modelValue, async (val) => {
  let params = val ? {q: val} : null
  await getOptions(params)
})

//console.log('parcelprops', props.modelValue);

const emit = defineEmits(['update:modelValue'])

const updateValue = (value) => {
  emit('update:modelValue', value)
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

  if (props.ubicaciones && props.ubicaciones.length) {
    searchParams.append('id', props.ubicaciones.map(u => u.id).join(','))
    searchParams.append('rowsPerPage', '-1')
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
      options.value = response.data.data;
      // Obtener valores seleccionados previamente

      const valoresFaltantes = obtenerValoresFaltantes(props.modelValue, options.value);

      //console.log('valoresFaltantes', valoresFaltantes)
      if (valoresFaltantes.length) {
        const response2 = await api.get('parcelas?id=' + valoresFaltantes.join(',') + '&rowsPerPage=-1')
        if (response2.data) {
          //console.log('response2', response2.data);
          response2.data.data.forEach(row => {
            options.value.push(row)
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
