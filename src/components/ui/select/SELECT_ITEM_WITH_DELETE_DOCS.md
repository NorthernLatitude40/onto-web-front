# SelectItemWithDelete 组件文档

## 概述
`SelectItemWithDelete` 是一个增强版的下拉菜单项组件，支持在 hover 时显示删除图标，并提供二次确认删除功能。

## 特性
1. **Hover 显示删除图标**: 当鼠标悬停在菜单项上时，右侧会出现垃圾桶图标
2. **颜色状态**: 
   - 默认状态: 次要灰色 (`text-gray-400`)
   - Hover 状态: 高亮红色 (`hover:text-red-500`)
3. **事件阻止**: 点击删除图标时自动调用 `event.stopPropagation()` 防止触发菜单项选择
4. **二次确认**: 删除前弹出 Modal 对话框进行确认
5. **活跃项处理**: 如果删除的是当前选中项，组件会通知父组件进行切换

## 用法

### 基本用法
```vue
<SelectItemWithDelete
  v-for="item in items"
  :key="item.id"
  :value="item.value"
  :item-name="item.name"
  :is-active="selectedValue === item.value"
  @delete="handleDelete"
>
  {{ item.name }}
</SelectItemWithDelete>
```

### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | string | ✓ | - | 菜单项的值，与 Select 的 v-model 绑定 |
| `itemName` | string | ✓ | - | 菜单项显示的名称（用于确认对话框） |
| `isActive` | boolean | ✓ | false | 当前项是否为选中状态 |
| `class` | string | - | - | 自定义 CSS 类名 |

### Events
| Event | Payload | Description |
|-------|---------|-------------|
| `delete` | `{ itemName: string, isActive: boolean }` | 删除确认后触发，返回被删除项的信息 |

## 示例

### 完整示例
```vue
<template>
  <Select v-model="selectedValue">
    <SelectTrigger class="w-full">
      <SelectValue placeholder="选择分组..." />
    </SelectTrigger>
    <SelectContent position="popper">
      <SelectGroup>
        <div class="px-2 py-1.5 text-sm font-medium text-gray-500">分组列表</div>
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
    </SelectContent>
  </Select>
</template>

<script setup>
import { ref } from 'vue'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
} from '@/components/ui/select'
import SelectItemWithDelete from '@/components/ui/select/SelectItemWithDelete.vue'

const groups = ref([
  { id: 1, name: '车辆数据' },
  { id: 2, name: '商品信息' },
])

const selectedValue = ref('1')

const handleGroupDelete = (payload) => {
  const { itemName, isActive } = payload
  
  // 如果删除的是当前选中项，切换到其他项
  if (isActive && groups.value.length > 1) {
    const currentIndex = groups.value.findIndex(g => g.name === itemName)
    const newIndex = currentIndex === 0 ? 1 : 0
    selectedValue.value = groups.value[newIndex].id.toString()
  }
  
  // 移除分组
  groups.value = groups.value.filter(g => g.name !== itemName)
}
</script>
```

## 注意事项
1. **事件阻止**: 组件内部已经处理了 `@click.stop`，无需额外处理
2. **Modal 管理**: 组件内部管理 Modal 的打开/关闭状态
3. **类名继承**: 可以通过 `class` prop 传递自定义样式
4. **响应式**: 确保 `isActive` 值随着选中项的变化而更新

## 依赖组件
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup` - 来自 reka-ui
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` - UI 库对话框组件
- `Button` - UI 库按钮组件
