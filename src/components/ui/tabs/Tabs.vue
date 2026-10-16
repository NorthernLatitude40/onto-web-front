<template>
  <div class="flex flex-col">
    <TabsList>
      <slot name="list"></slot>
    </TabsList>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import TabsList from "./TabsList.vue";
</script>
