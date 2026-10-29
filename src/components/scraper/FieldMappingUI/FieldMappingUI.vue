<template>
  <div class="field-mapping-ui">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">字段映射配置</h3>
        <p class="text-sm text-gray-600">建立源字段与目标字段之间的映射关系</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="autoMapFields">
          自动配对
        </Button>
        <Button variant="outline" size="sm" @click="resetMappings">
          重置映射
        </Button>
      </div>
    </div>

    <!-- Mapping Table -->
    <div
      class="table-container overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <table class="w-full border-collapse text-sm">
        <thead class="bg-gray-50">
          <tr class="border-b border-gray-200">
            <th
              class="px-4 py-3 text-left font-medium text-gray-700 bg-gray-50"
            >
              目标字段
            </th>
            <th
              class="px-4 py-3 text-left font-medium text-gray-700 bg-gray-50"
            >
              映射类型 / 源字段选择
            </th>
            <th
              class="px-4 py-3 text-left font-medium text-gray-700 bg-gray-50"
            >
              对应状态
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="targetField in targetFields"
            :key="`mapping-${targetField.name}`"
          >
            <!-- Target Field Column -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ targetField.label }}</span>
                <span class="text-xs text-gray-500">{{
                  targetField.name
                }}</span>
                <span class="text-xs text-gray-400"
                  >({{ targetField.type }})</span
                >
                <Badge variant="destructive" v-if="targetField.required">
                  必填
                </Badge>
              </div>
            </td>

            <!-- Mapping Type Column -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex gap-2 items-center">
                <!-- Source Field Selector：受控模式，只在回调里写状态 -->
                <Select
                  :model-value="
                    sourceKeyBindings[targetField.name] || undefined
                  "
                  @update:model-value="
                    (val) =>
                      handleSelectChange(targetField.name, String(val ?? ''))
                  "
                >
                  <SelectTrigger class="w-[200px]">
                    <SelectValue placeholder="选择源字段" />
                  </SelectTrigger>
                  <!-- 已移除无效的 :to="false"，并提高层级避免被遮挡 -->
                  <SelectContent class="z-[9999]">
                    <SelectItem
                      v-for="sourceField in sourceFields"
                      :key="`select-${sourceField.key}`"
                      :value="sourceField.key"
                    >
                      {{ sourceField.name }} ({{ sourceField.type }}) -
                      {{ sourceField.key }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <!-- Custom Value Toggle -->
                <Button
                  variant="outline"
                  size="sm"
                  @click="toggleCustomValue(targetField.name)"
                  :class="{
                    'bg-gray-100': mappingForField[targetField.name]?.isCustom,
                  }"
                >
                  固定值
                </Button>

                <!-- Custom Value Input -->
                <Input
                  v-if="mappingForField[targetField.name]?.isCustom"
                  v-model="mappingForField[targetField.name].customValue"
                  placeholder="输入固定值"
                  class="w-32"
                  @blur="handleCustomValueChange(targetField.name)"
                />
              </div>
            </td>

            <!-- Status Column -->
            <td class="px-4 py-3 whitespace-nowrap">
              <Badge
                v-if="isFieldMapped(targetField.name)"
                variant="default"
                class="bg-green-100 text-green-800"
              >
                已映射
              </Badge>
              <Badge v-else-if="targetField.required" variant="destructive">
                ⚠️ 未映射
              </Badge>
              <Badge v-else variant="secondary"> 可选 </Badge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 class="text-sm font-medium mb-2">映射总览</h4>
      <p class="text-sm text-gray-600">
        已建立 {{ mappings.length }} 个映射关系，
        <span v-if="requiredFieldsUnmapped > 0" class="text-red-500">
          {{ requiredFieldsUnmapped }} 个必填字段未映射
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computed, ref, watch } from "vue";

interface SourceField {
  name: string;
  key: string;
  type: string;
  sample?: string;
}

interface TargetField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface Mapping {
  source_key: string;
  target_field: string;
}

interface FieldMappingState {
  sourceKey?: string;
  isCustom?: boolean;
  customValue?: string;
}

const props = defineProps<{
  sourceFields: SourceField[];
  targetFields: TargetField[];
  initialMappings?: Mapping[];
}>();

const emit = defineEmits<{
  (e: "update:mappings", mappings: Mapping[]): void;
}>();

// 每个目标字段的 UI 状态
const mappingForField = ref<Record<string, FieldMappingState>>({});

// 已建立的映射
const mappings = ref<Mapping[]>([]);

// Select 的绑定值（目标字段名 -> 源字段 key）
const sourceKeyBindings = ref<Record<string, string>>({});

const CUSTOM_PREFIX = "custom:";

// 根据 mappings 重建 UI 状态
const initializeFieldMappings = () => {
  const initialState: Record<string, FieldMappingState> = {};
  const bindings: Record<string, string> = {};

  props.targetFields.forEach((targetField) => {
    const existing = mappings.value.find(
      (m) => m.target_field === targetField.name,
    );

    if (existing && existing.source_key.startsWith(CUSTOM_PREFIX)) {
      // 格式：custom:<targetField>:<value>，value 里可能含冒号
      initialState[targetField.name] = {
        sourceKey: existing.source_key,
        isCustom: true,
        customValue: existing.source_key.split(":").slice(2).join(":"),
      };
      bindings[targetField.name] = ""; // 固定值不对应任何下拉项
    } else if (existing) {
      initialState[targetField.name] = {
        sourceKey: existing.source_key,
        isCustom: false,
      };
      bindings[targetField.name] = existing.source_key;
    } else {
      initialState[targetField.name] = {};
      bindings[targetField.name] = "";
    }
  });

  mappingForField.value = initialState;
  sourceKeyBindings.value = bindings;
};

// 监听外部传入的初始映射。
// 如果父组件把 update:mappings 回灌到 initialMappings，内容相同则跳过，避免重置用户刚做的选择。
watch(
  () => props.initialMappings,
  (newMappings) => {
    const next = newMappings ?? [];
    if (JSON.stringify(next) === JSON.stringify(mappings.value)) return;
    mappings.value = [...next];
    initializeFieldMappings();
  },
  { immediate: true, deep: true },
);

// 目标字段变化时补齐状态（不丢失已有选择）
watch(
  () => props.targetFields,
  () => {
    initializeFieldMappings();
  },
  { deep: true },
);

// Computed
const requiredFieldsUnmapped = computed(() => {
  const mappedTargetNames = mappings.value.map((m) => m.target_field);
  return props.targetFields.filter(
    (f) => f.required && !mappedTargetNames.includes(f.name),
  ).length;
});

const isFieldMapped = (targetName: string) => {
  return mappings.value.some((m) => m.target_field === targetName);
};

// 写入 / 更新 / 删除某个目标字段的映射
const upsertMapping = (targetFieldName: string, sourceKey: string) => {
  const idx = mappings.value.findIndex(
    (m) => m.target_field === targetFieldName,
  );
  if (sourceKey) {
    if (idx >= 0) {
      mappings.value[idx].source_key = sourceKey;
    } else {
      mappings.value.push({
        source_key: sourceKey,
        target_field: targetFieldName,
      });
    }
  } else if (idx >= 0) {
    mappings.value.splice(idx, 1);
  }
};

// Methods
const handleSelectChange = (targetFieldName: string, sourceKey: string) => {
  sourceKeyBindings.value[targetFieldName] = sourceKey;
  mappingForField.value[targetFieldName] = { sourceKey, isCustom: false };

  upsertMapping(targetFieldName, sourceKey);
  emit("update:mappings", [...mappings.value]);
};

const toggleCustomValue = (targetFieldName: string) => {
  const currentState = mappingForField.value[targetFieldName] || {};

  if (!currentState.isCustom) {
    // 进入固定值模式：清掉下拉选择及其对应映射，等输入完成后再写入
    mappingForField.value[targetFieldName] = {
      isCustom: true,
      customValue: "",
    };
    sourceKeyBindings.value[targetFieldName] = "";
    upsertMapping(targetFieldName, "");
  } else {
    // 退出固定值模式
    mappingForField.value[targetFieldName] = {};
    upsertMapping(targetFieldName, "");
  }

  emit("update:mappings", [...mappings.value]);
};

const handleCustomValueChange = (targetFieldName: string) => {
  const currentState = mappingForField.value[targetFieldName];
  if (!currentState?.isCustom) return;

  if (!currentState.customValue) {
    // 清空固定值则移除映射
    upsertMapping(targetFieldName, "");
  } else {
    upsertMapping(
      targetFieldName,
      `${CUSTOM_PREFIX}${targetFieldName}:${currentState.customValue}`,
    );
  }

  emit("update:mappings", [...mappings.value]);
};

const autoMapFields = () => {
  props.targetFields.forEach((targetField) => {
    if (isFieldMapped(targetField.name)) return;

    let bestMatch: SourceField | undefined;
    let highestScore = 0;

    props.sourceFields.forEach((sourceField) => {
      const score = calculateSimilarityScore(targetField.name, sourceField.key);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = sourceField;
      }
    });

    if (bestMatch && highestScore > 0.5) {
      mappingForField.value[targetField.name] = {
        sourceKey: bestMatch.key,
        isCustom: false,
      };
      sourceKeyBindings.value[targetField.name] = bestMatch.key;
      upsertMapping(targetField.name, bestMatch.key);
    }
  });

  emit("update:mappings", [...mappings.value]);
};

// 先拆词（驼峰 / 下划线 / 点 / 横线），再转小写
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
        dp[i - 1][j - 1] + cost, // 替换（原代码误写为 j + 1）
        dp[i][j - 1] + 1, // 插入
        dp[i - 1][j] + 1, // 删除
      );
    }
  }

  return dp[m][n];
};

const calculateSimilarityScore = (
  targetName: string,
  sourceKey: string,
): number => {
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
    if (word.length > 2 && sourceWords.includes(word)) {
      commonWords++;
    }
  });

  const maxLength = Math.max(targetNormalized.length, sourceNormalized.length);
  const levenshteinScore =
    1 - levenshteinDistance(targetNormalized, sourceNormalized) / maxLength;

  const wordMatchScore =
    commonWords / Math.max(targetWords.length, sourceWords.length);

  return wordMatchScore * 0.4 + levenshteinScore * 0.6;
};

const resetMappings = () => {
  mappings.value = [];
  initializeFieldMappings();
  emit("update:mappings", []);
};
</script>

<style scoped>
.field-mapping-ui {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
</style>
