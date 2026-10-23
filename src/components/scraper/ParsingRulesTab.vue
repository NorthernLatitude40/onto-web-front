<!-- components/ParsingRulesTab.vue -->
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

      <!-- JSONPath for API responses -->
      <div class="rule-section mb-4">
        <Label>JSONPath 规则 (API)</Label>
        <Textarea
          :model-value="jsonpath"
          @update:model-value="$emit('update:jsonpath', $event)"
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
            :model-value="jsonpath"
            @update:model-value="$emit('update:jsonpath', $event)"
            placeholder="$['products'][0]['name']"
            rows="2"
          />
        </div>

        <!-- CSS/XPath for HTML -->
        <div class="rule-section mb-2">
          <Label>CSS Selector</Label>
          <Textarea
            v-model="(step.parsing_rules as any).css_selector"
            placeholder=".product-item, .article"
            rows="2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

defineProps<{
  steps: any[];
  globalParsingRules: any;
  jsonpath: string;
}>();

defineEmits(["update:jsonpath", "update:globalParsingRules"]);
</script>
