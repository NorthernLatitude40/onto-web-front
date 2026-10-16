<template>
  <div class="relative">
    <SelectTrigger @click="toggleDropdown" ref="triggerRef" :disabled="false">
      <slot></slot>
    </SelectTrigger>

    <SelectContent v-if="isOpen" @select="handleSelect">
      <slot name="content"></slot>
    </SelectContent>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SelectTrigger from "./SelectTrigger.vue";

defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const triggerRef = ref(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// Handle selection from SelectItem - listen for events from children
const handleSelect = (value: string | number) => {
  emit("update:modelValue", value);
  emit("change", value);
  closeDropdown();
};

const closeDropdown = () => {
  isOpen.value = false;
};

// Expose methods for SelectItem to use
defineExpose({
  closeDropdown,
});
</script>
