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
                :value="String(project.id)"
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
                <TabsTrigger value="steps">步骤流程</TabsTrigger>
                <TabsTrigger value="parsing">数据解析规则</TabsTrigger>
                <TabsTrigger value="multi-parser">多解析器规则</TabsTrigger>
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
                    <Label for="cronSchedule">Cron 定时排程</Label>
                    <Input
                      id="cronSchedule"
                      v-model="formData.cron_schedule"
                      placeholder="0 0 * * * (每天 midnight)"
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

              <!-- Steps Workflow Tab -->
              <TabsContent value="steps" class="py-4">
                <div class="form-grid">
                  <div class="form-group full-width">
                    <Label>步骤流程</Label>
                    <p class="step-description">
                      定义多个步骤，每个步骤可以独立选择爬取模式（API 或
                      浏览器动态模式）
                    </p>

                    <!-- Draggable Step Cards -->
                    <div class="steps-container">
                      <Card
                        v-for="(step, index) in steps"
                        :key="step.id"
                        class="mb-3 step-card"
                        draggable="true"
                        @dragstart="handleDragStart($event, index)"
                        @dragover.prevent="handleDragOver($event, index)"
                        @dragenter="handleDragEnter($event, index)"
                        @dragend="handleDragEnd"
                        @drop="handleDrop($event, index)"
                      >
                        <template #header>
                          <div class="flex items-center gap-2">
                            <span class="font-medium text-gray-800"
                              >步骤 {{ index + 1 }}</span
                            >
                            <span class="step-name" v-if="step.name">{{
                              step.name
                            }}</span>
                            <div class="ml-auto flex gap-2">
                              <Button
                                @click="duplicateStep(index)"
                                variant="outline"
                                size="sm"
                              >
                                <CopyIcon class="h-4 w-4" />
                              </Button>
                              <Button
                                @click="removeStep(index)"
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2Icon class="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </template>

                        <div class="step-card-content">
                          <!-- Step Name -->
                          <div class="form-group full-width mb-3">
                            <Label>步骤名称</Label>
                            <Input
                              v-model="step.name"
                              placeholder="例如: 初始请求, 详情页抓取"
                            />
                          </div>

                          <!-- Crawl Mode Selection -->
                          <div class="form-group full-width mb-3">
                            <Label>爬取模式</Label>
                            <Select v-model="step.mode">
                              <SelectTrigger class="w-full">
                                <SelectValue placeholder="选择爬取模式..." />
                              </SelectTrigger>
                              <SelectContent position="popper">
                                <SelectItem value="api">API 模式</SelectItem>
                                <SelectItem value="playwright"
                                  >Playwright (浏览器动态)</SelectItem
                                >
                              </SelectContent>
                            </Select>
                          </div>

                          <!-- API Mode Fields -->
                          <template v-if="step.mode === 'api'">
                            <div class="form-group full-width mb-3">
                              <Label>请求 URL</Label>
                              <Input
                                v-model="step.url"
                                placeholder="https://example.com/api/endpoint"
                              />
                            </div>

                            <div class="form-group full-width mb-3">
                              <Label>请求方式</Label>
                              <Select v-model="step.method">
                                <SelectTrigger class="w-full">
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

                            <div class="form-group full-width mb-3">
                              <Label>请求参数 (JSON)</Label>
                              <Textarea
                                v-model="step.params_json"
                                placeholder='{"param1": "value1", "param2": "value2"}'
                                rows="4"
                              />
                            </div>

                            <div class="form-group full-width mb-3">
                              <Label>Headers (JSON)</Label>
                              <Textarea
                                v-model="step.headers_json"
                                placeholder='{"Content-Type": "application/json"}'
                                rows="4"
                              />
                            </div>
                          </template>

                          <!-- Playwright Mode Fields -->
                          <template v-else-if="step.mode === 'playwright'">
                            <div class="form-group full-width mb-3">
                              <Label>页面 URL</Label>
                              <Input
                                v-model="step.url"
                                placeholder="https://example.com/page"
                              />
                            </div>

                            <div class="form-group full-width mb-3">
                              <Label>等待选择器</Label>
                              <Input
                                v-model="step.wait_selector"
                                placeholder=".content-loaded, #main-content"
                              />
                            </div>

                            <div class="form-group full-width mb-3">
                              <Label>执行 JavaScript</Label>
                              <Textarea
                                v-model="step.script"
                                placeholder="// 返回数据的函数\ndocument.querySelector('.data').textContent"
                                rows="6"
                              />
                            </div>
                          </template>
                        </div>
                      </Card>
                    </div>

                    <!-- Add New Step Button -->
                    <Button
                      @click="addStep"
                      variant="outline"
                      size="sm"
                      class="mt-3"
                    >
                      <PlusIcon class="mr-2 h-4 w-4" /> 添加新步骤
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <!-- Data Parsing Rules Tab -->
              <TabsContent value="parsing" class="py-4">
                <div class="form-grid">
                  <div class="form-group full-width mb-6">
                    <Label>数据解析规则</Label>
                    <p class="rule-description">
                      支持多种解析器混用。每个步骤可以配置不同的解析规则，或使用全局规则
                    </p>
                  </div>

                  <!-- Global Parsing Rules -->
                  <div class="form-group full-width mb-4">
                    <h4 class="section-title">全局解析规则</h4>
                    <p class="section-description">
                      应用于所有步骤的默认解析规则
                    </p>

                    <!-- JSONPath for API responses -->
                    <div class="rule-section mb-4">
                      <Label>JSONPath 规则 (API)</Label>
                      <Textarea
                        v-model="globalParsingRules.jsonpath"
                        placeholder="$.data.items[*].title, $.results[0].id"
                        rows="3"
                      />
                    </div>

                    <!-- CSS/XPath for HTML -->
                    <div class="rule-section mb-4">
                      <Label>CSS Selector</Label>
                      <Textarea
                        v-model="globalParsingRules.css_selector"
                        placeholder=".product-item, .article"
                        rows="3"
                      />
                    </div>

                    <div class="rule-section mb-4">
                      <Label>XPath</Label>
                      <Textarea
                        v-model="globalParsingRules.xpath"
                        placeholder="//div[@class='content']"
                        rows="3"
                      />
                    </div>

                    <!-- Regex for text extraction -->
                    <div class="rule-section mb-4">
                      <Label>正则表达式 (Regex)</Label>
                      <Textarea
                        v-model="globalParsingRules.regex"
                        placeholder='价格: "\$(\\d+\\.\\d{2})"\n日期: "(\\d{4}-\\d{2}-\\d{2})"'
                        rows="4"
                      />
                    </div>

                    <!-- JSON Schema for structured data -->
                    <div class="rule-section mb-4">
                      <Label>JSON Schema 规则</Label>
                      <Textarea
                        v-model="globalParsingRules.json_schema"
                        placeholder="{...}"
                        rows="6"
                      />
                    </div>
                  </div>

                  <!-- Step-specific Parsing Rules -->
                  <div class="form-group full-width">
                    <h4 class="section-title">步骤级解析规则</h4>
                    <p class="section-description">
                      为每个步骤单独配置解析规则（覆盖全局规则）
                    </p>

                    <div
                      v-for="(step, index) in steps"
                      :key="`parsing-${step.id}`"
                      class="step-parsing-rule mb-4 p-3 bg-gray-50 rounded"
                    >
                      <h5 class="step-parsing-title">
                        步骤 {{ index + 1 }}: {{ step.name || "未命名" }}
                      </h5>

                      <!-- JSONPath for API responses -->
                      <div class="rule-section mb-2">
                        <Label>JSONPath 规则 (API)</Label>
                        <Textarea
                          v-model="step.parsing_rules.jsonpath"
                          placeholder="$.data.items[*].title, $.results[0].id"
                          rows="2"
                        />
                      </div>

                      <!-- CSS/XPath for HTML -->
                      <div class="rule-section mb-2">
                        <Label>CSS Selector</Label>
                        <Textarea
                          v-model="step.parsing_rules.css_selector"
                          placeholder=".product-item, .article"
                          rows="2"
                        />
                      </div>

                      <div class="rule-section mb-2">
                        <Label>XPath</Label>
                        <Textarea
                          v-model="step.parsing_rules.xpath"
                          placeholder="//div[@class='content']"
                          rows="2"
                        />
                      </div>

                      <!-- Regex for text extraction -->
                      <div class="rule-section mb-2">
                        <Label>正则表达式 (Regex)</Label>
                        <Textarea
                          v-model="step.parsing_rules.regex"
                          placeholder='价格: "\$(\\d+\\.\\d{2})"'
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <!-- Multi-Parser Rules Tab -->
              <TabsContent value="multi-parser">
                <div class="p-6">
                  <h3 class="text-lg font-semibold mb-4">多解析器规则</h3>
                  <p class="text-sm text-gray-600 mb-6">
                    为每个步骤配置多个独立的解析器规则，支持JSONPath、CSS选择器、XPath和正则表达式
                  </p>

                  <!-- Step-specific Multi-Parser Rules -->
                  <div class="form-group full-width">
                    <h4 class="section-title mb-2">步骤级多解析器规则</h4>
                    <p class="section-description text-sm text-gray-600 mb-4">
                      为每个步骤单独配置多个解析规则（覆盖全局规则）
                    </p>

                    <div
                      v-for="(step, stepIndex) in steps"
                      :key="`multi-parser-${step.id}`"
                      class="step-multi-parser-container mb-6 p-4 bg-gray-50 rounded border"
                    >
                      <h5
                        class="step-parsing-title text-blue-700 font-medium mb-3"
                      >
                        步骤 {{ stepIndex + 1 }}: {{ step.name || "未命名" }}
                      </h5>

                      <!-- Multi-parser rules list -->
                      <div
                        v-if="step.multi_parser_rules.length > 0"
                        class="rules-list mb-4"
                      >
                        <div
                          v-for="(rule, ruleIndex) in step.multi_parser_rules"
                          :key="`${step.id}-${rule.id}`"
                          class="rule-item p-3 bg-white rounded shadow-sm mb-2 border"
                        >
                          <div class="flex justify-between items-start mb-2">
                            <h6 class="font-medium text-blue-800">
                              规则 {{ ruleIndex + 1 }}: {{ rule.name }}
                            </h6>
                            <Button
                              variant="destructive"
                              size="sm"
                              @click="
                                step.multi_parser_rules.splice(ruleIndex, 1)
                              "
                            >
                              删除
                            </Button>
                          </div>

                          <div
                            class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2"
                          >
                            <!-- Parser Type -->
                            <div>
                              <Label>解析器类型</Label>
                              <Select
                                v-model="rule.type"
                                :disabled="step.multi_parser_rules.length === 1"
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="jsonpath"
                                    >JSONPath</SelectItem
                                  >
                                  <SelectItem value="css">CSS选择器</SelectItem>
                                  <SelectItem value="xpath">XPath</SelectItem>
                                  <SelectItem value="regex"
                                    >正则表达式</SelectItem
                                  >
                                </SelectContent>
                              </Select>
                            </div>

                            <!-- Output Field -->
                            <div>
                              <Label>输出字段</Label>
                              <Input
                                v-model="rule.output_field"
                                placeholder="data.items"
                              />
                            </div>
                          </div>

                          <!-- Expression based on type -->
                          <div class="mb-2">
                            <Label>表达式</Label>
                            <Textarea
                              v-model="rule.expression"
                              :placeholder="getParserPlaceholder(rule.type)"
                              rows="3"
                            />
                          </div>

                          <!-- Description -->
                          <div class="mb-2">
                            <Label>描述 (可选)</Label>
                            <Input
                              v-model="rule.description"
                              placeholder="此规则用于提取..."
                            />
                          </div>
                        </div>
                      </div>

                      <!-- Add new rule button -->
                      <Button
                        size="sm"
                        class="mb-4"
                        @click="addMultiParserRule(stepIndex)"
                      >
                        <PlusIcon class="w-4 h-4 mr-2" />
                        添加新解析规则
                      </Button>
                    </div>
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
import { Card } from "@/components/ui/card";

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
  CopyIcon,
  Trash2Icon,
} from "@lucide/vue";

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

// Step interface for the new workflow system
interface ParsingRule {
  jsonpath?: string;
  css_selector?: string;
  xpath?: string;
  regex?: string;
  json_schema?: string;
}

interface MultiParserRule {
  id: string;
  name: string;
  type: "jsonpath" | "css" | "xpath" | "regex";
  expression: string;
  output_field: string;
  description?: string;
}

interface Step {
  id: string;
  name: string;
  mode: "api" | "playwright";
  url: string;
  method: string;
  params_json: string;
  headers_json: string;
  wait_selector?: string;
  script?: string;
  parsing_rules: ParsingRule;
  multi_parser_rules: MultiParserRule[];
}

const steps = ref<Step[]>([
  {
    id: "step1",
    name: "初始请求",
    mode: "api",
    url: "",
    method: "GET",
    params_json: "{}",
    headers_json: "{}",
    parsing_rules: {},
    multi_parser_rules: [],
  },
]);

const globalParsingRules = ref<ParsingRule>({
  jsonpath: "",
  css_selector: "",
  xpath: "",
  regex: "",
  json_schema: JSON.stringify({ type: "object" }, null, 2),
});

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

const createDefaultForm = () => ({
  name: "",
  cron_schedule: "",
  user_agent: DEFAULT_USER_AGENT,
  concurrency: 5,
  timeout: 30,
  proxy: "",
});

const formData = ref(createDefaultForm());

// ---------- Step Management ----------
const addStep = () => {
  const newStep: Step = {
    id: `step${steps.value.length + 1}`,
    name: `步骤 ${steps.value.length + 1}`,
    mode: "api",
    url: "",
    method: "GET",
    params_json: "{}",
    headers_json: "{}",
    parsing_rules: {},
    multi_parser_rules: [],
  };
  steps.value.push(newStep);
};

const removeStep = (index: number) => {
  if (steps.value.length > 1) {
    steps.value.splice(index, 1);
  }
};

const duplicateStep = (index: number) => {
  const stepToDuplicate = steps.value[index];
  const newStep: Step = {
    id: `step${steps.value.length + 1}`,
    name: `${stepToDuplicate.name} (副本)`,
    mode: stepToDuplicate.mode,
    url: stepToDuplicate.url,
    method: stepToDuplicate.method,
    params_json: stepToDuplicate.params_json,
    headers_json: stepToDuplicate.headers_json,
    wait_selector: stepToDuplicate.wait_selector,
    script: stepToDuplicate.script,
    parsing_rules: { ...stepToDuplicate.parsing_rules },
    multi_parser_rules: [...stepToDuplicate.multi_parser_rules],
  };
  steps.value.splice(index + 1, 0, newStep);
};

// ---------- Multi-Parser Rule Management ----------
const addMultiParserRule = (stepIndex: number) => {
  const newRuleId = `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newRule: MultiParserRule = {
    id: newRuleId,
    name: "新规则",
    type: "jsonpath",
    expression: "",
    output_field: "",
  };

  steps.value[stepIndex].multi_parser_rules.push(newRule);
};

// Drag and drop for reordering steps
const draggedIndex = ref<number | null>(null);

const handleDragStart = (event: DragEvent, index: number) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", index.toString());
  }
  draggedIndex.value = index;
};

const handleDragOver = (event: DragEvent, index: number) => {
  if (draggedIndex.value === null || draggedIndex.value === index) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
};

const handleDragEnter = (event: DragEvent, index: number) => {
  if (draggedIndex.value === null || draggedIndex.value === index) return;
  event.preventDefault();
};

const handleDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault();
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null;
    return;
  }

  const items = [...steps.value];
  const draggedItem = items[draggedIndex.value];
  items.splice(draggedIndex.value, 1);
  items.splice(targetIndex, 0, draggedItem);
  steps.value = items;
  draggedIndex.value = null;
};

const handleDragEnd = () => {
  draggedIndex.value = null;
};

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
  const raw = globalParsingRules.value.json_schema?.trim();
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
    steps: steps.value.map((step) => ({
      name: step.name,
      mode: step.mode,
      url: step.url,
      method: step.method,
      params_json: step.params_json,
      headers_json: step.headers_json,
      wait_selector: step.wait_selector,
      script: step.script,
      parsing_rules: step.parsing_rules,
      multi_parser_rules: step.multi_parser_rules,
    })),
  };
};

// ---------- API ----------
const fetchConfigs = async () => {
  isLoading.value = true;
  try {
    const responseData = await getVehicleConfigs();

    let parsedConfigs = [];
    if (Array.isArray(responseData)) {
      parsedConfigs = responseData;
    } else if (responseData && typeof responseData === "object") {
      parsedConfigs = (responseData as any).data || responseData;
    }

    configs.value = Array.isArray(parsedConfigs) ? parsedConfigs : [];

    if (selectedConfigId.value) {
      await loadSelectedConfig();
    } else if (configs.value.length > 0 && !creatingNewConfig.value) {
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
    const data: any = await getVehicleConfigById(selectedConfigId.value);
    selectedConfig.value = data;

    formData.value = {
      name: data.name || "",
      cron_schedule: data.cron_schedule || "",
      user_agent: data.user_agent || DEFAULT_USER_AGENT,
      concurrency: data.concurrency || 5,
      timeout: data.timeout || 30,
      proxy: data.proxy || "",
    };

    globalParsingRules.value = {
      jsonpath: data.jsonpath || "",
      css_selector: data.css_selector || "",
      xpath: data.xpath || "",
      regex: data.regex || "",
      json_schema: JSON.stringify(
        data.json_schema || { type: "object" },
        null,
        2,
      ),
    };

    if (data.steps && Array.isArray(data.steps)) {
      steps.value = data.steps.map((step: any) => ({
        id: step.id || `step${step.index || 1}`,
        name: step.name || "未命名步骤",
        mode: step.mode || "api",
        url: step.url || "",
        method: step.method || "GET",
        params_json:
          typeof step.params_json === "string"
            ? step.params_json
            : JSON.stringify(step.params || {}),
        headers_json:
          typeof step.headers_json === "string"
            ? step.headers_json
            : JSON.stringify(step.headers || {}),
        wait_selector: step.wait_selector || "",
        script: step.script || "",
        parsing_rules: {
          jsonpath: step.parsing_rules?.jsonpath || "",
          css_selector: step.parsing_rules?.css_selector || "",
          xpath: step.parsing_rules?.xpath || "",
          regex: step.parsing_rules?.regex || "",
        },
        multi_parser_rules: step.multi_parser_rules || [],
      }));
    } else {
      steps.value = [];

      if (data.target_url) {
        steps.value.push({
          id: "step1",
          name: "初始请求",
          mode: data.mode || "api",
          url: data.target_url || "",
          method: data.method || "GET",
          params_json: "{}",
          headers_json: "{}",
          parsing_rules: {},
          multi_parser_rules: [],
        });
      }

      if (steps.value.length === 0) {
        steps.value = [
          {
            id: "step1",
            name: "初始请求",
            mode: "api",
            url: data.target_url || "",
            method: data.method || "GET",
            params_json: "{}",
            headers_json: "{}",
            parsing_rules: {},
            multi_parser_rules: [],
          },
        ];
      }
    }
  } catch (error: any) {
    showError("加载配置详情失败: " + errorText(error));
    selectedConfig.value = null;
  }
};

const createConfig = async () => {
  try {
    const response: any = await createVehicleConfig(buildPayload());
    showSuccess("配置创建成功!");
    creatingNewConfig.value = false;

    const newId = response?.id || response?.data?.id;
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

  if (selectedConfigId.value) {
    updateConfig();
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
    const response: any = await executeVehicleScrape(selectedConfigId.value);
    const scrapeId = response?.scrape_id || response?.data?.scrape_id;
    showSuccess(`爬取任务已启动! ID: ${scrapeId || "未知"}`);
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
    const response: any = await testVehicleConnection(selectedConfigId.value);
    const success = response?.success ?? response?.data?.success;
    const msg = response?.message ?? response?.data?.message;

    if (success) {
      showSuccess("连接测试成功!");
    } else {
      showError("连接测试失败: " + (msg || "未知原因"));
    }
  } catch (error: any) {
    showError("连接测试失败: " + errorText(error));
  }
};

// ---------- UI handlers ----------
const resetForm = () => {
  formData.value = createDefaultForm();
  steps.value = [
    {
      id: "step1",
      name: "初始请求",
      mode: "api",
      url: "",
      method: "GET",
      params_json: "{}",
      headers_json: "{}",
      parsing_rules: {},
      multi_parser_rules: [],
    },
  ];
  globalParsingRules.value = {
    jsonpath: "",
    css_selector: "",
    xpath: "",
    regex: "",
    json_schema: JSON.stringify({ type: "object" }, null, 2),
  };
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

/* Step Cards Styles */
.step-card {
  transition: all 0.2s ease;
  cursor: move;
}

.step-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.step-card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-name {
  color: #6b7280;
  font-size: 14px;
}

.steps-container {
  margin-top: 16px;
}

/* Parsing Rules Styles */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: "";
  width: 4px;
  height: 16px;
  background-color: #3b82f6;
  border-radius: 2px;
}

.step-description,
.rule-description,
.section-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.step-parsing-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.rule-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
