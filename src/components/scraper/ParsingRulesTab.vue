<!-- components/scraper/ParsingRulesTab.vue -->
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

          <!-- 目标数据库模型（支持多选） -->
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <Label>目标数据库模型（可多选，按住 Ctrl/Cmd 多选）</Label>
              <span
                v-if="state.modelIds.length > 0"
                class="text-xs text-blue-600 font-medium"
              >
                已选择 {{ state.modelIds.length }} 个模型
              </span>
            </div>

            <div v-if="isLoadingModels" class="p-2 text-sm text-blue-600">
              加载中...
            </div>
            <div v-else-if="modelLoadError" class="p-2 text-sm text-red-600">
              <span>{{ modelLoadError }}</span>
              <button
                type="button"
                class="btn-outline ml-2"
                @click="fetchDatabaseModels"
              >
                重试
              </button>
            </div>

            <template v-else>
              <!-- 模型列表为空时给出明确提示，而不是一个空白框 -->
              <div
                v-if="availableDatabaseModels.length === 0"
                class="mb-2 p-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded"
              >
                没有读取到任何数据库模型（/database/tables 返回为空）。
                <button
                  type="button"
                  class="btn-outline ml-2"
                  @click="fetchDatabaseModels"
                >
                  重新加载
                </button>
              </div>

              <select
                multiple
                class="model-select w-full p-2 border rounded-md bg-white text-gray-900 min-h-[120px]"
                @change="handleDatabaseModelChange(index, state, $event)"
              >
                <option
                  v-for="model in modelOptionsFor(state)"
                  :key="model.id"
                  :value="model.id"
                  :selected="state.modelIds.includes(model.id)"
                >
                  {{ model.name }} ({{ model.description }})
                </option>
              </select>
            </template>

            <p class="text-xs text-gray-500 mt-1">
              提示：按住键盘 Ctrl 键（Mac上为 Cmd 键）可进行多选操作。
            </p>
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
                建立源字段与目标字段之间的映射关系（聚合所有选中模型）
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
                    目标字段 (所属模型)
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
                <tr v-if="getTargetFields(state.modelIds).length === 0">
                  <td colspan="3" class="px-4 py-6 text-center text-gray-400">
                    <template v-if="state.modelIds.length === 0">
                      请先上方选择至少一个目标数据库模型
                    </template>
                    <template v-else-if="isLoadingModels">
                      正在加载模型字段...
                    </template>
                    <template v-else>
                      已选择的模型（{{
                        state.modelIds.join("、")
                      }}）没有在模型列表中找到，
                      请检查表名是否一致或重新加载模型列表
                    </template>
                  </td>
                </tr>
                <tr
                  v-for="target in getTargetFields(state.modelIds)"
                  :key="`${target.modelId}-${target.name}`"
                >
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <span
                        class="px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600 rounded font-mono"
                        >{{ target.modelId }}</span
                      >
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
                      <!-- 带搜索框的自定义下拉选择组件 -->
                      <div class="relative search-select-container">
                        <div
                          class="h-9 w-[320px] rounded-md border border-gray-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer select-none"
                          @click="
                            toggleDropdown(state, target.name, target.modelId)
                          "
                        >
                          <span class="truncate text-gray-700">
                            {{
                              getSelectedLabel(
                                step,
                                target.name,
                                state,
                                target.modelId,
                              ) || "选择源字段"
                            }}
                          </span>
                          <span class="text-gray-400 text-xs">▼</span>
                        </div>

                        <!-- 下拉浮動面板 -->
                        <div
                          v-if="
                            state.activeDropdownTarget ===
                            `${target.modelId}-${target.name}`
                          "
                          class="absolute left-0 top-10 z-50 w-[480px] rounded-md border border-gray-200 bg-white shadow-lg p-2"
                        >
                          <input
                            type="text"
                            v-model="state.searchKeyword"
                            placeholder="输入关键字搜索源字段..."
                            class="w-full h-8 px-2 mb-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            @click.stop
                          />
                          <div class="max-h-60 overflow-y-auto space-y-1">
                            <div
                              class="px-2 py-1.5 text-sm rounded hover:bg-blue-50 cursor-pointer text-gray-700"
                              @click="
                                selectSourceField(
                                  index,
                                  step,
                                  state,
                                  target.name,
                                  '',
                                  target.modelId,
                                )
                              "
                            >
                              选择源字段 (清空)
                            </div>
                            <div
                              v-for="field in filteredSourceFields(state)"
                              :key="field.key"
                              class="px-2 py-1.5 text-sm rounded hover:bg-blue-50 cursor-pointer break-all"
                              :class="{
                                'bg-blue-50 font-medium text-blue-600':
                                  field.key ===
                                  selectedSource(
                                    step,
                                    target.name,
                                    state,
                                    target.modelId,
                                  ),
                              }"
                              @click="
                                selectSourceField(
                                  index,
                                  step,
                                  state,
                                  target.name,
                                  field.key,
                                  target.modelId,
                                )
                              "
                              :title="`${field.name} (${field.type}) - ${field.key}`"
                            >
                              {{ field.name }} ({{ field.type }}) -
                              {{ field.key }}
                            </div>
                            <div
                              v-if="filteredSourceFields(state).length === 0"
                              class="px-2 py-3 text-center text-xs text-gray-400"
                            >
                              未找到匹配的源字段
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        class="btn-outline"
                        :class="{
                          'is-active': isCustomField(
                            step,
                            state,
                            target.name,
                            target.modelId,
                          ),
                        }"
                        @click="
                          toggleCustomValue(
                            index,
                            step,
                            state,
                            target.name,
                            target.modelId,
                          )
                        "
                      >
                        固定值
                      </button>

                      <input
                        v-if="
                          isCustomField(
                            step,
                            state,
                            target.name,
                            target.modelId,
                          )
                        "
                        type="text"
                        class="h-9 w-32 rounded-md border border-gray-300 px-2 text-sm"
                        placeholder="输入固定值"
                        :value="
                          customValueOf(
                            step,
                            state,
                            target.name,
                            target.modelId,
                          )
                        "
                        @input="onCustomInput(state, target.name, $event)"
                        @blur="
                          commitCustomValue(
                            index,
                            step,
                            state,
                            target.name,
                            target.modelId,
                          )
                        "
                      />
                    </div>
                  </td>

                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      v-if="findMapping(step, target.name, target.modelId)"
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
            :model-value="rulesList(step)[0]?.css_selector ?? ''"
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
import { reactive, computed, watch, ref, onMounted, onUnmounted } from "vue";
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
  model_id?: string;
}

interface StepState {
  modelIds: string[];
  sourceFields: SourceField[];
  manualJson: string;
  isUsingManualJson: boolean;
  loading: boolean;
  customMode: Record<string, boolean>;
  customDraft: Record<string, string>;
  keyMapping?: Record<string, string>;
  activeDropdownTarget: string | null;
  searchKeyword: string;
}

const CUSTOM_PREFIX = "custom:";

const availableDatabaseModels = ref<DatabaseModel[]>([]);
const isLoadingModels = ref(false);
const modelLoadError = ref<string | null>(null);

/**
 * 兼容不同的响应结构：
 *  - 响应拦截器已解包：      [ ... ]
 *  - axios 原始响应：        { data: [ ... ] }
 *  - 后端包了一层：          { data: { items: [ ... ] } } / { data: { tables: [ ... ] } }
 *                           { items: [...] } / { tables: [...] } / { columns: [...] } / { results: [...] }
 */
const extractList = (res: any): any[] => {
  const seen = new Set<any>();
  const walk = (node: any, depth: number): any[] | null => {
    if (Array.isArray(node)) return node;
    if (!node || typeof node !== "object" || depth > 3 || seen.has(node)) {
      return null;
    }
    seen.add(node);
    for (const key of [
      "data",
      "items",
      "tables",
      "columns",
      "results",
      "list",
      "rows",
    ]) {
      if (key in node) {
        const found = walk(node[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(res, 0) ?? [];
};

const toModelName = (tableName: string) =>
  tableName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());

const fetchDatabaseModels = async () => {
  isLoadingModels.value = true;
  modelLoadError.value = null;

  try {
    const tablesResponse = await service.get("/database/tables", {
      timeout: 300000,
    });
    if (!tablesResponse) {
      throw new Error("No tables data received from backend");
    }

    const tables = extractList(tablesResponse);
    if (tables.length === 0) {
      console.warn(
        "[ParsingRulesTab] /database/tables 没有解析出任何表，原始响应：",
        tablesResponse,
      );
    }

    // 并行请求各表字段，避免串行等待
    const results = await Promise.all(
      tables.map(async (tableItem: any): Promise<DatabaseModel | null> => {
        const tableName =
          typeof tableItem === "object" && tableItem !== null
            ? tableItem.table_name || tableItem.name || String(tableItem)
            : String(tableItem);

        try {
          const columnsResponse = await service.get(
            `/database/tables/${tableName}/columns`,
            { timeout: 600000 },
          );
          const columns = extractList(columnsResponse);

          const fields: TargetField[] = columns.map((col: any) => ({
            name: col.name,
            label: col.label || col.name,
            type: col.type,
            required: col.required || false,
          }));

          return {
            id: tableName,
            name: toModelName(tableName),
            description: `数据库表：${tableName}`,
            fields,
          };
        } catch (columnError) {
          console.error(
            `Failed to fetch columns for table ${tableName}:`,
            columnError,
          );
          return null;
        }
      }),
    );

    availableDatabaseModels.value = results.filter(
      (m): m is DatabaseModel => m !== null,
    );
  } catch (error) {
    console.error("Failed to fetch database models:", error);
    modelLoadError.value = "无法加载数据库模型，请稍后重试";
    availableDatabaseModels.value = [];
  } finally {
    isLoadingModels.value = false;
  }
};

/**
 * 下拉选项 = 已加载的模型 + 已选中但不在列表里的模型。
 * 这样即使模型列表加载失败 / id 对不上，已保存的选择也不会"消失"。
 */
const modelOptionsFor = (state: StepState): DatabaseModel[] => {
  const known = new Set(availableDatabaseModels.value.map((m) => m.id));
  const missing = state.modelIds
    .filter((id) => !known.has(id))
    .map<DatabaseModel>((id) => ({
      id,
      name: toModelName(id),
      description: "未在模型列表中找到",
      fields: [],
    }));
  return [...availableDatabaseModels.value, ...missing];
};

onMounted(() => {
  fetchDatabaseModels();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (event: MouseEvent) => {
  if (!(event.target as HTMLElement).closest(".search-select-container")) {
    Object.values(stepStates).forEach((state) => {
      state.activeDropdownTarget = null;
    });
  }
};

const toggleDropdown = (
  state: StepState,
  targetName: string,
  modelId: string,
) => {
  const dropdownKey = `${modelId}-${targetName}`;
  if (state.activeDropdownTarget === dropdownKey) {
    state.activeDropdownTarget = null;
  } else {
    state.activeDropdownTarget = dropdownKey;
    state.searchKeyword = ""; // 确保每次打开时搜索关键字为空
  }
};

const filteredSourceFields = (state: StepState) => {
  if (!state.searchKeyword.trim()) return state.sourceFields;
  const kw = state.searchKeyword.toLowerCase();
  return state.sourceFields.filter(
    (f) =>
      f.name.toLowerCase().includes(kw) ||
      f.key.toLowerCase().includes(kw) ||
      f.type.toLowerCase().includes(kw),
  );
};

const getSelectedLabel = (
  step: any,
  target: string,
  state: StepState,
  modelId?: string,
) => {
  const key = selectedSource(step, target, state, modelId);
  if (!key) return "";
  const found = state.sourceFields.find((f) => f.key === key);
  if (found) {
    return `${found.name} (${found.type}) - ${found.key}`;
  }
  return key;
};

const selectSourceField = (
  index: number,
  step: any,
  state: StepState,
  target: string,
  value: string,
  modelId?: string,
) => {
  state.customMode[target] = false;
  delete state.customDraft[target];
  state.activeDropdownTarget = null;
  state.searchKeyword = ""; // 选择后清空搜索
  updateStepMappings(index, step, target, value, modelId);
};

const getTargetFields = (modelIds: string[]) => {
  if (!modelIds || modelIds.length === 0) return [];

  const allFields: Array<TargetField & { modelId: string }> = [];
  for (const modelId of modelIds) {
    const model = availableDatabaseModels.value.find((m) => m.id === modelId);
    if (model && model.fields) {
      allFields.push(
        ...model.fields.map((field) => ({
          ...field,
          modelId,
        })),
      );
    }
  }

  return allFields;
};

const stepStates = reactive<Record<string, StepState>>({});

const stepKey = (step: any, index: number) =>
  String(step?.id ?? `idx-${index}`);

const rulesList = (step: any): Array<Record<string, any>> => {
  if (!step?.parsing_rules) return [];
  if (Array.isArray(step.parsing_rules)) {
    return step.parsing_rules;
  }
  return [step.parsing_rules];
};

function ensureStepStates() {
  props.steps.forEach((step, index) => {
    const key = stepKey(step, index);
    if (!stepStates[key]) {
      stepStates[key] = {
        modelIds: resolveInitialModelIds(step),
        sourceFields: [],
        manualJson: "",
        isUsingManualJson: false,
        loading: false,
        customMode: {},
        customDraft: {},
        keyMapping: {},
        activeDropdownTarget: null,
        searchKeyword: "",
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

const updateStepMappings = (
  index: number,
  step: any,
  target: string,
  sourceKey: string,
  modelId?: string,
) => {
  const newSteps = [...props.steps];
  const rules = [...rulesList(step)];

  let targetRuleIndex = rules.findIndex((r) => r.target_model === modelId);
  if (targetRuleIndex === -1 && rules.length > 0) {
    targetRuleIndex = 0;
  }

  if (targetRuleIndex >= 0) {
    const currentMappings = Array.isArray(rules[targetRuleIndex].mappings)
      ? [...rules[targetRuleIndex].mappings]
      : [];
    const filteredMappings = currentMappings.filter(
      (m) => m.target_field !== target,
    );

    if (sourceKey) {
      const newMapping: Mapping = {
        source_key: sourceKey,
        target_field: target,
      };
      // Only add model_id if it's provided
      if (modelId) {
        newMapping.model_id = modelId;
      }
      filteredMappings.push(newMapping);
    }

    rules[targetRuleIndex] = {
      ...rules[targetRuleIndex],
      target_model: modelId || rules[targetRuleIndex].target_model,
      mappings: filteredMappings,
    };
  }

  newSteps[index] = {
    ...step,
    parsing_rules: rules,
  };
  emit("update:steps", newSteps);
};

const updateStepParsingRules = (index: number, patch: Record<string, any>) => {
  const newSteps = [...props.steps];
  const step = newSteps[index];
  const currentRules = [...rulesList(step)];

  if (currentRules.length === 0) {
    currentRules.push({
      name: "默认解析规则",
      jsonpath: "$.vehicle.name",
      output_field: "model_name",
      target_model: step.target_model || "pricing_inventory",
      ...patch,
    });
  } else {
    currentRules[0] = {
      ...currentRules[0],
      ...patch,
    };
  }

  newSteps[index] = {
    ...step,
    parsing_rules: currentRules,
  };
  emit("update:steps", newSteps);
};

function getMappings(step: any): Mapping[] {
  const rules = rulesList(step);
  const allMappings: Mapping[] = [];
  rules.forEach((rule: any) => {
    if (Array.isArray(rule.mappings)) {
      allMappings.push(...rule.mappings);
    }
  });
  return allMappings;
}

function findMapping(step: any, target: string, modelId?: string) {
  const mappings = getMappings(step);
  if (modelId) {
    // Try to find mapping with both target_field and model_id first
    let found = mappings.find(
      (m: Mapping) => m.target_field === target && m.model_id === modelId,
    );
    // If not found, try to find mapping with just target_field (for backward compatibility)
    if (!found) {
      found = mappings.find((m: Mapping) => m.target_field === target);
    }
    return found;
  }
  return mappings.find((m: Mapping) => m.target_field === target);
}

function resolveInitialModelIds(step: any): string[] {
  const modelIds: string[] = [];

  if (Array.isArray(step.target_models)) {
    modelIds.push(...step.target_models);
  } else if (step.target_model) {
    modelIds.push(step.target_model);
  }

  const rules = rulesList(step);
  rules.forEach((rule: any) => {
    if (rule.target_model && !modelIds.includes(rule.target_model)) {
      modelIds.push(rule.target_model);
    }
  });

  const mappings = getMappings(step);
  mappings.forEach((m: Mapping) => {
    if (m.model_id && !modelIds.includes(m.model_id)) {
      modelIds.push(m.model_id);
    }
  });

  return modelIds;
}

const isCustomSource = (key?: string) => !!key && key.startsWith(CUSTOM_PREFIX);
const parseCustomValue = (key: string) => key.split(":").slice(2).join(":");

const isCustomField = (
  step: any,
  state: StepState,
  target: string,
  modelId?: string,
) => {
  const flag = state.customMode[target];
  return flag !== undefined
    ? flag
    : isCustomSource(findMapping(step, target, modelId)?.source_key);
};

const selectedSource = (
  step: any,
  target: string,
  state?: StepState,
  modelId?: string,
) => {
  const mappingKey = findMapping(step, target, modelId)?.source_key;
  if (!mappingKey || isCustomSource(mappingKey)) return "";

  if (state && state.keyMapping && state.keyMapping[mappingKey]) {
    return state.keyMapping[mappingKey];
  }

  return mappingKey;
};

const customValueOf = (
  step: any,
  state: StepState,
  target: string,
  modelId?: string,
) => {
  if (target in state.customDraft) return state.customDraft[target];
  const key = findMapping(step, target, modelId)?.source_key;
  return isCustomSource(key) ? parseCustomValue(key as string) : "";
};

const unmappedRequiredCount = (step: any, state: StepState) =>
  getTargetFields(state.modelIds).filter(
    (t) => t.required && !findMapping(step, t.name, t.modelId),
  ).length;

const toggleCustomValue = (
  index: number,
  step: any,
  state: StepState,
  target: string,
  modelId?: string,
) => {
  if (isCustomField(step, state, target, modelId)) {
    state.customMode[target] = false;
    delete state.customDraft[target];
  } else {
    state.customMode[target] = true;
    state.customDraft[target] = "";
  }
  updateStepMappings(index, step, target, "", modelId);
};

const onCustomInput = (state: StepState, target: string, event: Event) => {
  state.customDraft[target] = (event.target as HTMLInputElement).value;
};

const commitCustomValue = (
  index: number,
  step: any,
  state: StepState,
  target: string,
  modelId?: string,
) => {
  if (!isCustomField(step, state, target, modelId)) return;
  const draft = state.customDraft[target];
  if (draft === undefined) return;
  const sourceKey = draft ? `${CUSTOM_PREFIX}${target}:${draft}` : "";
  updateStepMappings(index, step, target, sourceKey, modelId);
};

const resetMappings = (index: number, state: StepState) => {
  state.customMode = {};
  state.customDraft = {};

  const newSteps = [...props.steps];
  const step = newSteps[index];
  const rules = rulesList(step).map((rule) => ({ ...rule, mappings: [] }));
  newSteps[index] = { ...step, parsing_rules: rules };
  emit("update:steps", newSteps);
};

const handleDatabaseModelChange = (
  index: number,
  state: StepState,
  event: Event,
) => {
  const selectElement = event.target as HTMLSelectElement;
  const selectedOptions = Array.from(selectElement.selectedOptions).map(
    (option) => option.value,
  );

  state.modelIds = selectedOptions;
  state.customMode = {};
  state.customDraft = {};

  const step = props.steps[index];
  const existingRules = rulesList(step);

  const newParsingRules = selectedOptions.map((modelId, idx) => {
    const matchedRule =
      existingRules.find((r) => r.target_model === modelId) ||
      existingRules[idx];
    // Filter mappings by model_id, but also include mappings without model_id for backward compatibility
    let modelMappings = getMappings(step).filter((m: Mapping) => m.model_id === modelId);
    if (modelMappings.length === 0) {
      // If no mappings found with specific model_id, try to find any mapping that matches target fields
      const matchedRule = existingRules.find((r) => r.target_model === modelId);
      if (matchedRule && matchedRule.mappings) {
        modelMappings = matchedRule.mappings.filter(
          (m: Mapping) => {
            const targetFieldNames = getTargetFields(state.modelIds).map(f => f.name);
            return m.target_field && targetFieldNames.includes(m.target_field);
          },
        );
      }
    }

    return {
      name: matchedRule?.name || `解析规则_${modelId}`,
      jsonpath: matchedRule?.jsonpath || "$.vehicle.name",
      output_field: matchedRule?.output_field || "model_name",
      target_model: modelId,
      mappings:
        modelMappings.length > 0 ? modelMappings : matchedRule?.mappings || [],
    };
  });

  const newSteps = [...props.steps];
  newSteps[index] = {
    ...newSteps[index],
    target_models: selectedOptions,
    target_model: selectedOptions.length > 0 ? selectedOptions[0] : null,
    parsing_rules:
      newParsingRules.length > 0
        ? newParsingRules
        : [
            {
              name: "默认解析规则",
              target_model: selectedOptions[0],
              mappings: [],
            },
          ],
  };
  emit("update:steps", newSteps);
};

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
  const rules = [...rulesList(step)];

  rules.forEach((rule: any) => {
    const modelId = rule.target_model;
    const modelTargetFields = getTargetFields(state.modelIds).filter(
      (t) => !modelId || t.modelId === modelId,
    );
    const nextMappings = Array.isArray(rule.mappings) ? [...rule.mappings] : [];

    for (const target of modelTargetFields) {
      // Try to find existing mapping with both target_field and model_id first
      let existing = nextMappings.find(
        (m) => m.target_field === target.name && m.model_id === target.modelId,
      );
      // If not found, try to find mapping with just target_field (for backward compatibility)
      if (!existing) {
        existing = nextMappings.find((m) => m.target_field === target.name);
      }
      if (existing) continue;

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
        nextMappings.push({
          source_key: best.key,
          target_field: target.name,
          model_id: target.modelId,
        });
        state.customMode[target.name] = false;
        delete state.customDraft[target.name];
      }
    }
    rule.mappings = nextMappings;
  });

  const newSteps = [...props.steps];
  newSteps[index] = { ...step, parsing_rules: rules };
  emit("update:steps", newSteps);
};

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
  try {
    const parsedData = JSON.parse(jsonString);
    const flattened = flattenJson(parsedData, "");

    const sourceFieldsMap = new Map<string, SourceField>();
    const keyMapping = new Map<string, string>();

    Object.keys(flattened).forEach((key) => {
      let jsonPathKey = key.replace(/^\d+\.\s*/, "");

      if (jsonPathKey.startsWith(".")) {
        jsonPathKey = jsonPathKey.substring(1);
      }

      const fullJsonPath = jsonPathKey.startsWith("$")
        ? jsonPathKey
        : `$.${jsonPathKey}`;

      const fieldName = key.split(".").pop() || key;

      if (!sourceFieldsMap.has(fullJsonPath)) {
        sourceFieldsMap.set(fullJsonPath, {
          name: fieldName,
          key: fullJsonPath,
          type: typeof flattened[key],
          sample: String(flattened[key]),
        });
        keyMapping.set(key, fullJsonPath);
      }
    });
    state.sourceFields = Array.from(sourceFieldsMap.values());
    state.keyMapping = Object.fromEntries(keyMapping);
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
          Object.assign(result, flattenJson(arrayItem, newKey));
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
/* 搜索输入框强制设定背景与字体颜色，避免黑底黑字 */
input[type="text"] {
  background-color: #ffffff !important;
  color: #1f2937 !important;
}

/* 覆盖浏览器 autofill（自动填入）时的样式 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: #1f2937 !important;
  -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* 目标数据库模型多选框：强制浅色配色，避免深色主题下白字白底 / 深色滚动条 */
.model-select {
  color-scheme: light;
  background-color: #ffffff !important;
  color: #1f2937 !important;
}
.model-select option {
  background-color: #ffffff !important;
  color: #1f2937 !important;
}
.model-select option:checked {
  background-color: #dbeafe !important;
  color: #1e40af !important;
}

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
