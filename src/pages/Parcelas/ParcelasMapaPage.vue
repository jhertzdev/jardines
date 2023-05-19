<template>

  <div class="q-gutter-sm q-mb-md">
    <q-btn @click="gridWidth += 100" icon="zoom_in" color="primary" />
    <q-btn @click="gridWidth -= 100" icon="zoom_out" color="primary" />
    <q-btn @click="handleExtendHorizontal" icon="east" color="primary" label="Extender"/>
    <q-btn @click="handleReduceHorizontal" icon="west" color="primary" label="Reducir"/>
    <q-btn @click="handleUpdatePositions" icon="sync" color="primary" label="Guardar" :loading="isLoadingUpdatePositions"/>
  </div>

  <div class="q-gutter-sm q-my-md flex justify-center">
    <div>
      <q-badge align="middle" class="q-mr-xs" style="background: lightgreen"/>
      <span>Disponible</span>
    </div>
    <div>
      <q-badge align="middle" class="q-mr-xs" style="background: gray"/>
      <span>No disponible</span>
    </div>
    <div>
      <q-badge align="middle" class="q-mr-xs" style="background: violet"/>
      <span>Pendiente</span>
    </div>
    <div>
      <q-badge align="middle" class="q-mr-xs" style="background: coral"/>
      <span>En espera</span>
    </div>
    <div>
      <q-badge align="middle" class="q-mr-xs" style="background: lightseagreen"/>
      <span>Vendido</span>
    </div>
    <div>
      <q-badge align="middle" class="q-mr-xs" rounded color="black" style="font-size: 10px;">P</q-badge>
      <span>Tiene propietario</span>
    </div>
    <div>
      <q-badge align="middle" class="q-mr-xs" color="black" style="font-size: 10px; width: 20px;"></q-badge>
      <span>Puesto ocupado</span>
    </div>
    <div>
      <q-badge align="middle" class="q-mr-xs" outline color="black" style="font-size: 10px; width: 20px;"></q-badge>
      <span>Puesto disponible</span>
    </div>
  </div>

  <div class="map-wrapper" ref="mapa" style="overflow: auto;">
    <div v-if="isLoadingMapa" class="full-width text-center q-pa-lg">
      <q-spinner size="lg" color="primary"/>
    </div>
    <grid-layout v-else
        v-model:layout="layout"
        :col-num="numColumnas"
        :row-height="rowHeight"
        :responsive=false
        :is-resizable=false
        :is-draggable=true
        :vertical-compact=false
        :prevent-collision=true
        ref="mapa"
        :style="`--vue-grid-width:${gridWidth}px;--vue-grid-margin:${gutterMargin}px;--vue-col-num:${numColumnas};--vue-row-height:${rowHeight}px`"
        :margin=[gutterMargin,gutterMargin]
      >
      <template #default="{ gridItemProps }">
        <!-- | gridItemProps props from GridLayout | -->
        <!--breakpointCols: props.cols-->
        <!--colNum: props.colNum-->
        <!--containerWidth: width.value-->
        <!--isDraggable: props.isDraggable-->
        <!--isResizable: props.isResizable-->
        <!--lastBreakpoint: lastBreakpoint.value-->
        <!--margin: props.margin-->
        <!--maxRows: props.maxRows-->
        <!--responsive: props.responsive-->
        <!--rowHeight: props.rowHeight-->
        <!--useCssTransforms: props.useCssTransforms-->
        <!--width: width.value-->
        <grid-item v-for="item in layout"
          :key="item.i"
          v-bind="gridItemProps"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          @click="handleClick(item.i)"
          @resize="handleResize"
          @move="handleMove"
          @moved="handleMoved"
          :class="item.class.join(' ')"
          >
          <span>{{ item.data.codigo }}</span>
          <div class="puestos-wrapper">
            <div class="puesto-item" :class="parseInt(puesto.ocupado) && 'ocupado'" v-for="puesto in item.data.puestos" style="font-size:5px">
              <q-tooltip anchor="top middle" self="bottom middle" class="puesto-tooltip" :offset="[10, 2]">
                <p>{{ puesto.nombre }}</p>
                <template v-if="parseInt(puesto.ocupado)">
                  <p><i>(Ocupado)</i></p>
                  <p>Fecha de inhumación:</p>
                  <p>{{ puesto.fecha_inhumacion }}</p>
                </template>
                <template v-else>
                  <p><i>(Libre)</i></p>
                </template>
              </q-tooltip>
            </div>
          </div>
          <div class="info-wrapper">
            <div class="info-item" v-if="item.data.propietario">P
              <q-tooltip anchor="top middle" self="bottom middle" class="puesto-tooltip" :offset="[10, 2]">
                <p>Tiene propietario.</p>
              </q-tooltip>
            </div>
          </div>
        </grid-item>
      </template>
    </grid-layout>
  </div>

</template>

<style>
.vue-grid-layout {
  width: var(--vue-grid-width);
  background-color: #FEFEDF;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  min-height: calc( (var(--vue-row-height) + var(--vue-grid-margin)) * 6 + var(--vue-grid-margin));
}

.vue-grid-layout::before {
  content: '';
  background-size: calc(calc(100% - var(--vue-grid-margin) / 2) / var(--vue-col-num) * 2) 
                   calc((var(--vue-row-height) + var(--vue-grid-margin)) * 2);
  background-image: linear-gradient(
    to right,
    var(--q-primary) 1px,
    transparent 1px
  ),
  linear-gradient(to bottom, var(--q-primary) 1px, transparent 1px);
  height: calc(100% - var(--vue-grid-margin) / 2 - 1px);
  width: calc(100% - var(--vue-grid-margin) / 2);
  position: absolute;
  background-repeat: repeat;
  margin: calc(var(--vue-grid-margin) / 2);
}

.vue-grid-item {
  font-size: 12px;
  text-align: center;
}

.vue-grid-item.selected {
  box-shadow: 0 0 6px 5px var(--q-primary);
}

.vue-grid-item.disponible {
  background-color: lightgreen;
}

.vue-grid-item.no-disponible {
  background-color: gray;
}

.vue-grid-item.pendiente {
  background-color: violet;
}

.vue-grid-item.en-espera {
  background-color: coral;
}

.vue-grid-item.vendido {
  background-color: lightseagreen;
}

.puestos-wrapper {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: calc(100% - 21px);
  display: flex;
  flex-flow: column-reverse;
}

.info-wrapper {
  position: absolute;
  bottom: 3px;
  left: 3px;
  display: flex;
  flex-flow: column-reverse;
  font-size: 10px;
  line-height: 1.15;
}

.puestos-wrapper .puesto-item {
  width: 100%;
  height: 10px;
  border-radius: 2px;
  border: 1px solid #000d;
}

.puestos-wrapper .puesto-item:not(:first-child) {
  margin-bottom: 2px;
}

.puestos-wrapper .puesto-item.ocupado {
  background: #000d;
}

.info-wrapper .info-item {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #000d;
  color: #fff;
}

.info-wrapper .info-item:not(:first-child) {
  margin-bottom: 1px;
}

.puesto-tooltip {
  background: #000d;
  text-align: center;
}

.puesto-tooltip p {
  margin: 0;
}

.map-wrapper {
  height: calc(100vh - 240px);
}

</style>

<script setup>

import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { ref, onMounted, watch } from 'vue'
import { slugify } from 'src/boot/jardines';
import { useRoute } from 'vue-router';

const $q = useQuasar();
const route = useRoute()
const gridWidth = ref(0)
const minNumColumnas = ref($q.screen.lt.sm ? 16 : ($q.screen.lt.md ? 30 : 40))
const numColumnas = ref(minNumColumnas.value);

const rowHeight = ref(30)
const gridItemMinWidth = ref(60)
const colsPerItem = 2
const gutterMargin = 6

const props = defineProps(['leftDrawerOpen'])
watch(() => props.leftDrawerOpen, () => {
  setTimeout(() => {
    calculateLayout()
  }, 150)
})

const isMoving = ref(false)
const isLoadingMapa = ref(true)
const isLoadingUpdatePositions = ref(false)
const layout = ref([]);

const mapa = ref(null)

const handleResize = () => {

}

const handleClick = (i) => {

  if (isMoving.value) return;

  const index = layout.value.findIndex(el => el.i == i)
  let selectedIndex = layout.value[index]['class'].indexOf('selected');
  if (selectedIndex === -1) {
    layout.value[index]['class'].push('selected');
  } else {
    layout.value[index]['class'].splice(selectedIndex, 1);
  }

}

const handleMove = (i, x, y) => {
  isMoving.value = true
}

const handleMoved = (i, newX, newY) => {
  setTimeout(() => {
    isMoving.value = false
  }, 1)
}

const handleExtendHorizontal = () => {
  minNumColumnas.value += 2
  calculateLayout()
}

const handleReduceHorizontal = () => {
  numColumnas.value -= 2
  if (minNumColumnas.value > numColumnas.value) {
    minNumColumnas.value = numColumnas.value
  }  
  calculateLayout()
}

const handleUpdatePositions = () => {
  const postData = layout.value.map(item => {
    return {
      id: item.i,
      pos_x: item.x,
      pos_y: item.y,
    }
  });
  
  isLoadingUpdatePositions.value = true;

  api.post('parcelas/posiciones', postData)
    .then(response => {
      if (response.status === 200)  {
        $q.notify({ message: 'Posiciones actualizadas.', color: 'positive' })
      } else {
        $q.notify({ message: 'No se pudieron actualizar las posiciones.', color: 'danger' })
      }
    })
    .catch(error => {
      console.log(error);
      $q.notify({ message: 'No se pudieron actualizar las posiciones.', color: 'danger' })
    })
    .finally(() => isLoadingUpdatePositions.value = false)

}

function calculateLayout() {
  // Obtener el ancho de la pantalla
  const wrapperWidth = mapa.value.offsetWidth;

  // Obtener el elemento más a la derecha
  const maxHorizontalPosition = Math.max(...layout.value.map(l => l.x));

  // Cuántos elementos caben en el ancho de pantalla
  const availableElements = (maxHorizontalPosition / colsPerItem) + 1;
  const gridItemWidth = Math.floor(wrapperWidth / availableElements);

  // console.log('giw', gridItemWidth, availableElements);
  
  if (maxHorizontalPosition + colsPerItem > numColumnas.value) {
    numColumnas.value = maxHorizontalPosition + colsPerItem
  }

  if (numColumnas.value < minNumColumnas.value) {
    numColumnas.value = minNumColumnas.value;
  }

  // Redibujar layout
  
  if (gridItemWidth > gridItemMinWidth.value) {
    gridWidth.value = mapa.value.offsetWidth;
    // console.log(gridWidth.value);
  } else {
    gridWidth.value = gridItemMinWidth.value * availableElements;
    // console.log(gridWidth.value);
  } 
    
}

onMounted(() => {
  window.addEventListener('resize', function() {
    calculateLayout();
  });

  api.get('parcelas?f[codigo_seccion]=' + route.params.codigo + '&with[]=data&rowsPerPage=-1')
    .then(response => {
      if (response.data) {
        response.data.data.forEach( (parcela, index) => {

          console.log(parcela);

          layout.value.push({
            x: parcela.pos_x ? parseInt(parcela.pos_x) : 0,
            y: parcela.pos_y ? parseInt(parcela.pos_y) : 0,
            w: colsPerItem,
            h: colsPerItem,
            i: parseInt(parcela.id),
            data: {
              estatus: parcela.estatus,
              codigo: parcela.codigo_parcela,
              propietario: parcela.propietario_id,
              puestos: parcela.puestos
            },
            class: [slugify(parcela.estatus)]
          })
          
        });
      }
    })
    .catch(error => {
      console.log(error);
    })
    .finally(() => {
      isLoadingMapa.value = false
      calculateLayout()
    })
})

</script>