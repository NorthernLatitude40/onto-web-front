# 前端下拉列表Group删除功能实现

## 概述
本文档描述了在爬虫配置管理界面中实现前端下拉列表Group删除功能的详细信息。

## 实现内容

### 1. 分组逻辑实现 (`ScraperConfig.vue`)

#### 添加了分组计算属性
```typescript
// 按 group 字段分组项目
const groupedProjects = computed(() => {
  const groups: Record<string, any[]> = {};
  
  projects.value.forEach(project => {
    if (project.group) {
      if (!groups[project.group]) {
        groups[project.group] = [];
      }
      groups[project.group].push(project);
    }
  });
  
  return groups;
});
```

#### 更新了模板结构
- **无分组项目**：直接显示在列表中，带有删除按钮
- **分组项目**：使用 `SelectGroup` 组件包裹，每个分组标题带有删除按钮
- **分组内项目**：显示在各自的分组下方，保留单独的删除功能

### 2. 分组删除处理函数
```typescript
// 处理分组删除
const handleGroupDelete = async (groupName: string) => {
  try {
    await deleteGroup(groupName);
  } catch (error) {
    console.error('删除分组失败', error);
  }
};
```

### 3. 导入必要的组件
- `SelectGroup`：用于创建分组标题
- `SelectLabel`：用于显示分组名称

## 使用方式

1. **查看分组**：在项目选择下拉列表中，带有分组的项目会按分组名进行分组显示
2. **删除分组**：
   - 鼠标悬停在分组标题上时，右侧会出现删除按钮（垃圾桶图标）
   - 点击删除按钮会弹出确认对话框
   - 确认后将删除整个分组及其下的所有项目
3. **删除单个项目**：每个项目仍然保留独立的删除功能

## 技术细节

### 组件结构
```
SelectContent
├── SelectItem (无分组项目)
└── SelectGroup (有分组的项目)
    ├── 分组标题（带删除按钮）
    └── SelectItem (分组内项目，带删除按钮)
```

### 样式特性
- 分组标题悬停时显示删除按钮（opacity: 0 → opacity: 100）
- 删除按钮颜色：灰色（正常状态），红色（悬停状态）
- 使用 Lucide Vue 的 `Trash2Icon` 图标

### API集成
分组删除通过调用后端API实现：
```
await api.delete(`/api/v1/scraper/groups/${encodeURIComponent(groupName)}`)
```

## 测试验证

### 单元测试
创建了 `test_group_deletion_feature.js` 用于验证分组逻辑：
- 测试分组功能是否正常工作
- 测试删除后剩余项目数量是否正确
- TypeScript编译通过无错误

### 运行结果
```
Grouped projects:
  车辆权限爬虫: 2 projects
    - Project 1
    - Project 2
  商品价格监控: 1 projects
    - Project 3

Ungrouped projects: 1

Deleting group: 车辆权限爬虫
Remaining projects: 2
```

## 修改文件

1. `miniprogram-1/src/views/ScraperConfig.vue`
   - 添加分组计算属性
   - 更新模板结构支持分组显示
   - 添加分组删除处理函数
   - 导入必要的Select组件

2. `miniprogram-1/src/composables/useScraperConfig.ts`
   - 已存在 `deleteGroup` 函数，无需修改

## 注意事项

1. 分组删除会同时删除该分组下的所有项目
2. 确认对话框提供了二次确认机制
3. 删除操作是永久性的，请谨慎操作
4. 无分组的项目（group为null或undefined）将直接显示在列表中

## 未来改进

1. 支持批量选择和删除多个分组
2. 添加分组重命名功能
3. 支持拖放式分组管理
4. 添加更详细的删除确认对话框（显示将要删除的项目数量）
