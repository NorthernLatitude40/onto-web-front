<template>
  <div class="min-h-screen bg-gray-100 text-gray-800">
    <!-- 如果你有 Router 视图，主页面正常渲染在这里 -->
    <router-view />

    <!-- 右下角悬浮 AI 小气泡组件 (常驻展示) -->
    <ChatWidget />
  </div>
</template>

<script setup>
import ChatWidget from "@/components/ChatWidget.vue";
</script>
