<template>
  <div class="flex flex-col">
    <TabsList>
      <slot name="list"></slot>
    </TabsList>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { provide } from "vue";
import TabsList from "./TabsList.vue";

const activeValue = defineModel<string>();

provide("activeValue", activeValue);
provide("setActiveValue", (value: string) => {
  activeValue.value = value;
});
</script>
