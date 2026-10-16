<template>
  <div class="key-value-editor">
    <div v-if="items.length === 0" class="empty-state">
      <p class="text-sm text-gray-500">
        没有键值对。点击 "添加键值对" 按钮开始添加。
      </p>
    </div>

    <div v-for="(item, index) in items" :key="index" class="kv-item">
      <div class="kv-inputs">
        <input
          v-model="item.key"
          placeholder="键 (例如: Authorization)"
          class="kv-input"
        />
        <input
          v-model="item.value"
          placeholder="值 (例如: Bearer token...)"
          class="kv-input"
        />
      </div>
      <button @click="removeItem(index)" class="remove-btn">
        <Trash2Icon class="h-4 w-4" />
      </button>
    </div>

    <button @click="addItem" class="add-btn">
      <PlusIcon class="mr-2 h-4 w-4" /> 添加键值对
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, Trash2Icon } from "@lucide/vue";
import { ref, watch } from "vue";

interface KeyValueItem {
  key: string;
  value: string;
}

const props = defineProps<{
  modelValue: KeyValueItem[];
}>();

const emit = defineEmits(["update:modelValue"]);

const items = ref<KeyValueItem[]>([]);

// Initialize from props
watch(
  () => props.modelValue,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(items.value)) {
      items.value = newVal.map((item) => ({ ...item }));
    }
  },
  { deep: true, immediate: true },
);

// Update parent when items change
watch(
  items,
  (newVal) => {
    emit("update:modelValue", newVal);
  },
  { deep: true },
);

const addItem = () => {
  items.value.push({ key: "", value: "" });
};

const removeItem = (index: number) => {
  items.value.splice(index, 1);
};
</script>

<style scoped>
.key-value-editor {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.empty-state {
  padding: 8px 0;
  text-align: center;
  color: #6b7280;
}

.kv-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.kv-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

.kv-input {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  color: #1f2937;
}

.kv-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.remove-btn {
  padding: 4px 8px;
  min-height: auto;
  height: 36px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
}

.remove-btn:hover {
  background-color: #f3f4f6;
}

.add-btn {
  padding: 6px 12px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  color: #3b82f6;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.add-btn:hover {
  background-color: #f3f4f6;
}
</style>
