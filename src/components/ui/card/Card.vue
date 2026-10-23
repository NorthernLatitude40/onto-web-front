<template>
  <div class="card">
    <div
      class="card-header"
      @click="toggleCollapse"
    >
      <slot name="header"></slot>
      <button
        type="button"
        class="collapse-button"
        :aria-expanded="!collapsed"
      >
        <ChevronDownIcon v-if="!collapsed" class="h-4 w-4" />
        <ChevronRightIcon v-else class="h-4 w-4" />
      </button>
    </div>
    <div
      v-show="!collapsed"
      class="card-content"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ChevronDownIcon, ChevronRightIcon } from "@lucide/vue";

const collapsed = ref(false);

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};
</script>

<style scoped>
.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.card-header:hover {
  background-color: #f3f4f6;
}

.collapse-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.collapse-button:hover {
  background-color: #e5e7eb;
}

.card-content {
  padding: 16px 20px;
}
</style>
