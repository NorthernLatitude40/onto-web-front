<template>
  <div class="form-grid">
    <div class="form-group full-width">
      <Label>步骤流程</Label>
      <p class="step-description">
        定义多个步骤，每个步骤可以独立选择爬取模式（API 或 浏览器动态模式）
      </p>

      <div class="steps-container">
        <Card
          v-for="(step, index) in stepList"
          :key="step.id"
          class="mb-3 step-card"
          draggable="true"
          @dragstart="$emit('dragstart', $event, index)"
          @dragover.prevent="$emit('dragover', $event, index)"
          @dragenter.prevent="$emit('dragenter', $event, index)"
          @dragend="$emit('dragend')"
          @drop="$emit('drop', $event, index)"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-800">步骤 {{ index + 1 }}</span>
              <span class="step-name" v-if="step.name">{{ step.name }}</span>
              <div class="ml-auto flex gap-2">
                <Button
                  @click="$emit('duplicate', index)"
                  variant="outline"
                  size="sm"
                >
                  <CopyIcon class="h-4 w-4" />
                </Button>
                <Button
                  @click="$emit('remove', index)"
                  variant="destructive"
                  size="sm"
                >
                  <Trash2Icon class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </template>

          <div class="step-card-content">
            <div class="form-group full-width mb-3">
              <Label>步骤名称</Label>
              <Input
                v-model="step.name"
                placeholder="例如: 初始请求, 详情页抓取"
              />
            </div>

            <div class="form-group full-width mb-3">
              <Label>爬取模式</Label>
              <Select v-model="step.mode">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="选择爬取模式..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="api">API 模式</SelectItem>
                  <SelectItem value="playwright">浏览器模式</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <component :is="fieldComponents[step.mode]" :step="step" />
          </div>
        </Card>
      </div>

      <Button @click="$emit('add')" variant="outline" size="sm" class="mt-3">
        <PlusIcon class="mr-2 h-4 w-4" /> 添加新步骤
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Step } from "@/composables/useScraperConfig";
import { CopyIcon, PlusIcon, Trash2Icon } from "@lucide/vue";
import { computed, type Component } from "vue";
import StepApiFields from "./StepApiFields.vue";
import StepPlaywrightFields from "./StepPlaywrightFields.vue";

const props = withDefaults(defineProps<{ steps: Step[] }>(), {
  steps: () => [],
});

defineEmits([
  "add",
  "remove",
  "duplicate",
  "dragstart",
  "dragover",
  "dragenter",
  "dragend",
  "drop",
]);

const fieldComponents: Record<string, Component> = {
  api: StepApiFields,
  playwright: StepPlaywrightFields,
};

const stepList = computed(() => props.steps as any[]);
</script>