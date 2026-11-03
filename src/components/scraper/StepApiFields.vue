<template>
  <div>
    <div class="form-group full-width mb-3">
      <Label>请求 URL</Label>
      <Input
        v-model="step.target_url"
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
        :rows="4"
      />
    </div>

    <div class="form-group full-width mb-3">
      <Label>Headers (JSON)</Label>
      <Textarea
        v-model="step.headers_json"
        placeholder='{"Content-Type": "application/json"}'
        :rows="4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

defineProps<{ step: any }>();
</script>