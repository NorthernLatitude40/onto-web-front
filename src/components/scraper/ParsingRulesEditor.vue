<template>
  <div class="parsing-rules-editor">
    <div class="section-header">
      <h3 class="section-title">数据解析规则</h3>
      <p class="section-description">配置如何从响应中提取和转换数据</p>
    </div>

    <div v-if="rules.length === 0" class="empty-rules">
      <div class="empty-state">
        <Info class="empty-icon" />
        <h4 class="empty-title">没有解析规则</h4>
        <p class="empty-description">添加规则来提取响应中的数据</p>
        <Button @click="addRule" size="sm">
          <Plus class="mr-2 h-4 w-4" />
          添加第一个解析规则
        </Button>
      </div>
    </div>

    <div v-else class="rules-list">
      <div
        v-for="(rule, index) in rules"
        :key="rule.id || `rule-${index}`"
        class="rule-card"
      >
        <div class="rule-header">
          <div class="rule-title">
            <span class="rule-index">规则 {{ index + 1 }}</span>
            <Input
              v-model="rule.name"
              placeholder="规则名称"
              class="rule-name-input"
              @blur="updateRule(index, 'name', rule.name)"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            @click="removeRule(index)"
            :disabled="rules.length <= 1"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>

        <div class="rule-content">
          <div class="form-grid">
            <!-- Parser Type Selector -->
            <div class="form-group">
              <Label>解析器类型</Label>
              <Select
                v-model="rule.parser_type"
                @update:model-value="
                  (val) => updateRule(index, 'parser_type', val)
                "
              >
                <SelectTrigger class="w-full">
                  <SelectValue
                    :placeholder="
                      rule.parser_type
                        ? getParserLabel(rule.parser_type)
                        : '选择解析器类型'
                    "
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jsonpath">JSONPath</SelectItem>
                  <SelectItem value="css_selector">CSS 选择器</SelectItem>
                  <SelectItem value="xpath">XPath</SelectItem>
                  <SelectItem value="regex">正则表达式</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Dynamic Parser Field -->
            <div class="form-group">
              <Label>{{ getParserLabel(rule.parser_type) }}</Label>
              <Textarea
                v-model="rule.expression"
                placeholder="输入解析表达式..."
                @blur="updateRule(index, 'expression', rule.expression)"
              />
            </div>

            <!-- Output Field -->
            <div class="form-group">
              <Label>输出字段</Label>
              <Input
                v-model="rule.output_field"
                placeholder="result_data"
                @blur="updateRule(index, 'output_field', rule.output_field)"
              />
            </div>

            <!-- Required Flag -->
            <div class="form-group">
              <Label>必填</Label>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="rule.required"
                  @change="updateRule(index, 'required', rule.required)"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-muted-foreground"
                  >是否必须提取此字段</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Button @click="addRule" variant="outline" size="sm" class="mt-4">
      <Plus class="mr-2 h-4 w-4" />
      添加解析规则
    </Button>
  </div>
</template>

<script setup lang="ts">
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui/index";
import { Info, Plus, Trash2 } from "lucide-vue-next";
import { v4 as uuidv4 } from "uuid";
import { ref, watch } from "vue";

interface ParsingRule {
  id: string;
  name: string;
  parser_type?: "jsonpath" | "css_selector" | "xpath" | "regex";
  expression?: string;
  output_field: string;
  required: boolean;
}

const props = defineProps<{
  rules: ParsingRule[];
}>();

const emit = defineEmits<{
  (e: "update:rules", value: ParsingRule[]): void;
}>();

// Local state to track changes
const localRules = ref<ParsingRule[]>([]);

// Initialize or update local rules when props change
watch(
  () => props.rules,
  (newRules) => {
    if (newRules.length === 0 && localRules.value.length > 0) {
      // If props are reset, keep local changes
      return;
    }

    // Convert old format to new format if needed
    const converted = newRules.map((rule) => {
      if (
        "jsonpath" in rule ||
        "css_selector" in rule ||
        "xpath" in rule ||
        "regex" in rule
      ) {
        // Old format - convert to new format
        return convertOldRuleToNew(rule as any);
      }
      return rule;
    });

    localRules.value = converted;
  },
  { immediate: true, deep: true },
);

// Convert old format (single object with all parsers) to new format (array of rules)
function convertOldRuleToNew(oldRule: any): ParsingRule {
  const rule: ParsingRule = {
    id: uuidv4(),
    name: "默认规则",
    output_field: "result_data",
    required: false,
  };

  if (oldRule.jsonpath) {
    rule.parser_type = "jsonpath";
    rule.expression = oldRule.jsonpath;
    rule.name = "JSONPath 规则";
    rule.output_field = "jsonpath_result";
  } else if (oldRule.css_selector) {
    rule.parser_type = "css_selector";
    rule.expression = oldRule.css_selector;
    rule.name = "CSS 选择器规则";
    rule.output_field = "css_result";
  } else if (oldRule.xpath) {
    rule.parser_type = "xpath";
    rule.expression = oldRule.xpath;
    rule.name = "XPath 规则";
    rule.output_field = "xpath_result";
  } else if (oldRule.regex) {
    rule.parser_type = "regex";
    rule.expression = oldRule.regex;
    rule.name = "正则表达式规则";
    rule.output_field = "regex_result";
  }

  return rule;
}

function addRule() {
  const newRule: ParsingRule = {
    id: uuidv4(),
    name: `规则 ${localRules.value.length + 1}`,
    parser_type: "jsonpath",
    expression: "",
    output_field: `field_${localRules.value.length + 1}`,
    required: false,
  };

  localRules.value.push(newRule);
  emit("update:rules", [...localRules.value]);
}

function removeRule(index: number) {
  const newRules = [...localRules.value];
  newRules.splice(index, 1);
  localRules.value = newRules;
  emit("update:rules", newRules);
}

function updateRule(index: number, key: string, value: any) {
  const newRules = [...localRules.value];
  if (!newRules[index]) return;

  // @ts-ignore - dynamic key assignment
  newRules[index][key] = value;
  localRules.value = newRules;
  emit("update:rules", newRules);
}

function getParserLabel(type?: string): string {
  switch (type) {
    case "jsonpath":
      return "JSONPath 表达式";
    case "css_selector":
      return "CSS 选择器";
    case "xpath":
      return "XPath 表达式";
    case "regex":
      return "正则表达式";
    default:
      return "解析表达式";
  }
}
</script>

<style scoped>
.parsing-rules-editor {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 16px;
}

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

.section-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.empty-rules {
  text-align: center;
  padding: 40px 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  color: #d1d5db;
  width: 48px;
  height: 48px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.empty-description {
  color: #6b7280;
  margin-bottom: 16px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.rule-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.rule-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rule-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.rule-index {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.rule-name-input {
  font-size: 14px;
  padding: 4px 8px;
  width: auto;
  flex: 1;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
