<!-- components/BasicSettingsTab.vue -->
<template>
  <div class="form-grid py-4">
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

    <div class="form-group">
      <Label for="targetUrl">目标 URL</Label>
      <Input
        id="targetUrl"
        v-model="formData.target_url"
        placeholder="https://example.com/api"
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
</template>

<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 接收父組件傳入的 formData
defineProps<{
  formData: {
    name: string;
    cron_schedule: string;
    concurrency: number;
    timeout: number;
    target_url: string;
    proxy: string;
  };
}>();
</script>