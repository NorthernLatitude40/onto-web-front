<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Simple Select Test</h1>

    <div class="mb-6">
      <h2 class="font-semibold mb-2">Basic Select (should work)</h2>
      <Select v-model="basicValue" @update:model-value="logChange('Basic')">
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
      <p class="mt-2">Selected: {{ basicValue }}</p>
    </div>

    <div class="mb-6">
      <h2 class="font-semibold mb-2">Dynamic Select (like FieldMappingUI)</h2>
      <div v-for="(field, index) in fields" :key="index" class="mb-4">
        <label class="block mb-1">{{ field.name }}:</label>
        <Select
          v-model="selectedSource[field.name]"
          @update:model-value="logChange(field.name)"
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
        <p class="mt-1">Selected: {{ selectedSource[field.name] }}</p>
      </div>
    </div>

    <div class="mb-6">
      <h2 class="font-semibold mb-2">Initialize Data</h2>
      <button @click="initializeData" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Initialize Data
      </button>
      <p v-if="initialized" class="mt-2 text-green-600">Data initialized!</p>
    </div>

    <div class="bg-gray-100 p-4 rounded mt-6">
      <h3 class="font-semibold mb-2">Change Log:</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li v-for="(log, index) in changeLog" :key="index">{{ log }}</li>
      </ul>
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
const fields = ref([
  { name: 'field1', label: 'Field 1' },
  { name: 'field2', label: 'Field 2' },
  { name: 'field3', label: 'Field 3' }
])
const changeLog = ref<string[]>([])
const initialized = ref(false)

// Initialize selectedSource with all field names
watch(fields, (newFields) => {
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
  initialized.value = true
  changeLog.value.push('Data initialized manually')
}
</script>