<template>
  El: {{ selectedClientId }}
  <q-select
    v-model="selectedClientId"
    :options="clientes"
    option-value="id"
    option-label="nombre_completo"
    @filter="filterFn"
    v-bind="$attrs"
    emit-value
    map-options
    use-input
    input-debounce="500"
    @update:modelValue="updateValue"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { api } from 'src/boot/axios';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const selectedClientId = ref(props.modelValue ? props.modelValue.toString() : null);
const clientes = ref([]);

const loadClientes = async (params = null) => {
  let searchParams = new URLSearchParams();
  if (params) {
    Object.keys(params).forEach(key => {
      searchParams.append(key, params[key])
    });
  }
  searchParams.append('sortBy', 'id');
  searchParams.append('order', 'desc');

  let endpoint = 'clientes?' + searchParams.toString();

  const response = await api.get(endpoint);
  if (response.data) {
    clientes.value = response.data.data.map(cliente => ({
      ...cliente,
      id: cliente.id.toString()
    }));
  }

  // Check if the selected client is in the list
  if (selectedClientId.value && !clientes.value.find(cliente => cliente.id === selectedClientId.value)) {
    const response = await api.get('clientes/' + selectedClientId.value);
    if (response.data) {
      clientes.value.push({
        ...response.data,
        id: response.data.id.toString()
      });
    }
  }
};

async function filterFn (val, update) {
  let params = val ? {s: val} : null
  
  if (val === '') {
    await loadClientes();
  } else {
    await loadClientes(params);
  }

  update(() => {
    clientes.value = [...clientes.value];
  })
}

function updateValue(newValue) {
  console.log('updateValue', newValue)
  selectedClientId.value = newValue;
  emit('update:modelValue', newValue);
}

onMounted(() => {
  console.log('ClientId', selectedClientId.value)
  loadClientes()
});

watch(() => props.modelValue, (newValue) => {
  selectedClientId.value = newValue ? newValue.toString() : null;
  emit('update:modelValue', selectedClientId.value);
});
</script>