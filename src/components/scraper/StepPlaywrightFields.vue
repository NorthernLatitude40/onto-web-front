<template>
  <div>
    <div class="form-group full-width mb-3">
      <Label>页面 URL</Label>
      <Input v-model="step.target_url" placeholder="https://example.com/page" />
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
        placeholder="// 返回数据的函数&#10;document.querySelector('.data').textContent"
        :rows="6"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

defineProps<{ step: any }>();
</script>
