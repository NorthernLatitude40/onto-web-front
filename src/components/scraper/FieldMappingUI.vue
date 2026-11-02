<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SourceField {
  key: string
  displayName?: string
  type: string
}

interface TargetField {
  name: string
  displayName: string
  type: string
  required: boolean
}

interface FieldMapping {
  target_field: string
  source_key: string
  is_custom: boolean
}

const props = defineProps<{
  modelValue: FieldMapping[]
  sourceFields: SourceField[]
  targetFields: TargetField[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldMapping[]): void
}>()

const selectedSource = ref<Record<string, string>>({})
const customValues = ref<Record<string, string>>({})

// Initialize selectedSource with all target field names
watch(() => props.targetFields, (newTargetFields) => {
  newTargetFields.forEach(targetField => {
    if (!(targetField.name in selectedSource.value)) {
      selectedSource.value[targetField.name] = ''
    }
  })
}, { immediate: true })

// Initialize from modelValue
watch(() => props.modelValue, (newMappings) => {
  newMappings.forEach(mapping => {
    selectedSource.value[mapping.target_field] = mapping.source_key
  })
}, { immediate: true })

// Calculate similarity between two strings using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // Create a matrix to store distances
  const matrix = Array(len1 + 1).fill(0).map(() => Array(len2 + 1).fill(0))

  // Initialize the matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  const maxLen = Math.max(len1, len2)
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen
}

// Normalize field names for better matching
function normalizeFieldName(name: string) {
  // Convert to lowercase and remove special characters
  let normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Handle camelCase by inserting spaces before capital letters
  const camelCaseNormalized = name.replace(/([A-Z])/g, ' $1').toLowerCase()

  return {
    original: name,
    simple: normalized,
    camelCase: camelCaseNormalized.trim()
  }
}

// Find best match for target field among source fields
function findBestMatch(targetFieldName: string, sourceFields: SourceField[]): { field: string | null; score: number } {
  const targetNorm = normalizeFieldName(targetFieldName)
  let bestMatch = null
  let highestScore = -1

  sourceFields.forEach(source => {
    const sourceKey = source.key || ''
    const sourceNorm = normalizeFieldName(sourceKey)

    // Test different normalization strategies
    const scores = [
      calculateSimilarity(targetNorm.simple, sourceNorm.simple),
      calculateSimilarity(targetNorm.camelCase, sourceNorm.camelCase)
    ]

    const maxScore = Math.max(...scores)
    if (maxScore > highestScore) {
      highestScore = maxScore
      bestMatch = sourceKey
    }
  })

  return { field: bestMatch, score: highestScore }
}

// Auto-map fields based on similarity
function handleAutoMap() {
  const newMappings: FieldMapping[] = []

  props.targetFields.forEach(target => {
    const result = findBestMatch(target.name, props.sourceFields)

    if (result.field && result.score > 0.3) { // Only map if confidence is reasonable
      newMappings.push({
        target_field: target.name,
        source_key: result.field,
        is_custom: false
      })

      // Update the UI selection
      selectedSource.value[target.name] = result.field
    }
  })

  emit('update:modelValue', newMappings)
}

// Reset all mappings
function handleReset() {
  selectedSource.value = {}
  customValues.value = {}
  emit('update:modelValue', [])
}

// Check if a field is mapped
function isMapped(fieldName: string): boolean {
  return props.modelValue.some(mapping => mapping.target_field === fieldName)
}
</script>

<template>
  <div class="field-mapping-container">
    <div class="flex justify-between items-center mb-4">
      <h2>Field Mapping</h2>
      <div class="space-x-2">
        <Button @click="handleAutoMap" variant="outline">Auto Map</Button>
        <Button @click="handleReset" variant="outline">Reset</Button>
      </div>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Target Field (Database)</TableHead>
          <TableHead>Mapping Type / Source Field</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="targetField in targetFields" :key="targetField.name">
          <TableCell>
            <div>{{ targetField.displayName }}</div>
            <div class="text-sm text-gray-500">{{ targetField.name }} ({{ targetField.type }})</div>
            <Badge v-if="targetField.required" variant="destructive">Required</Badge>
          </TableCell>
          <TableCell>
            <Select v-model="selectedSource[targetField.name]">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="-- Select Source Field --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Source Field --</SelectItem>
                <SelectItem value="custom">Custom Value</SelectItem>
                <SelectItem
                  v-for="source in sourceFields"
                  :key="source.key"
                  :value="source.key"
                >
                  {{ source.displayName || source.key }} ({{ source.type }})
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Custom value input -->
            <Input
              v-if="selectedSource[targetField.name] === 'custom'"
              v-model="customValues[targetField.name]"
              type="text"
              placeholder="Enter custom value"
              class="w-full mt-2"
            />
          </TableCell>
          <TableCell>
            <Badge v-if="isMapped(targetField.name)" variant="default">✓ Mapped</Badge>
            <Badge v-else variant="secondary">⚠ Not mapped</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <div class="mt-4">
      <h3>Current Mappings:</h3>
      <pre>{{ modelValue }}</pre>
    </div>
  </div>
</template>

<style scoped>
.field-mapping-container {
  @apply p-4 bg-white rounded-lg shadow-sm;
}

.required-badge {
  @apply bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded;
}
</style>