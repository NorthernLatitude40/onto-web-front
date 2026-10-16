<template>
  <span class="text-sm text-muted-foreground">
    {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  placeholder: {
    type: String,
    default: "请选择...",
  },
});

// Find the corresponding project name based on selected value
const projects = [
  { id: '1', name: '车辆数据爬虫' },
  { id: '2', name: '商品价格监控' },
  { id: '3', name: '新闻文章采集' }
];

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder;
  
  const project = projects.find(p => p.id === props.modelValue);
  return project ? project.name : props.placeholder;
});
</script>
