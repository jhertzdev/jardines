<template>
  <q-btn unelevated class="btn-link btn-dense" :flat="props.isTitle" size="sm" color="primary" v-bind="props"/>
</template>

<style>
.btn-dense {
  padding: 0.25em 0.5em;
  min-height: 2em;
}
</style>


<script setup>
  const props = defineProps(['label', 'to', 'isTitle']);
</script>