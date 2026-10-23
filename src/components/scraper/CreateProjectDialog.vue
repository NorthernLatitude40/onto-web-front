<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>新建爬虫项目/分组</DialogTitle>
        <DialogDescription>
          请输入新的爬虫项目名称。创建后可将不同的爬虫配置归类至该项目下管理。
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleCreate" class="space-y-4 py-2">
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700">项目/分组名称</label>
          <Input
            v-model="projectName"
            placeholder="例如：车辆数据爬虫"
            :disabled="isLoading"
            autofocus
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700"
            >项目描述 (可选)</label
          >
          <Input
            v-model="projectDescription"
            placeholder="例如：抓取二手车平台车辆价格与配置信息"
            :disabled="isLoading"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            @click="emit('update:open', false)"
            :disabled="isLoading"
          >
            取消
          </Button>
          <Button type="submit" :disabled="!projectName.trim() || isLoading">
            <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            确认创建
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2Icon } from "@lucide/vue";
import { ref, watch } from "vue";
// 正确引入 useScraperConfig 与 Project 类型
import { type Project, useScraperConfig } from "@/composables/useScraperConfig";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "created", newProject: Project): void;
}>();

const projectName = ref("");
const projectDescription = ref("");
const isLoading = ref(false);

// 正确从 Composable 中解构出 createProject 方法
const { createProject } = useScraperConfig();

// 當彈窗打開時，重置輸入框狀態
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      projectName.value = "";
      projectDescription.value = "";
    }
  },
);

const handleCreate = async () => {
  if (!projectName.value.trim() || isLoading.value) return;

  isLoading.value = true;
  try {
    // 調用 composable 內的 API 創建邏輯
    const createdProject = await createProject({
      name: projectName.value.trim(),
      description: projectDescription.value.trim(),
    });

    emit("created", createdProject);
    emit("update:open", false);
  } catch (error) {
    // 錯誤已在 composable 統一處理 (showError)
    console.error("創建項目失敗", error);
  } finally {
    isLoading.value = false;
  }
};
</script>
