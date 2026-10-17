<template>
  <button
    class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
    :data-state="active ? 'active' : undefined"
    @click="onClick"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";

const props = defineProps<{
  value: string;
}>();

const activeValue = inject<{ value: string }>("activeValue");
const setActiveValue = inject<(value: string) => void>("setActiveValue");

const active = computed(() => {
  return activeValue?.value === props.value;
});

const onClick = () => {
  if (setActiveValue && props.value !== activeValue?.value) {
    setActiveValue(props.value);
  }
};
</script>
