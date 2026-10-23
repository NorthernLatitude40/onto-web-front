<template>
  <div class="p-8 max-w-md mx-auto">
    <h2 class="text-xl font-bold mb-6">下拉菜单带删除功能演示</h2>
    
    <Select v-model="selectedValue" @update:model-value="handleSelectionChange">
      <SelectTrigger class="w-full">
        <SelectValue placeholder="选择或创建分组...">
          {{ selectedValue || '选择或创建分组...' }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" class="max-h-60">
        <!-- Existing groups with delete functionality -->
        <SelectGroup>
          <div class="px-2 py-1.5 text-sm font-medium text-gray-500">现有分组</div>
          <SelectItemWithDelete
            v-for="group in groups"
            :key="group.id"
            :value="group.id.toString()"
            :item-name="group.name"
            :is-active="selectedValue === group.id.toString()"
            @delete="handleGroupDelete"
          >
            {{ group.name }}
          </SelectItemWithDelete>
        </SelectGroup>

        <SelectSeparator />

        <!-- Create new group option -->
        <SelectGroup>
          <div class="px-2 py-1.5 text-sm font-medium text-gray-500">操作</div>
          <SelectItem value="create-new">创建新分组...</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>

    <div class="mt-6 p-4 bg-gray-50 rounded">
      <p class="text-sm text-gray-700">
        <strong>当前选择:</strong> {{ selectedValue || '无' }}
      </p>
      <p v-if="deletedGroup" class="mt-2 text-sm text-red-600">
        已删除: {{ deletedGroup }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectSeparator,
} from './index'
import SelectItemWithDelete from './SelectItemWithDelete.vue'

interface ScraperGroup {
  id: number
  name: string
}

const groups = ref<ScraperGroup[]>([
  { id: 1, name: '车辆数据' },
  { id: 2, name: '商品信息' },
  { id: 3, name: '用户评论' },
])

const selectedValue = ref<string>('1')
const deletedGroup = ref<string | null>(null)

const handleSelectionChange = (value: string) => {
  if (value === 'create-new') {
    // Handle create new group logic
    console.log('Create new group')
  }
}

const handleGroupDelete = (payload: { itemName: string; isActive: boolean }) => {
  const { itemName, isActive } = payload
  
  if (isActive) {
    // If deleting the currently active group, switch to first available group
    const currentIndex = groups.value.findIndex(g => g.name === itemName)
    if (currentIndex >= 0 && groups.value.length > 1) {
      // Switch to next group or previous group
      const newIndex = currentIndex === 0 ? 1 : 0
      selectedValue.value = groups.value[newIndex].id.toString()
    } else if (groups.value.length === 1) {
      selectedValue.value = ''
    }
  }
  
  // Remove the group
  groups.value = groups.value.filter(g => g.name !== itemName)
  deletedGroup.value = itemName
}
</script>
