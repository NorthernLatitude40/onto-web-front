<template>
  <div
    class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    v-show="active"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";

const props = defineProps<{
  value: string;
}>();

const activeValue = inject<{ value: string }>("activeValue");

const active = computed(() => {
  return activeValue?.value === props.value;
});
</script>
