<template>
  <SelectGroup v-slot="{ props }" :class="props.class">
    <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded group">
      <SelectLabel>{{ label }}</SelectLabel>
      <Button
        variant="ghost"
        size="sm"
        @click.stop="handleDelete"
        title="删除分组"
        class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 h-6 w-6 p-0"
      >
        <Trash2Icon class="h-3.5 w-3.5" />
      </Button>
    </div>
  </SelectGroup>
</template>

<script setup lang="ts">
import { SelectGroup, SelectLabel } from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Trash2Icon } from '@lucide/vue'

const props = defineProps<{
  label: string
  projectId: string | number
}>()

const emit = defineEmits<{
  (e: 'delete', projectId: string | number): void
}>()

const handleDelete = () => {
  emit('delete', props.projectId)
}
</script>
