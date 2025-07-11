<template>
  <q-item style="width: 300px">
    <q-item-section>
      <q-item-label caption class="flex justify-between items-center">
        <div>
          <template v-if="authStore.can('alertas.editarBorrar')">
            <q-btn flat dense icon="edit" size="sm" color="primary" @click="emit('editar', props.id)" label="Editar"/>
            <q-btn flat dense icon="delete" size="sm" color="red-9" @click="() => handleEliminarNotificacion(props.id)" />
          </template>
        </div>
        <div>
          <q-icon name="warning" color="red" v-if="!!parseInt(importance)"></q-icon>
          {{ format(new Date(created_at), 'dd/MM/yyyy h:mma') }}
        </div>
      </q-item-label>
      <q-item-label>
        <span v-for="(part, index) in parsedMessage" :key="index">
          <component
            v-if="part.type === 'button'"
            dense
            flat
            is="a"
            href="javascript:void(0)"
            class="text-weight-bold text-primary"
            @click="emit('vercontrato', {num_contrato: part.num_contrato, tipo_parcela: part.tipo_parcela})"
          >
            {{ part.num_contrato }}
          </component>
          <span v-else>{{ part.text }}</span>
        </span>
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>

import { ref, reactive, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { api } from 'src/boot/axios';
import { useAppStore } from 'src/stores/app.store';
import { qNotify } from 'src/boot/jardines';
import { useAuthStore } from 'src/stores/auth.store';


const authStore = useAuthStore()

const $q = useQuasar()
const isLoadingSubmit = ref(false)
const appStore = useAppStore()

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  importance: {
    type: Number,
    required: false,
    default: 0
  },
  created_at: {
    type: String,
    required: true,
  }
})

const emit = defineEmits(['vercontrato', 'editar'])

const parsedMessage = computed(() => parseMessage(props.message));

function parseMessage(message) {
  const parts = [];
  const regex = /\{Contrato:([^|]+)\|(\d+)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: message.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'button', tipo_parcela: match[1], num_contrato: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < message.length) {
    parts.push({ type: 'text', text: message.slice(lastIndex) });
  }

  return parts;
}

const handleEliminarNotificacion = (id, confirm = false) => {
  if (!confirm) {
    $q.dialog({
      title: 'Eliminar notificación',
      message: '¿Estás seguro de que quieres eliminar esta notificación?',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Eliminar',
        color: 'primary',
        flat: true,
        icon: 'delete'
      },
      cancel: {
        label: 'Cancelar',
        color: 'primary',
        flat: true,
        icon: 'cancel'
      }
    }).onOk(() => {
      handleEliminarNotificacion(id, true)
    })
  } else {
    isLoadingSubmit.value = true
    api.delete('notificaciones/' + id)
      .then(response => {
        if (response.data) {
          $q.notify({ message: 'Eliminado exitosamente.', color: 'positive' })
          appStore.getNotificaciones()
        }
      })
      .catch(error => qNotify(error, 'error', { callback: () => handleEliminarNotificacion(id) }))
      .finally(() => isLoadingSubmit.value = false)
  }
}

</script>
