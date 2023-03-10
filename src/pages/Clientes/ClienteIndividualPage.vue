<template>
  <div class="flex flex-center">
    Cliente {{ route.params.id }}
  </div>  
</template>

<script setup>

import { useRoute } from 'vue-router';
const route = useRoute();

</script>
