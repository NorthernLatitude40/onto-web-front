<!-- components/StepsWorkflowTab.vue -->
<template>
  <div class="form-grid">
    <div class="form-group full-width">
      <Label>步骤流程</Label>
      <p class="step-description">
        定义多个步骤，每个步骤可以独立选择爬取模式（API 或 浏览器动态模式）
      </p>

      <!-- Draggable Step Cards -->
      <div class="steps-container">
        <Card
          v-for="(step, index) in steps"
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
              <span class="font-medium text-gray-800"
                >步骤 {{ index + 1 }}</span
              >
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
                  <SelectItem value="playwright">浏览器模式</SelectItem>
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
      <Button @click="$emit('add')" variant="outline" size="sm" class="mt-3">
        <PlusIcon class="mr-2 h-4 w-4" /> 添加新步骤
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, CopyIcon, Trash2Icon } from "@lucide/vue";

defineProps<{
  steps: any[];
}>();

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
</script>
