<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">字段映射 UI 演示</h1>

    <FieldMappingUI
      :source-fields="sampleSourceFields"
      :target-fields="sampleTargetFields"
      @update:mappings="handleMappingsUpdate"
    />

    <div class="mt-6 p-4 bg-gray-100 rounded-lg">
      <h2 class="font-medium mb-2">当前映射结果:</h2>
      <pre>{{ currentMappings }}</pre>
    </div>

    <div class="mt-4 text-sm text-gray-600">
      <p>点击源字段或目标字段创建映射，点击连线上的 × 删除映射</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FieldMappingUI from '../components/scraper/FieldMappingUI/FieldMappingUI.vue';

const sampleSourceFields = [
  { name: "产品名称", key: "product.name", type: "string", sample: "iPhone 15" },
  { name: "价格", key: "product.price", type: "number", sample: "999.00" },
  { name: "库存", key: "product.stock", type: "integer", sample: "100" },
  { name: "品牌", key: "product.brand", type: "string", sample: "Apple" },
];

const sampleTargetFields = [
  { name: "model_name", label: "产品名称", type: "string", required: true },
  { name: "price", label: "价格", type: "decimal", required: true },
  { name: "stock_quantity", label: "库存数量", type: "integer", required: false },
  { name: "brand_name", label: "品牌名称", type: "string", required: false },
];

const currentMappings = ref<any[]>([]);

const handleMappingsUpdate = (mappings: any[]) => {
  console.log("Updated mappings:", mappings);
  currentMappings.value = mappings;
};
</script>