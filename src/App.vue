<template>
  <router-view />
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App',
  mounted() {
    //this.$router.push('/auth/login')
    this.$q.dark.set(false);
  }
})
</script>
