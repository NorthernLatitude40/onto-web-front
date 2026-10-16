<template>
  <div
    class="absolute z-50 mt-1 max-h-[300px] overflow-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    @select="handleSelect"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['select']);

const handleSelect = (value: string | number) => {
  emit('select', value);
};
</script>
