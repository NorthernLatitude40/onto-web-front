<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">字段映射 UI 测试</h2>

    <FieldMappingUI
      :source-fields="sampleSourceFields"
      :target-fields="sampleTargetFields"
      @update:mappings="handleMappingsUpdate"
    />

    <div class="mt-6 p-4 bg-gray-100 rounded-lg">
      <h3 class="font-medium mb-2">当前映射结果:</h3>
      <pre>{{ currentMappings }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FieldMappingUI from '../FieldMappingUI.vue';

const sampleSourceFields = [
  { name: "产品名称", key: "product.name", type: "string", sample: "iPhone 15" },
  { name: "价格", key: "product.price", type: "number", sample: "999.00" },
  { name: "库存", key: "product.stock", type: "integer", sample: "100" },
];

const sampleTargetFields = [
  { name: "model_name", label: "产品名称", type: "string", required: true },
  { name: "price", label: "价格", type: "decimal", required: true },
  { name: "stock_quantity", label: "库存数量", type: "integer", required: false },
];

const currentMappings = ref<any[]>([]);

const handleMappingsUpdate = (mappings: any[]) => {
  console.log("Updated mappings:", mappings);
  currentMappings.value = mappings;
};
</script>