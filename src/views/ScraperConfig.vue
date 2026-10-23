<template>
  <div class="scraper-config-dashboard">
    <!-- Header Toolbar -->
    <div class="header-toolbar">
      <div class="header-left">
        <h1 class="page-title">爬虫配置管理</h1>
        <p class="page-description">
          管理和执行网络爬虫任务,设置目标URL、请求参数、解析规则等
        </p>
      </div>

      <div class="header-right">
        <!-- Project Selector + Group Creation -->
        <div class="project-selector flex items-center gap-2">
          <Select v-model="selectedProjectId">
            <SelectTrigger class="w-[200px]">
              <SelectValue placeholder="选择爬虫项目..." />
            </SelectTrigger>
            <SelectContent position="popper">
              <!-- Project Items with Delete (Grouped by group field) -->
              <!-- 无分组的项目 -->
              <template v-for="project in projects" :key="project.id">
                <div v-if="!project.group">
                  <SelectItem :value="String(project.id)">
                    <div
                      class="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <span>{{ project.name }}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-6 w-6 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        @click.stop="handleProjectDelete(project.id)"
                      >
                        <Trash2Icon class="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </SelectItem>
                </div>
              </template>

              <!-- 按分组显示的项目 -->
              <template
                v-for="(groupName, groupProjects) in groupedProjects"
                :key="groupName"
              >
                <SelectGroup>
                  <div
                    class="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <SelectLabel>{{ groupName }}</SelectLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="handleGroupDelete(groupName)"
                      title="删除分组"
                      class="text-gray-400 opacity-0 hover:opacity-100 transition-opacity hover:text-red-500 h-6 w-6 p-0"
                    >
                      <Trash2Icon class="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <template v-for="project in groupProjects" :key="project.id">
                    <SelectItem :value="String(project.id)">
                      <div
                        class="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <span>{{ project.name }}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-6 w-6 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          @click.stop="handleProjectDelete(project.id)"
                        >
                          <Trash2Icon class="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </SelectItem>
                  </template>
                </SelectGroup>
              </template>
            </SelectContent>
          </Select>

          <!-- 新增爬虫项目/分组按钮 -->
          <Button
            @click="isCreateProjectDialogOpen = true"
            variant="outline"
            size="icon"
            title="新建爬虫项目/分组"
          >
            <FolderPlusIcon class="h-4 w-4" />
          </Button>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <Button @click="showCreateConfigForm" variant="default" size="sm">
            <PlusIcon class="mr-2 h-4 w-4" /> 新增爬虫配置
          </Button>
          <Button @click="handleBatchImport" variant="outline" size="sm">
            <FolderOpenIcon class="mr-2 h-4 w-4" /> 批次导入
          </Button>
          <Button @click="refreshConfigs" variant="outline" size="sm">
            <RefreshCwIcon class="mr-2 h-4 w-4" /> 重新整理
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Loading State -->
      <div
        v-if="isLoading && !selectedConfigId && !creatingNewConfig"
        class="loading-state"
      >
        <div class="loading-spinner">
          <Loader2Icon class="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <p class="loading-text">正在加载爬虫配置...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!isLoading && configs.length === 0 && !creatingNewConfig"
        class="empty-state"
      >
        <div class="empty-icon">
          <FileSearchIcon class="h-12 w-12 text-gray-400" />
        </div>
        <h3 class="empty-title">暂无爬虫配置</h3>
        <p class="empty-description">当前项目下没有找到任何爬虫配置文件</p>
        <Button @click="showCreateConfigForm" variant="default">
          <PlusIcon class="mr-2 h-4 w-4" /> 创建第一个配置
        </Button>
      </div>

      <!-- Main Dashboard Layout -->
      <div v-else class="dashboard-layout">
        <!-- Left Sidebar - Configuration Overview -->
        <div class="sidebar">
          <div class="config-overview-card">
            <h3 class="card-title">配置概览</h3>

            <!-- Status Badge -->
            <div v-if="selectedConfig" class="status-badge-container">
              <span
                class="status-badge"
                :class="getStatusClass(selectedConfig.status)"
              >
                {{ getStatusText(selectedConfig.status) }}
              </span>
            </div>

            <!-- Configuration Selector -->
            <div class="config-selector">
              <Select v-model="selectedConfigId">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="选择爬虫配置..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem
                    v-for="config in configs"
                    :key="config.id"
                    :value="String(config.id)"
                  >
                    {{ config.name || `配置 ${config.id}` }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Execution Stats -->
            <div v-if="selectedConfig" class="execution-stats">
              <div class="stat-item">
                <span class="stat-label">上次执行时间:</span>
                <span class="stat-value">
                  {{
                    selectedConfig.last_run_at
                      ? formatDate(selectedConfig.last_run_at)
                      : "未执行"
                  }}
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功率:</span>
                <span class="stat-value success-rate">
                  {{
                    selectedConfig.success_rate !== undefined
                      ? `${selectedConfig.success_rate}%`
                      : "N/A"
                  }}
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已抓取笔数:</span>
                <span class="stat-value">
                  {{
                    selectedConfig.items_scraped !== undefined
                      ? selectedConfig.items_scraped
                      : "0"
                  }}
                </span>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
              <Button
                @click="executeScrape"
                :disabled="!selectedConfigId"
                variant="default"
                size="sm"
                class="w-full"
              >
                <PlayIcon class="mr-2 h-4 w-4" /> 立即执行
              </Button>
              <Button
                @click="testConnection"
                :disabled="!selectedConfigId"
                variant="outline"
                size="sm"
                class="w-full"
              >
                <ZapIcon class="mr-2 h-4 w-4" /> 测试连接
              </Button>
              <Button
                @click="deleteConfig"
                :disabled="!selectedConfigId"
                variant="outline"
                size="sm"
                class="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              >
                <Trash2Icon class="mr-2 h-4 w-4" /> 删除配置
              </Button>
            </div>
          </div>
        </div>

        <!-- Main Content - Configuration Form -->
        <div class="main-content-area">
          <div class="config-tabs">
            <Tabs v-model="activeTab" class="w-full flex flex-col space-y-4">
              <!-- 頂部頁籤按鈕區域 (明確分隔線與水平佈局) -->
              <div class="border-b pb-3">
                <TabsList
                  class="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
                >
                  <TabsTrigger value="basic">基本设定</TabsTrigger>
                  <TabsTrigger value="steps">步骤流程</TabsTrigger>
                  <TabsTrigger value="parsing">数据解析规则</TabsTrigger>
                  <TabsTrigger value="multi-parser">多解析器规则</TabsTrigger>
                </TabsList>
              </div>

              <!-- 下方內容表單區域 (獨立滿寬度，絕不擠壓) -->
              <div class="w-full pt-2">
                <TabsContent value="basic" class="mt-0">
                  <BasicSettingsTab :form-data="formData" />
                </TabsContent>

                <TabsContent value="steps" class="mt-0 py-4">
                  <StepsWorkflowTab
                    :steps="steps"
                    @add="addStep"
                    @remove="removeStep"
                    @duplicate="duplicateStep"
                    @dragstart="handleDragStart"
                    @dragover="handleDragOver"
                    @dragenter="handleDragEnter"
                    @dragend="handleDragEnd"
                    @drop="handleDrop"
                  />
                </TabsContent>

                <TabsContent value="parsing" class="mt-0 py-4">
                  <ParsingRulesTab
                    :steps="steps"
                    :global-parsing-rules="globalParsingRules"
                    v-model:jsonpath="jsonpath"
                  />
                </TabsContent>

                <TabsContent value="multi-parser" class="mt-0">
                  <MultiParserTab
                    :steps="steps"
                    @add-rule="addMultiParserRule"
                    @remove-rule="
                      (stepIndex, ruleIndex) =>
                        steps[stepIndex].multi_parser_rules.splice(ruleIndex, 1)
                    "
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <!-- Footer Actions -->
          <div class="footer-actions">
            <Button @click="resetForm" variant="outline" size="sm">
              <RotateCcwIcon class="mr-2 h-4 w-4" /> 重置
            </Button>
            <Button @click="saveConfig" variant="default" size="sm">
              <SaveIcon class="mr-2 h-4 w-4" /> 保存
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Message -->
    <Alert v-if="message" :variant="getAlertVariant(messageType)" class="mt-4">
      <component :is="getAlertIcon(messageType)" class="h-4 w-4" />
      {{ message }}
    </Alert>

    <!-- Batch Import Dialog -->
    <Dialog v-model:open="isImportDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>批量导入爬虫配置</DialogTitle>
          <DialogDescription>
            请上传包含多个爬虫配置的JSON文件。每个配置将被创建为独立的记录。
          </DialogDescription>
        </DialogHeader>

        <div class="py-4">
          <Input
            type="file"
            accept=".json"
            @change="handleFileChange"
            ref="importFileInput"
          />
        </div>

        <div v-if="isImporting" class="flex items-center justify-center py-4">
          <Loader2Icon class="mr-2 h-5 w-5 animate-spin" />
          正在导入... {{ importProgress }}%
        </div>

        <div
          v-if="importResult && !isImporting"
          class="mt-4 p-3 bg-gray-50 rounded"
        >
          <p class="text-sm font-medium">导入结果:</p>
          <p class="text-sm mt-1">成功: {{ importResult.successCount }}</p>
          <p class="text-sm">失败: {{ importResult.errorCount }}</p>
          <div
            v-if="importResult.errors.length > 0"
            class="mt-2 text-xs text-red-600"
          >
            <p>错误详情:</p>
            <ul class="list-disc list-inside mt-1">
              <li v-for="(error, index) in importResult.errors" :key="index">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            @click="isImportDialogOpen = false"
            :disabled="isImporting"
          >
            取消
          </Button>
          <Button
            type="button"
            @click="parseAndImportConfig()"
            :disabled="!importFile || isImporting"
          >
            <Loader2Icon v-if="isImporting" class="mr-2 h-4 w-4 animate-spin" />
            确认导入
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Create Project / Group Dialog -->
    <CreateProjectDialog
      v-model:open="isCreateProjectDialogOpen"
      @created="handleProjectCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { useScraperConfig } from "@/composables/useScraperConfig";
import { format } from "date-fns";
import { computed, onMounted, ref, watch } from "vue";

// 子组件引入
import BasicSettingsTab from "@/components/scraper/BasicSettingsTab.vue";
import CreateProjectDialog from "@/components/scraper/CreateProjectDialog.vue";
import MultiParserTab from "@/components/scraper/MultiParserTab.vue";
import ParsingRulesTab from "@/components/scraper/ParsingRulesTab.vue";
import StepsWorkflowTab from "@/components/scraper/StepsWorkflowTab.vue";

// UI Components
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  AlertCircle,
  CheckCircle2,
  FileSearchIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  Info,
  Loader2Icon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
  ZapIcon,
} from "@lucide/vue";

// 控制项目创建弹窗状态
const isCreateProjectDialogOpen = ref(false);

// 从 Composable 引入狀態與方法
const {
  configs,
  projects,
  selectedProjectId,
  selectedConfigId,
  selectedConfig,
  activeTab,
  isLoading,
  creatingNewConfig,
  message,
  messageType,
  formData,
  steps,
  globalParsingRules,
  jsonpath,
  fetchConfigs,
  loadSelectedConfig,
  resetForm,
  saveConfig,
  executeScrape,
  testConnection,
  deleteConfig,
  addStep,
  removeStep,
  duplicateStep,
  addMultiParserRule,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragEnd,
  handleDrop,
  refreshConfigs,
  handleBatchImport,
  isImportDialogOpen,
  handleFileChange,
  parseAndImportConfig,
  isImporting,
  importProgress,
  importFile,
  importResult,
  showCreateConfigForm,
  deleteProject,
  deleteGroup,
} = useScraperConfig();

// 按 group 字段分组项目
const groupedProjects = computed(() => {
  const groups: Record<string, any[]> = {};

  projects.value.forEach((project) => {
    if (project.group) {
      if (!groups[project.group]) {
        groups[project.group] = [];
      }
      groups[project.group].push(project);
    }
  });

  return groups;
});

// 处理新项目/分组创建成功
const handleProjectCreated = (newProject: {
  id: string | number;
  name: string;
}) => {
  // 将新建立的项目推入列表
  projects.value.push(newProject);
  // 自动将 Selector 选中的项目切换为新建的项目
  selectedProjectId.value = String(newProject.id);
};

// 处理项目/分组删除
const handleProjectDelete = async (projectId: string | number) => {
  try {
    await deleteProject(projectId);
  } catch (error) {
    console.error("删除项目失败", error);
  }
};

// 处理分组删除
const handleGroupDelete = async (groupName: string) => {
  try {
    await deleteGroup(groupName);
  } catch (error) {
    console.error("删除分组失败", error);
  }
};

// 顯示輔助函數
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "yyyy-MM-dd HH:mm:ss");
  } catch {
    return dateString;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "running":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "success":
      return "bg-green-100 text-green-800 border-green-300";
    case "failed":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "running":
      return "运行中";
    case "success":
      return "成功";
    case "failed":
      return "失败";
    default:
      return "未执行";
  }
};

const getAlertVariant = (type: string) =>
  type === "error" ? "destructive" : "default";

const getAlertIcon = (type: string) => {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "error":
      return AlertCircle;
    default:
      return Info;
  }
};

watch(selectedConfigId, (id) => {
  if (id) {
    creatingNewConfig.value = false;
    loadSelectedConfig();
  }
});

watch(selectedProjectId, () => {
  selectedConfigId.value = null;
  selectedConfig.value = null;
  resetForm();
  fetchConfigs();
});

onMounted(() => {
  fetchConfigs();
});
</script>

<style scoped>
.scraper-config-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  text-align: left;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
}
.header-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.header-left {
  flex: 1;
}
.page-title {
  color: #1e3a8a;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}
.page-description {
  color: #6b7280;
  font-size: 14px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.action-buttons {
  display: flex;
  gap: 8px;
}
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}
.empty-state {
  text-align: center;
}
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-text {
  color: #6b7280;
  font-size: 16px;
}
.empty-icon {
  color: #d1d5db;
}
.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}
.empty-description {
  color: #6b7280;
  margin-bottom: 24px;
}
.dashboard-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  padding: 24px;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.config-overview-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}
.status-badge-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.status-badge {
  padding: 6px 12px;
  border-radius: 9999px;
  border-width: 1px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.config-selector {
  margin-bottom: 20px;
}
.execution-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.stat-label {
  color: #6b7280;
}
.stat-value {
  color: #374151;
  font-weight: 500;
}
.success-rate {
  color: #16a34a;
}
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.main-content-area {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 0;
}
.config-tabs {
  margin-bottom: 24px;
}
.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}
@media (max-width: 768px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
  .header-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .header-right {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
  }
}
</style>
