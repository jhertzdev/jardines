<template>
  <q-spinner size="xl" color="primary" v-if="isLoading" />
  <div id="brujula" v-if="mostrarBrujula">
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAe1BMVEUAAAAEGCzYJj4DGCsDGCvYJj7YJj3YJT4DFyvZJT3TIDnYJj0EGSvYJj7ZJj0CGCvYJj7YJj7YJT0EGCvZJj7YJj4DGCvZJj7YJz8AFinXKDzYJj7YJj7ZJj/YJj7YJz7XJj7ZJj/aJT3ZJj4EGivXKEDVIjzYJj4DGCssumC5AAAAJ3RSTlMAgPPq+dLBW0wqCpRE+tzUyLWjjXdoXjsmIhPr6bOwpYeGS0o8IB5T5SZfAAAAuElEQVQ4y63Pxw6DMBBF0Yed0HuH9Dr8/xfGYJFs7NmEu7BGmiNLgw0r8mAd+/xsACkJT0+eoNQAbkQUhUBYquFqAAGp9n2wJ1UAQ8tGiMXBVE3faiN4/cAbxtx178Jcs4LGAsZE75MRlk4aFLDlaeBZQShIJUJYK2dwgb3HDO5gOhAdwRURRSzoiDqwuS7+KZYt4EvfCpxp91SPw4BJDjzYTVnFgipThgPOICceIGZ+0Be2MsamfQCB0xYAbTjyEQAAAABJRU5ErkJggg=="
    />
  </div>
  <canvas ref="canvas" width="500" height="500" v-show="!isLoading"></canvas>

  <div id="info" v-show="selectedElement">
    <q-btn flat dense color="negative" icon="close" size="sm" @click="selectedElement = null; resizeCanvas()" />
    <div class="row" style="height: 100%; flex-flow: column">
      <div class="col-12 q-px-lg" style="flex: 1">
        <h6 class="q-my-none">

          <a href="javascript:void(0)" @click="editarParcelaDialog.openDialog(selectedElement.id)">{{ selectedElement?.codigo + '-' + selectedElement?.text.padStart(3, '0') }}</a> ({{ selectedElement?.estatus.toUpperCase() }})

          <template v-if="selectedElement?.fila">
            <p>[FILA: {{ selectedElement?.fila }}]</p>
          </template>
        </h6>
        <ul class="q-mt-none" style="padding-left: 0;">
          <li v-for="(difunto, difuntoKey) in selectedElement?.difuntos">
            {{ difunto }} ({{ selectedElement?.fechas_inhumacion[difuntoKey] }})
          </li>
        </ul>
        <p class="text-grey-5" v-if="selectedElement?.difuntos?.length === 0">-- Vacía --</p>
      </div>
      <div class="col-12 q-px-sm" style="border-top: 1px solid #000">
        <p class="q-my-none text-bold">LEYENDA:</p>
        <ul class="q-gutter-x-xs q-mt-none" style="padding-left: 0; list-style: none; display: flex; flex-flow: wrap;">
          <li class="flex" v-for="(color, estatus) in bgColor"><q-badge class="q-mr-xs" :style="`background-color: ${color}`"/>{{estatus.replace("-", " ")}}</li>
          <li class="flex"><q-badge class="q-mr-xs" style="background-color: #FEEC37"/>Extra Grande</li>
          <li class="flex">
            <q-badge class="q-mr-xs" style="background-color: #000; border-radius: 1px; height: 2px; min-height: 2px; margin-top: 8px"/>
            Difuntos
          </li>
          <li class="flex">
            <q-badge class="q-mr-xs" style="background: linear-gradient(#4A0404 20%, #DFFF00 20%, #DFFF00 80%, #4A0404 80%);; border-radius: 1px; height: 12px; min-height: 2px; margin-top: 4px"/>
            Rampa
          </li>
          <li class="flex">
            <q-badge class="q-mr-xs" style="background: linear-gradient(#4A0404 20%, #DE3163 20%, #DE3163 80%, #4A0404 80%);; border-radius: 1px; height: 12px; min-height: 2px; margin-top: 4px"/>
            Escalera
          </li>
        </ul>
        <ul class="q-gutter-x-xs q-mt-none" style="padding-left: 0; list-style: none; display: flex; flex-flow: wrap">
          <li>Mover mapa: <img src="img/buttons.png" width="48" style="margin-bottom: -12px"/></li>
        </ul>
      </div>
    </div>
  </div>

  <DialogEditarParcela ref="editarParcelaDialog" @updated="handleUpdatedParcela"/>
</template>

<style scoped>
  canvas {
    border: 1px solid black;
  }

  .q-page {
    position: relative;
  }

  #brujula {
    position: absolute;
    display: flex;
    width: 48px;
    height: 48px;
    bottom: 80px;
    left: 60px;
    border-radius: 50%;
    background: #fffd;
    padding: 5px;
    border: 1px solid #000;
    transition: 0.2s;
  }

  #brujula:hover {
    opacity: 0.15;
  }

  #info {
    background-color: #fff;
    border: 1px solid black;
    position: absolute;
    top: 82px;
    right: 35px;
    height: calc(100% - 125px);
    width: 320px;
    border-radius: 5px;
  }

  #info .q-btn {
    position: absolute;
    top: 1px;
    right: 2px;
  }

  #info .q-badge {
    width: 15px;
  }

  #info li {
    text-transform: capitalize;
    font-size: .85rem;
    margin-bottom: 2px;
  }
</style>

<script setup>

import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { slugify } from 'src/boot/jardines';
import DialogEditarParcela from 'src/components/popups/DialogEditarParcela.vue';
import { useRoute } from 'vue-router';

const $q = useQuasar();
const route = useRoute()
const isLoading = ref(false)
const mostrarBrujula = ref(false)

const handleUpdatedParcela = (data) => {
  api.get('parcelas/' + data.id)
    .then(response => {
      let row = canvasData.value.find(p => p.id == data.id)
      row.estatus = response.data.estatus.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(" ", "-")
      resizeCanvas()
      editarParcelaDialog.value.closeDialog()
    })
}

const editarParcelaDialog = ref(null)

const canvas = ref(null);
const ctx = ref(null);

const initialGridWidth = 15;
const initialGridHeight = 18;

const gridWidth = ref(initialGridWidth); // Ancho de cada celda en píxeles
const gridHeight = ref(initialGridHeight); // Altura de cada celda en píxeles
const zoomLevel = ref(1); // Nivel de zoom inicial
const offsetX = ref(0); // Desplazamiento horizontal
const offsetY = ref(0); // Desplazamiento vertical

let canvasData = ref([]);
const textos = ref([]);

const selectedElement = ref(null);

const resizeCanvas = () => {
  canvas.value.width = window.innerWidth - 60;
  canvas.value.height = window.innerHeight - 150;
  drawGrid();
  drawElements();
};

const drawGrid = () => {
  const gridCountX = Math.floor(canvas.value.width / gridWidth.value);
  const gridCountY = Math.floor(canvas.value.height / gridHeight.value);
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height); // Borrar el canvas
  ctx.value.beginPath(); // Iniciar un nuevo camino para la cuadrícula
  for (let i = 0; i <= gridCountX + offsetX.value; i++) {
    ctx.value.moveTo(i * gridWidth.value - offsetX.value, 0);
    ctx.value.lineTo(i * gridWidth.value - offsetX.value, canvas.value.height);
  }
  for (let i = 0; i <= gridCountY + offsetY.value; i++) {
    ctx.value.moveTo(0, i * gridHeight.value - offsetY.value);
    ctx.value.lineTo(canvas.value.width, i * gridHeight.value - offsetY.value);
  }
  ctx.value.strokeStyle = '#eee';
  ctx.value.stroke();
};

const bgColor = {
  "disponible": "#A1CF6B",
  "vendido": "#55DDE0",
  "donado": "#744FC6",
  "en-construccion": "#88A0A8",
  "no-disponible": "#333333",
}

const drawElements = () => {
  canvasData.value.forEach(item => {
    const x = item.x * gridWidth.value - offsetX.value;
    const y = item.y * gridHeight.value - offsetY.value;

    ctx.value.beginPath();
    ctx.value.fillStyle = bgColor[item.estatus];
    ctx.value.fillRect(x + 1, y + 1, gridWidth.value * 2 - 2, gridHeight.value * 2 - 2);

    if (item?.id === selectedElement.value?.id) {
      ctx.value.strokeStyle = 'green';
      ctx.value.rect(x + 1, y + 1, gridWidth.value * 2 - 2, gridHeight.value * 2 - 2)
      ctx.value.stroke();
    }

    if (item.grande) {
      ctx.value.fillStyle = '#FEEC37';
      ctx.value.fillRect(x + 1, y + gridHeight.value, gridWidth.value * 2 - 2, gridHeight.value);
    }

    if (item.difuntos?.length) {

      ctx.value.fillStyle = '#000';

      for (let index = 0; index < item.difuntos.length; index++) {
        ctx.value.fillRect(
          x + gridWidth.value * 1.35,
          y + gridHeight.value * (1.75 - 0.25 * index),
          0.5 * gridWidth.value,
          0.15 * gridHeight.value
        )
      }

    }

    ctx.value.closePath();

    ctx.value.fillStyle = ['no-disponible'].includes(item.estatus) ? '#fff' : '#000';
    ctx.value.font = '10px Arial';
    ctx.value.letterSpacing = '-1px';
    ctx.value.fillText(item.text, x + 2, y + 12); // Ajusta la posición del texto según sea necesario

  });

  // Dibujar los textos
  textos.value.forEach((item) => {
    ctx.value.beginPath();
    const x = item.x * gridWidth.value - offsetX.value;
    const y = item.y * gridHeight.value - offsetY.value;

    let texto = item.texto?.toUpperCase();

    if (texto == "ESCALERA" || texto == "RAMPA") {
      ctx.value.fillStyle = texto == "ESCALERA" ? "#DE3163" : "#DFFF00";
      ctx.value.fillRect(
        x + 0.5,
        y - 0.5 * gridHeight.value + 1,
        gridWidth.value * 2 - 1,
        gridHeight.value - 3
      );

      ctx.value.moveTo(x - 0 * gridWidth.value, y - 0.5 * gridHeight.value);
      ctx.value.lineTo(x + 2 * gridWidth.value, y - 0.5 * gridHeight.value);

      ctx.value.moveTo(x - 0 * gridWidth.value, y + 0.5 * gridHeight.value);
      ctx.value.lineTo(x + 2 * gridWidth.value, y + 0.5 * gridHeight.value);
      ctx.value.lineWidth = 4;
      ctx.value.strokeStyle = "#4A0404";
      ctx.value.stroke();

      ctx.value.lineWidth = 1;
      ctx.value.moveTo(x + 0.5, y - 0.5 * gridHeight.value);
      ctx.value.lineTo(x + 0.5, y + 0.5 * gridHeight.value);

      ctx.value.moveTo(
        x + 2 * gridWidth.value - 0.5,
        y - 0.5 * gridHeight.value
      );
      ctx.value.lineTo(
        x + 2 * gridWidth.value - 0.5,
        y + 0.5 * gridHeight.value
      );

      if (texto == "R") {
        ctx.value.moveTo(x, y + 0.5 * gridHeight.value);
        ctx.value.lineTo(x + 2 * gridWidth.value, y - 0.5 * gridHeight.value);
      } else if (texto == "ESCALERA") {
        ctx.value.moveTo(x + 0.5 * gridWidth.value, y - 0.5 * gridHeight.value);
        ctx.value.lineTo(x + 0.5 * gridWidth.value, y + 0.5 * gridHeight.value);

        ctx.value.moveTo(x + 1 * gridWidth.value, y - 0.5 * gridHeight.value);
        ctx.value.lineTo(x + 1 * gridWidth.value, y + 0.5 * gridHeight.value);

        ctx.value.moveTo(x + 1.5 * gridWidth.value, y - 0.5 * gridHeight.value);
        ctx.value.lineTo(x + 1.5 * gridWidth.value, y + 0.5 * gridHeight.value);
      }

      ctx.value.stroke();
      ctx.value.closePath();
    } else {

      let fontSize = Math.floor(gridHeight.value * 1.5)

      ctx.value.fillStyle = "black";
      ctx.value.font = `bold ${fontSize}px Arial`;
      ctx.value.letterSpacing = "-1px";

      if (item.vertical) {
        ctx.value.save()
        ctx.value.translate(x - 4, y + gridHeight.value * 1.5);
        ctx.value.rotate(-Math.PI/2);
        ctx.value.textAlign = "right";
        ctx.value.fillText(texto, 0, 0)
        ctx.value.restore();
      } else {
        ctx.value.fillText(texto, x + 2, y + gridHeight.value * 1.5); // Ajusta la posición del texto según sea necesario
      }

    }
  });
};

function exportCanvasAsPNG(id, fileName) {
  var MIME_TYPE = "image/png";

  var imgURL = canvas.value.toDataURL(MIME_TYPE);

  var dlLink = document.createElement('a');
  dlLink.download = fileName;
  dlLink.href = imgURL;
  dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

  document.body.appendChild(dlLink);
  dlLink.click();
  document.body.removeChild(dlLink);
}

const handleClick = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  canvasData.value.forEach(item => {
    const itemX = item.x * gridWidth.value - offsetX.value;
    const itemY = item.y * gridHeight.value - offsetY.value;
    if (x >= itemX && x <= itemX + gridWidth.value * 2 && y >= itemY && y <= itemY + gridHeight.value * 2) {

      if (selectedElement.value == item) {
        selectedElement.value = null;
      } else {
        selectedElement.value = item;
      }

      drawGrid();
      drawElements();
    }
  });
};

let repeatKeydownInterval;

const handleKeydown = (event) => {

  /*if (selectedElement.value) {
    switch (event.key) {
      case 'ArrowUp':
        selectedElement.value.y = Math.max(0, selectedElement.value.y - 1);
        break;
      case 'ArrowDown':
        selectedElement.value.y = selectedElement.value.y + 1;
        break;
      case 'ArrowLeft':
        selectedElement.value.x = Math.max(0, selectedElement.value.x - 1);
        break;
      case 'ArrowRight':
        selectedElement.value.x = selectedElement.value.x + 1;
        break;
    }
    drawGrid();
    drawElements();
  }*/

  if (event.repeat) {
    if (!repeatKeydownInterval) {
      repeatKeydownInterval = setInterval(() => {

        switch (event.key) {
          case 'W':
          case 'w':
          case 'ArrowUp':
            offsetY.value = Math.max(0, offsetY.value - gridHeight.value * 5);
            break;
          case 'S':
          case 's':
          case 'ArrowDown':
            offsetY.value += gridHeight.value * 5;
            break;
          case 'A':
          case 'a':
          case 'ArrowLeft':
            offsetX.value = Math.max(0, offsetX.value - gridWidth.value * 5);
            break;
          case 'D':
          case 'd':
          case 'ArrowRight':
            offsetX.value += gridWidth.value * 5;
            break;
          case 'P':
          case 'p':
            exportCanvasAsPNG('canvas', 'mapa.png');
            break;
        }

        drawGrid();
        drawElements();

      }, 200);
    }
  } else {

    switch (event.key) {
      case 'W':
      case 'w':
      case 'ArrowUp':
        offsetY.value = Math.max(0, offsetY.value - gridHeight.value);
        break;
      case 'S':
      case 's':
      case 'ArrowDown':
        offsetY.value += gridHeight.value;
        break;
      case 'A':
      case 'a':
      case 'ArrowLeft':
        offsetX.value = Math.max(0, offsetX.value - gridWidth.value);
        break;
      case 'D':
      case 'd':
      case 'ArrowRight':
        offsetX.value += gridWidth.value;
        break;
      case 'P':
      case 'p':
        exportCanvasAsPNG('canvas', 'mapa.png');
        break;
    }

    drawGrid();
    drawElements();

  }


};

const emit = defineEmits(['toggleDrawer'])

const handleKeyup = (event) => {
  clearInterval(repeatKeydownInterval);
  repeatKeydownInterval = null;
};

const handleWheel = (event) => {
  event.preventDefault();
  const zoomFactor = 0.1;
  if (event.deltaY < 0) {
    zoomLevel.value += zoomFactor;
  } else {
    zoomLevel.value = Math.max(zoomFactor, zoomLevel.value - zoomFactor);
  }
  gridWidth.value = initialGridWidth * zoomLevel.value;
  gridHeight.value = initialGridHeight * zoomLevel.value;
  drawGrid();
  drawElements();
};

onMounted(() => {

  isLoading.value = true;
  emit('toggleDrawer', false)

  ctx.value = canvas.value.getContext('2d');
  window.addEventListener('resize', resizeCanvas);
  canvas.value.addEventListener('click', handleClick);
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keyup', handleKeyup);
  canvas.value.addEventListener('wheel', handleWheel);

  loadParcelas(1);

});

function loadParcelas(page = 1) {



  api.get('parcelas/mapa/' + route.params.codigo + '?page=' + page)
    .then(response => {
      if (response.data?.data) {

        if (page == 1 && response.data.data.length > 0) {

          let codigo = response.data.data[0].codigo_seccion;

          if (codigo == "AR") {
            textos.value = [
              { x: 3, y: 0, texto: 'ARAGUANEY'},
              { x: 27, y: 0, texto: 'LADO (SUR)'},
              { x: 54, y: 0, texto: 'ARAGUANEY'},
              { x: 76, y: 0, texto: 'LADO (SUR)'},
              { x: 100, y: 0, texto: 'ARAGUANEY'},
              { x: 114, y: 0, texto: 'LADO (SUR)'},
              { x: 2, y: 3, texto: 'LADO (ESTE)', vertical: true},
              { x: 82, y: 54, texto: 'LADO (ESTE)', vertical: true},
              { x: 86, y: 64, texto: 'LADO (NORTE)'},
              { x: 106, y: 64, texto: 'ARAGUANEY'},
              { x: 0, y: 3, texto: "ESCALERA" },
              { x: 6, y: 17, texto: "RAMPA" },
              { x: 22, y: 27, texto: "ESCALERA" },
              { x: 54, y: 39, texto: "ESCALERA" },
              { x: 80, y: 53, texto: "RAMPA" },
              { x: 111, y: 1, texto: "ESCALERA" },
              { x: 18, y: 1, texto: "ESCALERA" },
              { x: 44, y: 1, texto: "ESCALERA" },
              { x: 73, y: 1, texto: "ESCALERA" },
            ];
            mostrarBrujula.value = true
          } else if (codigo.includes('O')) {
            textos.value = [
              // ORQUIDEA B
              { x: 147, y: 0, texto: 'ORQUIDEA "B"'},
              { x: 133, y: 0, texto: 'AVENIDA (SUR)'},
              { x: 119, y: 0, texto: 'ORQUIDEA "B"'},
              { x: 100, y: 0, texto: 'AVENIDA (SUR)'},
              { x: 85, y: 0, texto: 'ORQUIDEA "B"'},
              // CARRETERA (OESTE)
              { x: 164, y: 2, texto: 'CARRETERA (OESTE)', vertical: true},
              { x: 164, y: 18, texto: 'ORQUIDEA "B"', vertical: true},
              { x: 164, y: 30, texto: 'CARRETERA (OESTE)', vertical: true},
              // RAMPAS Y ESCALERAS (OB)
              { x: 160, y: 11, texto: "ESCALERA" },
              { x: 160, y: 19, texto: "ESCALERA" },
              { x: 160, y: 29, texto: "ESCALERA" },
              { x: 160, y: 37, texto: "ESCALERA" },
              { x: 158, y: 48, texto: "ESCALERA" },
              { x: 154, y: 55, texto: "ESCALERA" },
              { x: 130, y: 67, texto: "ESCALERA" },
              { x: 134, y: 67, texto: "RAMPA" },
              { x: 116, y: 1, texto: "ESCALERA" },
              // ORQUIDEA A
              { x: 68, y: 0, texto: 'ORQUIDEA "A"'},
              { x: 48, y: 0, texto: 'AVENIDA (SUR)'},
              { x: 28, y: 0, texto: 'ORQUIDEA "A"'},
              { x: 1, y: 0, texto: 'ORQUIDEA "A"'},
              { x: 2, y: 2, texto: 'LADO (ESTE)', vertical: true},
              { x: 2, y: 22, texto: 'ORQUIDEA "A"', vertical: true},
              { x: 2, y: 52, texto: 'LADO "ESTE"', vertical: true},
              { x: 2, y: 72, texto: 'ORQUIDEA "A"', vertical: true},
              { x: 2, y: 88, texto: 'LADO (ESTE)', vertical: true},
              { x: 1, y: 108, texto: 'ORQUIDEA "A"' },
              { x: 28, y: 108, texto: 'LADO (NORTE)' },
              { x: 48, y: 108, texto: 'ORQUIDEA "A"'},
              { x: 68, y: 108, texto: 'LADO (NORTE)'},
              // RAMPAS Y ESCALERAS (OA)
              { x: 82, y: 89, texto: "RAMPA" },
              { x: 78, y: 93, texto: "ESCALERA" },
              { x: 58, y: 107, texto: "ESCALERA" },
              { x: 38, y: 107, texto: "RAMPA" },
              { x: 28, y: 107, texto: "ESCALERA" },
              { x: 0, y: 99, texto: "ESCALERA" },
              { x: 0, y: 86, texto: "RAMPA" },
              { x: 0, y: 51, texto: "ESCALERA" },
              { x: 0, y: 45, texto: "ESCALERA" },
              { x: 0, y: 37, texto: "RAMPA" },
              { x: 0, y: 17, texto: "ESCALERA" },
              { x: 19, y: 1, texto: "ESCALERA" },
              { x: 64, y: 1, texto: "ESCALERA" },
            ];
            mostrarBrujula.value = true
          } else if (codigo.includes('GI')) {
            textos.value = [
              // GIRASOL (NICHOS)
              { x: 2, y: 0, texto: 'GIRASOL "A" (CARA SUR)'},
              { x: 2, y: 10, texto: 'GIRASOL "B" (CARA NORTE)'},
            ];
          } else if (codigo.includes('GL')) {
            textos.value = [
              // GLADIOLAS (COLUMBARIOS)
              { x: 2, y: 0, texto: 'GLADIOLAS "A" (CARA SUR)'},
              { x: 32, y: 0, texto: 'GLADIOLAS "C" (CARA SUR)'},
              { x: 2, y: 16, texto: 'GLADIOLAS "B" (CARA NORTE)'},
              { x: 32, y: 16, texto: 'GLADIOLAS "D" (CARA NORTE)'},
            ];
          }

        }

        response.data.data.forEach( (parcela, index) => {

          canvasData.value.push({
            id: parcela.id,
            x: parseInt(parcela?.pos_x || 0),
            y: parseInt(parcela?.pos_y || 0),
            codigo: parcela.codigo_seccion,
            text: parcela.num_parcela,
            estatus: parcela.estatus,
            fila: parcela.num_fila,
            difuntos: parcela.difuntos.split(',').filter(d => d !== ''),
            fechas_inhumacion: parcela.fechas_inhumacion?.split(',') || [],
            grande: parcela.tipo_parcela.toUpperCase().includes('GRANDE')
          })

        });

        if (response.data.pager?.next) {
          loadParcelas(page + 1)
        }

        resizeCanvas();
      }
    })
    .catch(error => {
      console.log(error);
    })
    .finally(() => {
      isLoading.value = false
    })

}

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  canvas.value.removeEventListener('click', handleClick);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('keyup', handleKeyup);
  canvas.value.removeEventListener('wheel', handleWheel);
});
</script>
