<template>
  <div class="cuotas-mora-table q-pa-md">
    <table class="q-table" v-if="agrupadosPorAnio.length">
      <tbody>
        <tr v-for="(grupo, yearIndex) in agrupadosPorAnio" :key="grupo.year">
          <!-- Año -->
          <td class="text-bold text-center" style="width: 80px; vertical-align: middle; padding: 5px 0;">
            {{ grupo.year }}
          </td>
          <!-- Meses -->
          <td style="padding: 5px 0px 5px 10px">
            <div class="flex">
              <div v-for="mes in 12" :key="mes" style="flex: 1">
                <q-chip
                  :label="getNombreMes(mes)"
                  :outline="!tienesCuotaEnMes(grupo.year, mes)"
                  :dense="true"
                  size="sm"
                  class="q-mt-none"
                  :style="{
                    border: getCuotaStyle(grupo.year, mes).border,
                    color: getCuotaStyle(grupo.year, mes).color,
                    backgroundColor: getCuotaStyle(grupo.year, mes).backgroundColor,
                    opacity: getCuotaStyle(grupo.year, mes).opacity
                  }"
                >
                </q-chip>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-center text-grey-6 q-py-md">
      No hay cuotas de mora disponibles.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  cuotas: {
    type: Array,
    default: () => []
  },
  totalPagado: {
    type: Number,
    default: 0
  }
});

const meses = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const getNombreMes = (mes) => {
  return meses[mes - 1];
};

const tienesCuotaEnMes = (year, mes) => {
  const mesStr = String(mes).padStart(2, '0');
  return props.cuotas.some(cuota => {
    const fechaParts = cuota.fecha_vencimiento.split('-');
    return parseInt(fechaParts[0]) === year && parseInt(fechaParts[1]) === mes;
  });
};

const obtenerCuotasEnMes = (year, mes) => {
  return props.cuotas.filter(cuota => {
    const fechaParts = cuota.fecha_vencimiento.split('-');
    return parseInt(fechaParts[0]) === year && parseInt(fechaParts[1]) === mes;
  });
};

const calcularCuotasPagadas = computed(() => {
  let acumulado = 0;
  const cuotasPagadas = new Set();

  // Agrupar cuotas por fecha y ordenarlas
  const cuotasOrdenadas = [...props.cuotas].sort((a, b) => 
    new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
  );

  // Marcar cuotas como pagadas hasta donde alcance el totalPagado
  for (const cuota of cuotasOrdenadas) {
    const montoCuota = parseFloat(cuota.monto_cuota) || 0;
    const diferencia = props.totalPagado - acumulado;

    // Si la diferencia es mayor a 0.01, marcar como pagada
    if (diferencia >= montoCuota - 0.01) {
      cuotasPagadas.add(cuota.fecha_vencimiento);
      acumulado += montoCuota;
    } else {
      // Si hay un pago parcial, no marcar como pagada
      break;
    }
  }

  return cuotasPagadas;
});

const getCuotaStyle = (year, mes) => {
  const cuota = obtenerCuotasEnMes(year, mes)[0];

  if (!cuota) {
    return {
      border: '1px solid #ccc',
      color: '#ccc',
      backgroundColor: '#fff',
      opacity: '0.75'
    };
  }

  const estaPagada = calcularCuotasPagadas.value.has(cuota.fecha_vencimiento);

  if (estaPagada) {
    return {
      border: '1px solid #21ba45',
      color: '#fff',
      backgroundColor: '#21ba45',
      opacity: '1'
    };
  } else {
    return {
      border: '1px solid #21ba45',
      color: '#21ba45',
      backgroundColor: '#fff',
      opacity: '1'
    };
  }
};

const agrupadosPorAnio = computed(() => {
  if (!props.cuotas || props.cuotas.length === 0) {
    return [];
  }

  // Obtener años únicos y ordenados
  const years = new Set();
  props.cuotas.forEach(cuota => {
    const year = parseInt(cuota.fecha_vencimiento.split('-')[0]);
    years.add(year);
  });

  const yearsArray = Array.from(years).sort((a, b) => a - b);

  return yearsArray.map(year => ({
    year: year,
    cuotas: props.cuotas.filter(cuota => {
      const cuotaYear = parseInt(cuota.fecha_vencimiento.split('-')[0]);
      return cuotaYear === year;
    })
  }));
});
</script>

<style scoped>
.cuotas-mora-table {
  background-color: #f5f5f5;
  border-radius: 4px;
}

.cuotas-mora-table table {
  width: 100%;
  border-collapse: collapse;
}

.cuotas-mora-table table tbody tr {
  border-bottom: 1px solid #e0e0e0;
}

.cuotas-mora-table table tbody tr:last-child {
  border-bottom: none;
}

.cuotas-mora-table table td {
  padding: 12px;
}

.cuotas-mora-table table td:first-child {
  background-color: #fafafa;
  font-weight: bold;
}
</style>
