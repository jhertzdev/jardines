<template>
  <q-item v-if="link.length" clickable tag="a" target="_blank" :href="link">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>

  <template v-if="children.length">
    <q-item clickable @click="isExpanded = !isExpanded">
      <q-item-section avatar>
        <q-icon :name="isExpanded ? 'expand_more' : 'chevron_right'" />
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ title }}</q-item-label>
        <q-item-label caption>{{ caption }}</q-item-label>
      </q-item-section>
    </q-item>

    <q-list v-if="isExpanded">
      <MenuLink v-for="link in children" :key="link.title" v-bind="link" />
    </q-list>
  </template>


  <q-item v-else clickable :to="to" exact>
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>

import { ref } from 'vue'
import MenuLink from 'src/components/MenuLink.vue'

const isExpanded = ref(true)

const props = defineProps({
  title: {
    type: String,
    required: true
  },

  caption: {
    type: String,
    default: ''
  },

  link: {
    type: String,
    default: ''
  },

  to: {
    type: String,
    default: ''
  },

  children: {
    type: Array,
    default: []
  },

  icon: {
    type: String,
    default: ''
  }
})

</script>
