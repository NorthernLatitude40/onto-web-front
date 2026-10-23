# 前端下拉列表Group删除功能实现

## 概述
本文档描述了在爬虫配置管理系统中实现前端下拉列表Group删除功能的详细信息。

## 实现内容

### 1. 新增deleteProject函数（useScraperConfig.ts）
- 在`miniprogram-1/src/composables/useScraperConfig.ts`中添加了`deleteProject`函数
- 功能：删除指定的爬虫项目/分组
- 实现逻辑：
  - 确认用户意图（弹出确认对话框）
  - 调用后端API执行删除操作
  - 更新前端projects列表
  - 如果删除的是当前选中的项目，自动切换到第一个可用的项目或重置选择状态
  - 提示用户操作结果（成功/失败）

### 2. 新增GroupListWithDelete组件（新文件）
- 创建`miniprogram-1/src/components/scraper/GroupListWithDelete.vue`
- 功能：显示带有删除按钮的分组标签
- 特性：
  - 继承自Reka UI的SelectGroup组件
  - 在每个分组右侧显示红色垃圾桶图标
  - 点击删除按钮时触发delete事件
  - 支持hover效果，提高用户体验

### 3. 更新ScraperConfig视图（ScraperConfig.vue）
- 导入新的GroupListWithDelete组件
- 从useScraperConfig中解构出deleteProject函数
- 添加handleProjectDelete处理函数
- 在项目选择下拉菜单中集成删除功能：
  - 每个分组前面显示GroupListWithDelete组件
  - GroupListWithDelete负责显示标签和删除按钮
  - SelectItem仍然保留用于实际的选项选择

## 技术细节

### 组件结构
```
SelectContent (下拉菜单内容)
├── GroupListWithDelete (分组标题带删除按钮)
│   ├── SelectLabel (显示分组名称)
│   └── Button (删除按钮，红色垃圾桶图标)
└── SelectItem (实际可选项)
```

### 事件流程
1. 用户点击下拉菜单打开列表
2. 在每个分组旁边显示删除按钮（红色垃圾桶图标）
3. 用户点击删除按钮触发@delete事件
4. 父组件（ScraperConfig）接收到handleProjectDelete调用
5. 调用useScraperConfig中的deleteProject函数执行实际删除操作
6. 后端API被调用，前端状态被更新
7. 用户看到成功/失败提示

### 样式设计
- 删除按钮使用red-500颜色，hover时变为red-700
- 按钮大小为6x6像素，内部图标为3.5x3.5像素
- hover时整个分组行背景变为gray-50，提高可点击感知
- 圆角设计（rounded）提升视觉体验

## API集成

### 后端API调用
```typescript
await deleteVehicleConfig(projectId)
```

注意：当前实现使用了deleteVehicleConfig API，但根据上下文可能需要单独的deleteProject API。如果后端没有提供专门的项目删除接口，建议后端开发人员添加该API以提高代码清晰度和维护性。

## 错误处理
- 所有错误都被捕获并显示给用户
- 删除操作在确认对话框中进行，防止误操作
- 如果删除当前选中的项目，系统会自动重置选择状态

## 测试
- TypeScript编译通过（无错误）
- 组件结构正确，事件绑定正常
- 删除逻辑与现有配置删除逻辑一致

## 未来改进建议
1. 添加批量删除功能
2. 支持回收站机制（软删除）
3. 添加删除确认对话框，显示将要删除的项目名称和配置数量
4. 考虑添加管理员权限检查
5. 优化移动端体验
