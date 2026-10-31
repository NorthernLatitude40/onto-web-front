<!-- components/scraper/ParsingRulesTab.vue
     结构：页面 → ParsingRulesTab（字段映射表已内联，不再有 FieldMappingUI 这一层）-->
<template>
  <div class="form-grid py-4">
    <div class="form-group full-width mb-6">
      <Label>数据解析规则</Label>
      <p class="rule-description">
        支持多种解析器混用。每个步骤可以配置不同的解析规则，或使用全局规则
      </p>
    </div>

    <!-- Global Parsing Rules -->
    <div class="form-group full-width mb-4">
      <h4 class="section-title">全局解析规则</h4>
      <p class="section-description">应用于所有步骤的默认解析规则</p>

      <div class="rule-section mb-4">
        <Label>JSONPath 规则 (API)</Label>
        <Textarea
          :model-value="jsonpath"
          @update:model-value="$emit('update:jsonpath', $event)"
          placeholder="$.data.items[*].title, $.results[0].id"
          rows="3"
        />
      </div>

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

      <div class="rule-section mb-4">
        <Label>正则表达式 (Regex)</Label>
        <Textarea
          v-model="globalParsingRules.regex"
          placeholder='价格: "\$(\\d+\\.\\d{2})"\n日期: "(\\d{4}-\\d{2}-\\d{2})"'
          rows="4"
        />
      </div>

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
        v-for="{ step, index, state } in stepViews"
        :key="`parsing-${stepKey(step, index)}`"
        class="step-parsing-rule mb-4 p-3 bg-gray-50 rounded"
      >
        <h5 class="step-parsing-title">
          步骤 {{ index + 1 }}: {{ step.name || "未命名" }}
        </h5>

        <div class="rule-section mb-2">
          <Label>字段映射配置 (API)</Label>

          <!-- 目标数据库模型 -->
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <Label>目标数据库模型</Label>

            <div v-if="isLoadingModels" class="p-2 text-sm text-blue-600">
              加载中...
            </div>
            <div v-else-if="modelLoadError" class="p-2 text-sm text-red-600">
              {{ modelLoadError }}
            </div>
            <select
              v-else
              class="w-full p-2 border rounded-md bg-white"
              @change="handleDatabaseModelChange(index, state, $event)"
            >
              <option value="" disabled selected>选择数据库模型</option>
              <option
                v-for="model in availableDatabaseModels"
                :key="model.id"
                :value="model.id"
                :selected="model.id === state.modelId"
              >
                {{ model.name }} ({{ model.description }})
              </option>
            </select>
          </div>

          <!-- 源数据配置 -->
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <Label>源数据配置</Label>
            <div class="flex gap-2 mb-3">
              <div
                v-if="state.sourceFields.length > 0"
                class="px-3 py-1 bg-gray-100 text-sm rounded border flex items-center gap-1"
              >
                <span>{{
                  state.isUsingManualJson ? "手动 JSON" : "来自步骤1 API"
                }}</span>
                <span class="text-xs"
                  >{{ state.sourceFields.length }} 个字段</span
                >
              </div>

              <button
                type="button"
                :disabled="state.loading"
                @click="fetchDataFromStep1(state)"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {{ state.loading ? "获取中..." : "从步骤1获取数据" }}
              </button>
              <button
                type="button"
                @click="state.isUsingManualJson = true"
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                手动输入 JSON
              </button>
            </div>

            <div v-if="state.isUsingManualJson" class="mt-3">
              <Label>API 返回的 JSON 样本</Label>
              <Textarea
                v-model="state.manualJson"
                placeholder='{"product": {"name": "iPhone 15", "price": 999.00, ...}}'
                rows="6"
                class="w-full mt-2"
              />
              <div class="flex gap-2 mt-2">
                <button
                  type="button"
                  @click="handleManualJsonInput(state)"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  解析 JSON
                </button>
                <button
                  type="button"
                  @click="state.isUsingManualJson = false"
                  class="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>

            <div v-if="state.sourceFields.length > 0" class="mt-3">
              <Label>当前源字段 ({{ state.sourceFields.length }} 个)</Label>
              <div class="grid grid-cols-2 gap-1 mt-2 text-sm">
                <span
                  v-for="field in state.sourceFields.slice(0, 6)"
                  :key="field.key"
                  class="bg-blue-50 p-1 rounded"
                >
                  {{ field.name }} ({{ field.type }})
                </span>
              </div>
            </div>
          </div>

          <!-- 字段映射表（内联） -->
          <div class="mb-2 flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold">字段映射配置</h3>
              <p class="text-sm text-gray-600">
                建立源字段与目标字段之间的映射关系
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="btn-outline"
                @click="autoMapFields(index, step, state)"
              >
                自动配对
              </button>
              <button
                type="button"
                class="btn-outline"
                @click="resetMappings(index, state)"
              >
                重置映射
              </button>
            </div>
          </div>

          <div
            class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <table class="w-full border-collapse text-sm">
              <thead class="bg-gray-50">
                <tr class="border-b border-gray-200">
                  <th class="px-4 py-3 text-left font-medium text-gray-700">
                    目标字段
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-gray-700">
                    映射类型 / 源字段选择
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-gray-700">
                    对应状态
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  v-for="target in getTargetFields(state.modelId)"
                  :key="`${state.modelId}-${target.name}`"
                >
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ target.label }}</span>
                      <span class="text-xs text-gray-500">{{
                        target.name
                      }}</span>
                      <span class="text-xs text-gray-400"
                        >({{ target.type }})</span
                      >
                      <span
                        v-if="target.required"
                        class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700"
                        >必填</span
                      >
                    </div>
                  </td>

                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex gap-2 items-center">
                      <!-- 原生 select：没有 Portal / aria-hidden / 焦点问题 -->
                      <select
                        class="h-9 w-[240px] rounded-md border border-gray-300 bg-white px-2 text-sm"
                        @change="
                          handleSourceSelect(
                            index,
                            step,
                            state,
                            target.name,
                            $event,
                          )
                        "
                      >
                        <option
                          value=""
                          :selected="!selectedSource(step, target.name, state)"
                        >
                          选择源字段
                        </option>
                        <!-- 已保存的映射但源字段还没加载时，仍显示原来的 key -->
                        <option
                          v-if="
                            selectedSource(step, target.name, state) &&
                            !hasSourceField(
                              state,
                              selectedSource(step, target.name, state),
                            )
                          "
                          :value="selectedSource(step, target.name, state)"
                          selected
                        >
                          {{
                            selectedSource(step, target.name, state)
                          }}（源字段未加载）
                        </option>
                        <option
                          v-for="field in state.sourceFields"
                          :key="field.key"
                          :value="field.key"
                          :selected="
                            field.key === selectedSource(step, target.name)
                          "
                        >
                          {{ field.name }} ({{ field.type }}) - {{ field.key }}
                        </option>
                      </select>

                      <button
                        type="button"
                        class="btn-outline"
                        :class="{
                          'is-active': isCustomField(step, state, target.name),
                        }"
                        @click="
                          toggleCustomValue(index, step, state, target.name)
                        "
                      >
                        固定值
                      </button>

                      <input
                        v-if="isCustomField(step, state, target.name)"
                        type="text"
                        class="h-9 w-32 rounded-md border border-gray-300 px-2 text-sm"
                        placeholder="输入固定值"
                        :value="customValueOf(step, state, target.name)"
                        @input="onCustomInput(state, target.name, $event)"
                        @blur="
                          commitCustomValue(index, step, state, target.name)
                        "
                      />
                    </div>
                  </td>

                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      v-if="findMapping(step, target.name)"
                      class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800"
                      >已映射</span
                    >
                    <span
                      v-else-if="target.required"
                      class="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700"
                      >⚠️ 未映射</span
                    >
                    <span
                      v-else
                      class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >可选</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 class="text-sm font-medium mb-2">映射总览</h4>
            <p class="text-sm text-gray-600">
              已建立 {{ getMappings(step).length }} 个映射关系，
              <span
                v-if="unmappedRequiredCount(step, state) > 0"
                class="text-red-500"
              >
                {{ unmappedRequiredCount(step, state) }} 个必填字段未映射
              </span>
            </p>
          </div>
        </div>

        <!-- 步骤级 CSS Selector -->
        <div class="rule-section mb-2 mt-4">
          <Label>CSS Selector</Label>
          <Textarea
            :model-value="rulesOf(step).css_selector ?? ''"
            @update:model-value="
              (val) =>
                updateStepParsingRules(index, {
                  css_selector: String(val ?? ''),
                })
            "
            placeholder=".product-item, .article"
            rows="2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref, onMounted } from "vue";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import service from "@/service/request";

const props = defineProps<{
  steps: any[];
  globalParsingRules: any;
  jsonpath: string;
  parsing_rules: any;
}>();

const emit = defineEmits([
  "update:jsonpath",
  "update:parsing_rules",
  "update:globalParsingRules",
  "update:steps",
]);

interface TargetField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface DatabaseModel {
  id: string;
  name: string;
  description: string;
  fields: TargetField[];
}

interface SourceField {
  name: string;
  key: string;
  type: string;
  sample?: string;
}

interface Mapping {
  source_key: string;
  target_field: string;
}

// 每个步骤独立的界面状态。
// 映射本身不在这里存：唯一数据源就是 step.parsing_rules.mappings。
interface StepState {
  modelId: string;
  sourceFields: SourceField[];
  manualJson: string;
  isUsingManualJson: boolean;
  loading: boolean;
  customMode: Record<string, boolean>; // 目标字段 -> 是否处于“固定值”模式
  customDraft: Record<string, string>; // 目标字段 -> 固定值输入框草稿
  keyMapping?: Record<string, string>; // oldKey -> newKey mapping for backward compatibility
}

const CUSTOM_PREFIX = "custom:";

// Dynamic database models loading
const availableDatabaseModels = ref<DatabaseModel[]>([]);
const isLoadingModels = ref(false);
const modelLoadError = ref<string | null>(null);

// Fetch database models from backend API
const fetchDatabaseModels = async () => {
  isLoadingModels.value = true;
  modelLoadError.value = null;

  try {
    // Get available table names first, then fetch columns for each
    const tablesResponse = await service.get("/database/tables");
    if (!tablesResponse) {
      throw new Error("No tables data received from backend");
    }

    const tables = tablesResponse;
    const models: DatabaseModel[] = [];
    
    for (const tableItem of tables) {
      // 提取真實的表名字串（兼容物件或字串兩種可能）
      const tableName = typeof tableItem === "object" && tableItem !== null 
        ? (tableItem.table_name || tableItem.name || String(tableItem)) 
        : String(tableItem);

      try {
        const columnsResponse = await service.get(
          `/database/tables/${tableName}/columns`,
        );
        if (columnsResponse) {
          const fields: TargetField[] = columnsResponse.map((col: any) => ({
            name: col.name,
            label: col.label || col.name,
            type: col.type,
            required: col.required || false,
          }));

          models.push({
            id: tableName,
            name: tableName
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            description: `数据库表：${tableName}`,
            fields: fields,
          });
        }
      } catch (columnError) {
        console.error(
          `Failed to fetch columns for table ${tableName}:`,
          columnError,
        );
        // Continue with other tables even if one fails
      }
    }

    availableDatabaseModels.value = models;
  } catch (error) {
    console.error("Failed to fetch database models:", error);
    modelLoadError.value = "无法加载数据库模型，请稍后重试";
    // Fallback to empty array instead of crashing
    availableDatabaseModels.value = [];
  } finally {
    isLoadingModels.value = false;
  }
};

// Load models when component mounts
onMounted(() => {
  fetchDatabaseModels();
});

const getTargetFields = (modelId: string) => {
  const model = availableDatabaseModels.value.find((m) => m.id === modelId);
  return model?.fields || [];
};

// ---------- 步骤状态 ----------
const stepStates = reactive<Record<string, StepState>>({});

const stepKey = (step: any, index: number) =>
  String(step?.id ?? `idx-${index}`);

// parsing_rules 类型允许是数组，这里统一当对象处理
const rulesOf = (step: any): Record<string, any> => {
  if (!step?.parsing_rules || typeof step.parsing_rules !== "object") {
    return {};
  }
  // 如果是数组且有元素，返回第一个元素；如果是单对象，直接返回
  if (Array.isArray(step.parsing_rules)) {
    return step.parsing_rules.length > 0 ? step.parsing_rules[0] : {};
  }
  return step.parsing_rules;
};

// Function definitions will be moved here to avoid circular dependency

function ensureStepStates() {
  props.steps.forEach((step, index) => {
    const key = stepKey(step, index);
    if (!stepStates[key]) {
      stepStates[key] = {
        modelId: resolveInitialModelId(step),
        sourceFields: [],
        manualJson: "",
        isUsingManualJson: false,
        loading: false,
        customMode: {},
        customDraft: {},
        keyMapping: {},
      };
    }
  });
}

watch(() => props.steps, ensureStepStates, { immediate: true });

const stepViews = computed(() =>
  props.steps
    .map((step, index) => ({
      step,
      index,
      state: stepStates[stepKey(step, index)],
    }))
    .filter((view) => !!view.state),
);

// ---------- 写回 steps（一次事件只调用一次，把改动合并成一个 patch） ----------
const updateStepParsingRules = (index: number, patch: Record<string, any>) => {
  const newSteps = [...props.steps];
  newSteps[index] = {
    ...newSteps[index],
    parsing_rules: {
      ...rulesOf(newSteps[index]),
      ...patch, // 新值放后面，才能覆盖旧值
    },
  };
  emit("update:steps", newSteps);
};

// ---------- 映射读取 ----------
// Function definitions in correct order to avoid circular dependency

function getMappings(step: any): Mapping[] {
  const m = rulesOf(step).mappings;
  return Array.isArray(m) ? m : [];
}

function findMapping(step: any, target: string) {
  return getMappings(step).find((m) => m.target_field === target);
}

function resolveInitialModelId(step: any): string {
  // First check if target_model is stored at step level
  let savedTargetModel = step.target_model;

  // If not found at step level, try to get it from parsing rules if it exists
  if (!savedTargetModel) {
    const rules = rulesOf(step);

    // Handle both single object and array cases for parsing_rules
    if (Array.isArray(rules)) {
      // Look through all rules to find a target_model field
      for (const rule of rules) {
        if ("target_model" in rule && rule.target_model) {
          savedTargetModel = rule.target_model;
          break;
        }
      }
    } else if (rules && "target_model" in rules) {
      // Single object case
      savedTargetModel = rules.target_model;
    }
  }

  // If we found a valid target_model, use it
  if (
    savedTargetModel &&
    availableDatabaseModels.value.some((m) => m.id === savedTargetModel)
  ) {
    return savedTargetModel;
  }

  // Try to infer from existing mappings - look for target_field values that match known model fields
  const mappings = getMappings(step);
  if (mappings.length > 0) {
    // Collect all target_field names from mappings
    const mappedFields = new Set(mappings.map((m) => m.target_field));

    // Check which database models have the most matching fields
    let bestModel: DatabaseModel | null = null;
    let highestMatchCount = 0;

    for (const model of availableDatabaseModels.value) {
      const modelFields = new Set(model.fields.map((f) => f.name));
      let matchCount = 0;

      mappedFields.forEach((field) => {
        if (modelFields.has(field)) matchCount++;
      });

      if (matchCount > highestMatchCount) {
        highestMatchCount = matchCount;
        bestModel = model;
      }
    }

    // If we found a good match, use it
    if (bestModel && highestMatchCount >= 2) {
      // At least 2 matching fields
      return bestModel.id;
    }
  }

  // Fallback to default model
  if (availableDatabaseModels.value.length > 0) {
    return availableDatabaseModels.value[0].id;
  }
  return ""; // Return empty string if no models available
}

const isCustomSource = (key?: string) => !!key && key.startsWith(CUSTOM_PREFIX);

// 格式：custom:<目标字段>:<值>，值里可能含冒号
const parseCustomValue = (key: string) => key.split(":").slice(2).join(":");

const isCustomField = (step: any, state: StepState, target: string) => {
  const flag = state.customMode[target];
  return flag !== undefined
    ? flag
    : isCustomSource(findMapping(step, target)?.source_key);
};

const selectedSource = (step: any, target: string, state?: StepState) => {
  const mappingKey = findMapping(step, target)?.source_key;
  if (!mappingKey || isCustomSource(mappingKey)) return "";

  // If we have a key mapping (from parseJsonResponse), use it to translate old keys to new keys
  if (state && state.keyMapping && state.keyMapping[mappingKey]) {
    return state.keyMapping[mappingKey];
  }

  return mappingKey;
};

const customValueOf = (step: any, state: StepState, target: string) => {
  if (target in state.customDraft) return state.customDraft[target];
  const key = findMapping(step, target)?.source_key;
  return isCustomSource(key) ? parseCustomValue(key as string) : "";
};

const hasSourceField = (state: StepState, key: string) =>
  state.sourceFields.some((f) => f.key === key);

const unmappedRequiredCount = (step: any, state: StepState) =>
  getTargetFields(state.modelId).filter(
    (t) => t.required && !findMapping(step, t.name),
  ).length;

// 返回替换/删除某个目标字段映射后的新数组
const withMapping = (
  step: any,
  target: string,
  sourceKey: string,
): Mapping[] => {
  const rest = getMappings(step).filter((m) => m.target_field !== target);
  return sourceKey
    ? [...rest, { source_key: sourceKey, target_field: target }]
    : rest;
};

// ---------- 映射操作 ----------
const handleSourceSelect = (
  index: number,
  step: any,
  state: StepState,
  target: string,
  event: Event,
) => {
  const value = (event.target as HTMLSelectElement).value;
  state.customMode[target] = false;
  delete state.customDraft[target];
  updateStepParsingRules(index, { mappings: withMapping(step, target, value) });
};

const toggleCustomValue = (
  index: number,
  step: any,
  state: StepState,
  target: string,
) => {
  if (isCustomField(step, state, target)) {
    // 退出固定值模式
    state.customMode[target] = false;
    delete state.customDraft[target];
  } else {
    // 进入固定值模式：清掉原映射，输入完成后再写入
    state.customMode[target] = true;
    state.customDraft[target] = "";
  }
  updateStepParsingRules(index, { mappings: withMapping(step, target, "") });
};

const onCustomInput = (state: StepState, target: string, event: Event) => {
  state.customDraft[target] = (event.target as HTMLInputElement).value;
};

const commitCustomValue = (
  index: number,
  step: any,
  state: StepState,
  target: string,
) => {
  if (!isCustomField(step, state, target)) return;
  const draft = state.customDraft[target];
  if (draft === undefined) return; // 没输入过，不改动
  const sourceKey = draft ? `${CUSTOM_PREFIX}${target}:${draft}` : "";
  updateStepParsingRules(index, {
    mappings: withMapping(step, target, sourceKey),
  });
};

const resetMappings = (index: number, state: StepState) => {
  state.customMode = {};
  state.customDraft = {};
  updateStepParsingRules(index, { mappings: [] });
};

const handleDatabaseModelChange = (
  index: number,
  state: StepState,
  event: Event,
) => {
  const modelId = (event.target as HTMLSelectElement).value;
  if (state.modelId === modelId) return;
  state.modelId = modelId;
  state.customMode = {};
  state.customDraft = {};
  // 旧映射的 target_field 在新模型里可能不存在，直接清空
  updateStepParsingRules(index, { mappings: [] });

  // Store target_model separately at step level (not in parsing_rules)
  const newSteps = [...props.steps];
  newSteps[index] = {
    ...newSteps[index],
    target_model: modelId,
  };
  emit("update:steps", newSteps);
};

// ---------- 自动配对 ----------
const tokenize = (str: string): string[] =>
  str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const levenshteinDistance = (s1: string, s2: string): number => {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + cost,
        dp[i][j - 1] + 1,
        dp[i - 1][j] + 1,
      );
    }
  }
  return dp[m][n];
};

const calculateSimilarityScore = (targetName: string, sourceKey: string) => {
  if (targetName === sourceKey) return 1.0;
  if (targetName.toLowerCase() === sourceKey.toLowerCase()) return 1.0;

  const targetWords = tokenize(targetName);
  const sourceWords = tokenize(sourceKey);
  const targetNormalized = targetWords.join("");
  const sourceNormalized = sourceWords.join("");

  if (!targetNormalized || !sourceNormalized) return 0;
  if (targetNormalized === sourceNormalized) return 0.95;
  if (
    targetNormalized.includes(sourceNormalized) ||
    sourceNormalized.includes(targetNormalized)
  ) {
    return 0.8;
  }

  let commonWords = 0;
  targetWords.forEach((word) => {
    if (word.length > 2 && sourceWords.includes(word)) commonWords++;
  });

  const maxLength = Math.max(targetNormalized.length, sourceNormalized.length);
  const levenshteinScore =
    1 - levenshteinDistance(targetNormalized, sourceNormalized) / maxLength;
  const wordMatchScore =
    commonWords / Math.max(targetWords.length, sourceWords.length);

  return wordMatchScore * 0.4 + levenshteinScore * 0.6;
};

const autoMapFields = (index: number, step: any, state: StepState) => {
  const next = [...getMappings(step)];
  const mapped = new Set(next.map((m) => m.target_field));

  for (const target of getTargetFields(state.modelId)) {
    if (mapped.has(target.name)) continue;

    let best: SourceField | undefined;
    let highest = 0;
    for (const field of state.sourceFields) {
      const score = calculateSimilarityScore(target.name, field.key);
      if (score > highest) {
        highest = score;
        best = field;
      }
    }

    if (best && highest > 0.5) {
      next.push({ source_key: best.key, target_field: target.name });
      state.customMode[target.name] = false;
      delete state.customDraft[target.name];
    }
  }

  updateStepParsingRules(index, { mappings: next });
};

// ---------- 获取 / 解析源数据 ----------
const parseJsonConfig = (value: any, label: string): Record<string, any> => {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn(`Invalid ${label} JSON in step configuration:`, e);
    return {};
  }
};

const fetchDataFromStep1 = async (state: StepState) => {
  if (!props.steps || props.steps.length === 0) {
    alert("没有可用的步骤数据，请使用手动 JSON 输入");
    return;
  }

  const firstStep = props.steps[0];

  if (!firstStep.target_url || String(firstStep.target_url).trim() === "") {
    if (confirm("步骤1没有配置目标 URL。是否使用手动 JSON 输入？")) {
      state.isUsingManualJson = true;
      return;
    }
    alert("请先在步骤1中配置 API 请求参数（URL、方法等）");
    return;
  }

  if (firstStep.mode !== "api") {
    if (
      confirm(
        `步骤1使用 ${firstStep.mode} 模式，不支持自动数据获取。是否使用手动 JSON 输入？`,
      )
    ) {
      state.isUsingManualJson = true;
      return;
    }
    alert("仅支持 API 模式步骤的数据获取");
    return;
  }

  const proxyData = {
    url: firstStep.target_url,
    method: firstStep.method || "GET",
    headers: parseJsonConfig(firstStep.headers_json, "headers"),
    params: parseJsonConfig(firstStep.params_json, "params"),
  };

  state.loading = true;
  try {
    const response = await service.post("/test-step-request", proxyData);
    if (!response.data) {
      throw new Error("No data received from backend proxy");
    }
    state.isUsingManualJson = false;
    parseJsonResponse(state, JSON.stringify(response.data, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch data from step 1:", error);

    if (confirm(`API 调用失败: ${message}\n是否使用手动 JSON 输入？`)) {
      state.isUsingManualJson = true;
      return;
    }
    alert("获取步骤数据失败: " + message);
  } finally {
    state.loading = false;
  }
};

const parseJsonResponse = (state: StepState, jsonString: string) => {
  debugger;
  try {
    const parsedData = JSON.parse(jsonString);
    const flattened = flattenJson(parsedData, "");

    // Convert to standard JsonPath format and deduplicate
    const sourceFieldsMap = new Map<string, SourceField>();
    const keyMapping = new Map<string, string>(); // oldKey -> newKey

    Object.keys(flattened).forEach((key) => {
      let jsonPathKey = key;

      // Remove all array indices completely, not just convert to [*]
      jsonPathKey = jsonPathKey.replace(/\[\d+\]/g, "");

      // Convert [*] to empty string for final path
      jsonPathKey = jsonPathKey.replace(/\[\*\]/g, "");

      // Clean up multiple dots and trailing dots
      jsonPathKey = jsonPathKey.replace(/\.{2,}/g, ".").replace(/\.+$/, "");

      // Remove leading dot if present
      if (jsonPathKey.startsWith(".")) {
        jsonPathKey = jsonPathKey.substring(1);
      }

      jsonPathKey = jsonPathKey
        .replace(/^(\d+)\./, "[*].") // 處理開頭的數字（例如 "0." -> "[*]."）或者改成 "" 直接去掉
        .replace(/\[\d+\]/g, "[*]") // 處理 [0], [1]
        .replace(/\.\d+\./g, "[*].") // 處理中間的 .0.
        .replace(/\.\d+$/, "[*]"); // 處理結尾的 .0

      // Convert to standard JsonPath format
      const fullJsonPath = jsonPathKey.startsWith("$")
        ? jsonPathKey
        : `$.${jsonPathKey}`;

      // Create a deduplication key based on field name and type
      const fieldName = key.split(".").pop() || key;
      const dedupKey = `${fieldName} (${typeof flattened[key]})`;

      // Deduplicate - keep only the first occurrence of each unique field name/type combination
      if (!sourceFieldsMap.has(dedupKey)) {
        sourceFieldsMap.set(dedupKey, {
          name: fieldName,
          key: fullJsonPath,
          type: typeof flattened[key],
          sample: String(flattened[key]),
        });
        // Store the mapping from old key to new key
        keyMapping.set(key, fullJsonPath);
      }
    });

    state.sourceFields = Array.from(sourceFieldsMap.values());
    state.keyMapping = Object.fromEntries(keyMapping); // Store for later use in selectedSource
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to parse JSON response:", error);
    alert("JSON 解析失败: " + message);
  }
};

const flattenJson = (obj: any, prefix: string = ""): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, newKey));
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        const arrayItem = value[0];
        if (typeof arrayItem === "object" && arrayItem !== null) {
          Object.assign(result, flattenJson(arrayItem, `${newKey}[*]`));
        } else {
          result[newKey] = `[${Array(value.length).fill("item").join(", ")}]`;
        }
      } else {
        result[newKey] = "[]";
      }
    } else {
      result[newKey] = value;
    }
  }

  return result;
};

const handleManualJsonInput = (state: StepState) => {
  if (state.manualJson.trim()) {
    parseJsonResponse(state, state.manualJson);
    state.isUsingManualJson = true;
  } else {
    alert("请输入有效的 JSON 数据");
  }
};
</script>

<style scoped>
.btn-outline {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  white-space: nowrap;
}
.btn-outline:hover,
.btn-outline.is-active {
  background: #f3f4f6;
}
</style>
