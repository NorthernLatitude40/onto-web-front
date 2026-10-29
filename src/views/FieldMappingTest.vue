<script setup lang="ts">
import { ref } from 'vue'
import FieldMappingUI from '@/components/scraper/FieldMappingUI.vue'

const currentMappings = ref([])

const sourceFields = [
  { key: 'vehicle.name', displayName: 'Vehicle Name', type: 'string' },
  { key: 'vehicle.model', displayName: 'Vehicle Model', type: 'string' },
  { key: 'vehicle.year', displayName: 'Year', type: 'number' },
  { key: 'price', displayName: 'Price', type: 'number' }
]

const targetFields = [
  { name: 'model_name', displayName: 'Model Name', type: 'string', required: true },
  { name: 'vehicle_year', displayName: 'Year', type: 'number', required: false },
  { name: 'price_usd', displayName: 'Price (USD)', type: 'number', required: true }
]
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Field Mapping Component Test</h1>

    <FieldMappingUI
      v-model="currentMappings"
      :source-fields="sourceFields"
      :target-fields="targetFields"
    />

    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
      <h2 class="text-xl font-semibold mb-4">Debug Information</h2>
      <p>Current mappings: {{ currentMappings.length }}</p>
      <pre>{{ currentMappings }}</pre>
    </div>
  </div>
</template>