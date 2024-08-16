<template>

  <q-input v-model="model" @blur="updateModelValue" mask="##/##/#### ##:##"
    :dense="props.dense"
    :readonly="props.readonly"
    :label="props.label"
    :outlined="props.outlined"
    :stack-label="props.stackLabel">

    <template v-slot:prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="model" @update:model-value="updateModelValue" mask="DD/MM/YYYY HH:mm" today-btn>
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Cerrar" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>

    <template v-slot:append>
      <q-icon name="access_time" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-time v-model="model" @update:model-value="updateModelValue" mask="DD/MM/YYYY HH:mm" format24h now-btn>
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Cerrar" color="primary" flat />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>

</template>

<script setup>

import { ref, toRef, watch, onMounted } from 'vue'
import { date as dateUtils } from 'quasar'

const model = ref('')

const date = ref(null)

const props = defineProps({
  readonly: {
    type: Boolean,
  },
  dense: {
    type: Boolean,
  },
  outlined: {
    type: Boolean,
  },
  label: {
    type: String,
  },
  stackLabel: {
    type: Boolean,
  },
  modelValue: {
    type: String
  }
})

const emit = defineEmits(['update:modelValue'])

function isValidTimeFormat(timeString) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const match = timeString.match(regex);
  if (!match) {
    return false;
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function formatTime(timeString) {

  console.log(timeString);
  if (isValidTimeFormat(timeString)) {
    const [hours, minutes] = timeString.split(':');
    const formattedHours = hours.padStart(2, '0');
    const formattedMinutes = minutes.padEnd(2, '0');
    return `${formattedHours}:${formattedMinutes}`;
  } else {
    return '00:00';
  }
}

const updateModelValue = (value) => {

  console.log('Updating value...', value, model.value);

  // Define the input date string
  const inputDateString = model.value;

  // Split the input date string into its components
  const [day, month, year, hours, minutes] = inputDateString.split(/[\/\s:]+/);

  console.log(day, month, year, hours, minutes);

  // If any of the date components is NaN, return null
  if (isNaN(parseInt(day)) || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
    emit('update:modelValue', null)
  } else {

    let time = '00:00'
    if (!isNaN(parseInt(hours)) && !isNaN(parseInt(minutes))) {
      time = `${hours}:${minutes}`
    }

    let outputDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${formatTime(time)}:00`;

    const checkDate = Date.parse(outputDateString);
    if (isNaN(checkDate)) {
      outputDateString = null
    }

    emit('update:modelValue', outputDateString)
    model.value = dateYMDtoDMY(outputDateString)

  }

}

function dateYMDtoDMY(datestring) {

  if (!datestring) return null

  console.log(datestring);

  const inputDate = new Date(datestring.replace(/-/g, '/'));

  // Format the date as a string in the desired format
  const day = inputDate.getDate().toString().padStart(2, '0');
  const month = (inputDate.getMonth() + 1).toString().padStart(2, '0');
  const year = inputDate.getFullYear().toString();
  const hours = inputDate.getHours().toString().padStart(2, '0');
  const minutes = inputDate.getMinutes().toString().padStart(2, '0');
  const outputDateString = `${day}/${month}/${year} ${hours}:${minutes}`;

  return outputDateString;
}

const setDateValue = (value) => {
  console.log('setDateValue', value);
  model.value = dateYMDtoDMY(value)
}

defineExpose({ setDateValue })

onMounted(() => {

  model.value = dateYMDtoDMY(props.modelValue)

})

</script>
