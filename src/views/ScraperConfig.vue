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
        <!-- Project Selector -->
        <div class="project-selector">
          <Select v-model="selectedProjectId">
            <SelectTrigger class="w-[200px]">
              <SelectValue placeholder="选择爬虫项目..." />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem
                v-for="project in projects"
                :key="project.id"
                :value="project.id"
              >
                {{ project.name }}
              </SelectItem>
            </SelectContent>
          </Select>
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
            </div>
          </div>
        </div>

        <!-- Main Content - Configuration Form -->
        <div class="main-content-area">
          <div class="config-tabs">
            <Tabs v-model="activeTab" class="w-full">
              <TabsList>
                <TabsTrigger value="basic">基本设定</TabsTrigger>
                <TabsTrigger value="advanced">高级参数</TabsTrigger>
                <TabsTrigger value="parsing">数据解析规则</TabsTrigger>
              </TabsList>

              <!-- Basic Settings Tab -->
              <TabsContent value="basic" class="py-4">
                <div class="form-grid">
                  <div class="form-group">
                    <Label for="name">任务名称</Label>
                    <Input
                      id="name"
                      v-model="formData.name"
                      placeholder="为配置命名..."
                    />
                  </div>

                  <div class="form-group">
                    <Label for="targetUrl">目标 URL</Label>
                    <Input
                      id="targetUrl"
                      v-model="formData.target_url"
                      placeholder="https://example.com/api/data"
                    />
                  </div>

                  <div class="form-group">
                    <Label for="method">请求方式</Label>
                    <Select v-model="formData.method">
                      <SelectTrigger id="method" class="w-full">
                        <SelectValue placeholder="选择请求方法..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="form-group">
                    <Label for="cronSchedule">Cron 定时排程</Label>
                    <Input
                      id="cronSchedule"
                      v-model="formData.cron_schedule"
                      placeholder="0 0 * * * (每天 midnight)"
                    />
                  </div>
                </div>
              </TabsContent>

              <!-- Advanced Parameters Tab -->
              <TabsContent value="advanced" class="py-4">
                <div class="form-grid">
                  <div class="form-group full-width">
                    <Label>Headers / Cookies</Label>
                    <KeyValueEditor v-model="headersData" />
                  </div>

                  <div class="form-group full-width">
                    <Label for="userAgent">User-Agent</Label>
                    <Input
                      id="userAgent"
                      v-model="formData.user_agent"
                      placeholder="Mozilla/5.0..."
                    />
                  </div>

                  <div class="form-group">
                    <Label for="concurrency">Concurrency (并发数)</Label>
                    <Input
                      id="concurrency"
                      v-model.number="formData.concurrency"
                      type="number"
                      min="1"
                      max="50"
                    />
                  </div>

                  <div class="form-group">
                    <Label for="timeout">Timeout (秒)</Label>
                    <Input
                      id="timeout"
                      v-model.number="formData.timeout"
                      type="number"
                      min="5"
                      max="300"
                    />
                  </div>

                  <div class="form-group full-width">
                    <Label for="proxy">Proxy 代理</Label>
                    <Input
                      id="proxy"
                      v-model="formData.proxy"
                      placeholder="http://proxy.example.com:8080"
                    />
                  </div>
                </div>
              </TabsContent>

              <!-- Data Parsing Rules Tab -->
              <TabsContent value="parsing" class="py-4">
                <div class="form-grid">
                  <div class="form-group full-width">
                    <Label for="cssSelector">CSS Selector</Label>
                    <Textarea
                      id="cssSelector"
                      v-model="formData.css_selector"
                      placeholder=".product-item, .article"
                      rows="4"
                    />
                  </div>

                  <div class="form-group full-width">
                    <Label for="xpath">XPath</Label>
                    <Textarea
                      id="xpath"
                      v-model="formData.xpath"
                      placeholder="//div[@class='content']"
                      rows="4"
                    />
                  </div>

                  <div class="form-group full-width">
                    <Label for="jsonSchema">JSON Schema 规则</Label>
                    <Textarea
                      id="jsonSchema"
                      v-model="formData.json_schema"
                      placeholder="{...}"
                      rows="6"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <!-- Footer Actions -->
          <div class="footer-actions">
            <Button @click="resetForm" variant="outline" size="sm">
              <RotateCcwIcon class="mr-2 h-4 w-4" /> 重置
            </Button>
            <Button @click="saveConfig" variant="default" size="sm">
              <SaveIcon class="mr-2 h-4 w-4" /> 储存配置
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { format } from "date-fns";
import {
  getVehicleConfigs,
  getVehicleConfigById,
  createVehicleConfig,
  updateVehicleConfig,
  executeVehicleScrape,
  testVehicleConnection,
} from "@/api/vehicles";

// UI Components (shadcn-vue: 每个组件从自己的目录导入)
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { env } from "@/config/env";

// Icons
import {
  PlusIcon,
  FolderOpenIcon,
  RefreshCwIcon,
  PlayIcon,
  ZapIcon,
  SaveIcon,
  RotateCcwIcon,
  FileSearchIcon,
  Loader2Icon,
  CheckCircle2,
  AlertCircle,
  Info,
} from "@lucide/vue";

// Local Components
import KeyValueEditor from "./KeyValueEditor.vue";

// ---------- State ----------
const configs = ref<any[]>([]);
const projects = ref([
  { id: "1", name: "车辆数据爬虫" },
  { id: "2", name: "商品价格监控" },
  { id: "3", name: "新闻文章采集" },
]);
const selectedProjectId = ref("1");
// Select 的 value 必须是字符串,所以 id 统一用 string 保存
const selectedConfigId = ref<string | null>(null);
const selectedConfig = ref<any>(null);
const activeTab = ref("basic");
const isLoading = ref(true);
const creatingNewConfig = ref(false);
const message = ref("");
const messageType = ref<"info" | "success" | "error">("info");

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

const createDefaultForm = () => ({
  name: "",
  target_url: "",
  method: "GET",
  cron_schedule: "",
  user_agent: DEFAULT_USER_AGENT,
  concurrency: 5,
  timeout: 30,
  proxy: "",
  css_selector: "",
  xpath: "",
  json_schema: JSON.stringify({ type: "object" }, null, 2),
});

const createDefaultHeaders = () => [
  { key: "User-Agent", value: "Mozilla/5.0" },
  { key: "Accept", value: "application/json" },
];

const formData = ref(createDefaultForm());
const headersData = ref(createDefaultHeaders());

// ---------- Helpers ----------
let messageTimer: ReturnType<typeof setTimeout> | null = null;

const setMessage = (msg: string, type: "info" | "success" | "error") => {
  message.value = msg;
  messageType.value = type;
  if (messageTimer) clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    message.value = "";
  }, 5000);
};
const showSuccess = (msg: string) => setMessage(msg, "success");
const showError = (msg: string) => setMessage(msg, "error");
const showInfo = (msg: string) => setMessage(msg, "info");

const errorText = (error: any) =>
  error?.response?.data?.detail || error?.message || "未知错误";

const buildPayload = () => {
  let jsonSchema: unknown = {};
  const raw = formData.value.json_schema?.trim();
  if (raw) {
    try {
      jsonSchema = JSON.parse(raw);
    } catch {
      throw new Error("JSON Schema 规则不是合法的 JSON");
    }
  }
  return {
    ...formData.value,
    json_schema: jsonSchema,
    headers: Object.fromEntries(
      headersData.value
        .filter((h) => h.key.trim())
        .map((h) => [h.key.trim(), h.value]),
    ),
  };
};

// ---------- API ----------
const fetchConfigs = async () => {
  isLoading.value = true;
  try {
    const responseData = await getVehicleConfigs();

    // Handle both array responses and wrapped responses
    let parsedConfigs = [];
    if (Array.isArray(responseData)) {
      parsedConfigs = responseData;
    } else if (responseData && typeof responseData === "object") {
      parsedConfigs = responseData.data || responseData;
    }

    configs.value = Array.isArray(parsedConfigs) ? parsedConfigs : [];

    console.log("Parsed Configs:", configs.value);
    console.log("Config length:", configs.value.length);

    if (selectedConfigId.value) {
      // 已选中:刷新详情
      await loadSelectedConfig();
    } else if (configs.value.length > 0 && !creatingNewConfig.value) {
      // 默认选第一个,watch 会自动加载详情
      selectedConfigId.value = String(configs.value[0].id);
    }
  } catch (error: any) {
    showError("加载配置失败: " + errorText(error));
    console.error("Fetch configs error:", error);
  } finally {
    isLoading.value = false;
  }
};

const loadSelectedConfig = async () => {
  if (!selectedConfigId.value) {
    selectedConfig.value = null;
    return;
  }

  try {
    const data = await getVehicleConfigById(selectedConfigId.value);
    selectedConfig.value = data;

    formData.value = {
      name: data.name || "",
      target_url: data.target_url || "",
      method: data.method || "GET",
      cron_schedule: data.cron_schedule || "",
      user_agent: data.user_agent || DEFAULT_USER_AGENT,
      concurrency: data.concurrency || 5,
      timeout: data.timeout || 30,
      proxy: data.proxy || "",
      css_selector: data.css_selector || "",
      xpath: data.xpath || "",
      json_schema: JSON.stringify(
        data.json_schema || { type: "object" },
        null,
        2,
      ),
    };

    headersData.value = data.headers
      ? Object.entries(data.headers).map(([key, value]) => ({
          key,
          value: Array.isArray(value) ? value.join(", ") : String(value),
        }))
      : createDefaultHeaders();
  } catch (error: any) {
    showError("加载配置详情失败: " + errorText(error));
    selectedConfig.value = null;
  }
};

const createConfig = async () => {
  try {
    const response = await createVehicleConfig(buildPayload());
    showSuccess("配置创建成功!");
    creatingNewConfig.value = false;

    const newId = response?.id;
    selectedConfigId.value = newId !== undefined ? String(newId) : null;
    await fetchConfigs();
  } catch (error: any) {
    showError("创建配置失败: " + errorText(error));
  }
};

const updateConfig = async () => {
  if (!selectedConfigId.value) {
    showError("请先选择一个配置");
    return;
  }

  try {
    await updateVehicleConfig(selectedConfigId.value, buildPayload());
    showSuccess("配置更新成功!");
    await fetchConfigs();
  } catch (error: any) {
    showError("更新配置失败: " + errorText(error));
  }
};

const saveConfig = () => {
  if (!formData.value.name.trim()) {
    showError("请填写任务名称");
    return;
  }
  if (!formData.value.target_url.trim()) {
    showError("请填写目标 URL");
    return;
  }

  if (selectedConfigId.value) {
    createConfig();
  } else {
    createConfig();
  }
};

const executeScrape = async () => {
  if (!selectedConfigId.value) {
    showError("请先选择一个配置");
    return;
  }

  try {
    const response = await executeVehicleScrape(selectedConfigId.value);
    showSuccess(`爬取任务已启动! ID: ${response.data.scrape_id}`);
    await loadSelectedConfig();
  } catch (error: any) {
    showError("执行爬取失败: " + errorText(error));
  }
};

const testConnection = async () => {
  if (!selectedConfigId.value) {
    showError("请先选择一个配置");
    return;
  }

  try {
    const response = await testVehicleConnection(selectedConfigId.value);
    if (response.data.success) {
      showSuccess("连接测试成功!");
    } else {
      showError("连接测试失败: " + response.data.message);
    }
  } catch (error: any) {
    showError("连接测试失败: " + errorText(error));
  }
};

// ---------- UI handlers ----------
const resetForm = () => {
  formData.value = createDefaultForm();
  headersData.value = createDefaultHeaders();
};

const showCreateConfigForm = () => {
  creatingNewConfig.value = true;
  selectedConfigId.value = null;
  selectedConfig.value = null;
  activeTab.value = "basic";
  resetForm();
};

const handleBatchImport = () => {
  showInfo("批次导入功能将在后续版本中支持");
};

const refreshConfigs = async () => {
  await fetchConfigs();
  showSuccess("配置列表已刷新");
};

// 用 watch 代替 @change / @update:model-value,v-model 变化时一定会触发
watch(selectedConfigId, (id) => {
  if (id) {
    creatingNewConfig.value = false;
    loadSelectedConfig();
  }
});

watch(selectedProjectId, (id) => {
  showInfo(
    "切换到项目: " + (projects.value.find((p) => p.id === id)?.name ?? ""),
  );
  selectedConfigId.value = null;
  selectedConfig.value = null;
  resetForm();
  fetchConfigs();
});

// ---------- Display helpers ----------
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

// <script setup> 里 <component :is> 不能用字符串解析局部导入,必须返回组件对象本身
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

onMounted(() => {
  fetchConfigs();
});
</script>

<style scoped>
.scraper-config-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  /* 抵消 Vite 模板 #app { text-align: center } 的影响 */
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
  /* 不能用 overflow: hidden,否则会裁切下拉面板 */
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  text-align: left;
}

.full-width {
  grid-column: 1 / -1;
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

  .form-grid {
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
