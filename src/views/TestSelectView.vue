<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Select Component Test</h1>

    <div class="space-y-6">
      <!-- Basic Select Test -->
      <div class="border p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">Basic Select Test</h2>
        <Select v-model="basicValue" @update:modelValue="logChange('Basic')">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
        <p class="mt-2 text-sm">Selected: {{ basicValue }}</p>
      </div>

      <!-- Dynamic v-model Test (like FieldMappingUI) -->
      <div class="border p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">Dynamic v-model Test</h2>
        <div v-for="(field, index) in testFields" :key="index" class="mb-4">
          <label class="block text-sm font-medium mb-1">{{ field.name }}</label>
          <Select
            :v-model="selectedSource[field.name]"
            @update:modelValue="logChange(field.name)"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="source1">Source 1</SelectItem>
              <SelectItem value="source2">Source 2</SelectItem>
              <SelectItem value="source3">Source 3</SelectItem>
            </SelectContent>
          </Select>
          <p class="mt-1 text-sm">Selected: {{ selectedSource[field.name] }}</p>
        </div>
      </div>

      <!-- Change Log -->
      <div class="border p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">Change Log</h2>
        <ul class="space-y-1 text-sm">
          <li v-for="(log, index) in changeLog" :key="index">{{ log }}</li>
        </ul>
      </div>

      <!-- Initialize Data Button -->
      <button
        @click="initializeData"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Initialize Test Data
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const basicValue = ref('')
const selectedSource = ref<Record<string, string>>({})
const testFields = ref([
  { name: 'field1', label: 'Field 1' },
  { name: 'field2', label: 'Field 2' },
  { name: 'field3', label: 'Field 3' }
])
const changeLog = ref<string[]>([])

// Initialize selectedSource with all field names
watch(() => testFields.value, (newFields) => {
  newFields.forEach(field => {
    if (!(field.name in selectedSource.value)) {
      selectedSource.value[field.name] = ''
    }
  })
}, { immediate: true })

function logChange(componentName: string) {
  const timestamp = new Date().toLocaleTimeString()
  changeLog.value.push(`${timestamp} - ${componentName}: ${selectedSource.value[componentName] || basicValue.value}`)
}

function initializeData() {
  selectedSource.value.field1 = 'source2'
  selectedSource.value.field2 = 'source3'
  basicValue.value = 'option1'
  changeLog.value.push('Test data initialized')
}
</script>