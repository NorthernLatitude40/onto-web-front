<!-- components/MultiParserTab.vue -->
<template>
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
        <h5 class="step-parsing-title text-blue-700 font-medium mb-3">
          步骤 {{ stepIndex + 1 }}: {{ step.name || "未命名" }}
        </h5>

        <!-- Multi-parser rules list -->
        <div
          v-if="step.multi_parser_rules && step.multi_parser_rules.length > 0"
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
                @click="$emit('remove-rule', stepIndex, ruleIndex)"
              >
                删除
              </Button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
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
                    <SelectItem value="jsonpath">JSONPath</SelectItem>
                    <SelectItem value="css">CSS选择器</SelectItem>
                    <SelectItem value="xpath">XPath</SelectItem>
                    <SelectItem value="regex">正则表达式</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Output Field -->
              <div>
                <Label>输出字段</Label>
                <Input v-model="rule.output_field" placeholder="data.items" />
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
        <Button size="sm" class="mb-4" @click="$emit('add-rule', stepIndex)">
          <PlusIcon class="w-4 h-4 mr-2" />
          添加新解析规则
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "@lucide/vue";

defineProps<{
  steps: any[];
}>();

defineEmits(["add-rule", "remove-rule"]);

// 輔助函數：根據解析器類型給出對應的 Placeholder
const getParserPlaceholder = (type: string) => {
  switch (type) {
    case "jsonpath":
      return "$.data.items[*]";
    case "css":
      return ".product-title";
    case "xpath":
      return "//div[@class='title']";
    case "regex":
      return "id=(\\d+)";
    default:
      return "请输入表达式...";
  }
};
</script>
