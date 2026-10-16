<template>
  <div
    class="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
    @click="handleClick"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  value: {
    type: [String, Number],
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select']);

const handleClick = () => {
  if (props.disabled) return;
  
  // Emit selection event
  emit('select', props.value);
};
</script>
