<template>
  <div class="row q-col-gutter-md">
    <div class="col-lg-4 col-12" v-for="option in dashboardOptions">

      <q-card class="my-card">
        <q-card-section class="bg-primary text-white">
          <div class="text-h4"><q-icon :name="option.icon"/> {{ option.name }}</div>
          <div class="text-right text-h3">{{ option.count }}</div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat icon-right="arrow_forward_ios" @click="router.push(option.path)">Ver {{ option.name }}</q-btn>
        </q-card-actions>
      </q-card>

    </div>
  </div>
</template>

<script setup>

import { ref, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useRouter } from "vue-router";

const dashboardOptions = [
  {
    name: "Clientes",
    path: "/clientes",
    icon: "people",
    count: 0,
  },
  {
    name: "Parcelas",
    path: "/parcelas",
    icon: "yard",
    count: 0,
  },
]

const router = useRouter()

</script>
