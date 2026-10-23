<script setup lang="ts">
import axios from "@/service/request"; // 引入你封装好的 Axios
import { useCounterStore } from "@/stores/counter";
import { onMounted, ref } from "vue";

const counterStore = useCounterStore();

// 状态定义
const items = ref<any[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");

// 异步从 FastAPI 后端拉取真实聚合数据
const fetchAggregatedData = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    // 调用后端接口
    const res: any = await axios.get("/api/v1/scraper/aggregated-items");

    // 根据 FastAPI 返回的格式正确提取数组
    if (res.code === 200 && res.data) {
      items.value = res.data.items || [];
    } else {
      errorMessage.value = "获取数据失败";
    }
  } catch (error: any) {
    console.error("API 请求异常", error);
    errorMessage.value = "无法连接到后端聚合服务，请确保 FastAPI 已启动";
  } finally {
    isLoading.value = false;
  }
};

// 页面挂载时自动请求
onMounted(() => {
  fetchAggregatedData();
});

// 手动刷新按钮
const triggerRefresh = () => {
  counterStore.increment();
  fetchAggregatedData();
};
</script>

<template>
  <!-- 
    修改点：
    1. 移除全局的 min-w-[1280px] 与 overflow-x-auto，改用 lg:min-w-[1280px] lg:overflow-x-auto。
    2. 这样手机端（<1024px）保持正常的响应式自适应，大屏端（>=1024px）才会锁死最小宽度并允许横向滚动。
  -->
  <div
    class="min-h-screen lg:min-w-[1280px] lg:overflow-x-auto bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white"
  >
    <!-- 顶部导航栏 -->
    <header
      class="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-600/30"
        >
          🎮
        </div>
        <span class="text-xl font-bold tracking-tight text-white"
          >ItemPulse
          <span class="text-indigo-400 font-light">Virtual Market</span></span
        >
      </div>
      <div class="flex items-center gap-4">
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
        >
          <span
            class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"
          ></span>
          后端 API 联调成功
        </span>
        <button
          @click="triggerRefresh"
          :disabled="isLoading"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {{ isLoading ? "同步中..." : "同步最新行情" }}
        </button>
      </div>
    </header>

    <!-- 主体看板 -->
    <main
      class="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8 flex flex-col gap-8"
    >
      <!-- 错误提示 Banner -->
      <div
        v-if="errorMessage"
        class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center justify-between"
      >
        <span>{{ errorMessage }}</span>
        <button
          @click="fetchAggregatedData"
          class="underline text-xs hover:text-red-300"
        >
          重试
        </button>
      </div>

      <!-- 顶部 Banner 状态统计 -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div class="text-sm font-medium text-slate-400 mb-1">
            监控游戏专区
          </div>
          <div class="text-2xl font-bold text-white">Diablo IV (D4 专区)</div>
        </div>
        <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div class="text-sm font-medium text-slate-400 mb-1">
            当前聚合饰品数量
          </div>
          <div class="text-2xl font-bold text-emerald-400">
            {{ items.length }} 款
          </div>
        </div>
        <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div class="text-sm font-medium text-slate-400 mb-1">
            Pinia 全局同步计数
          </div>
          <div class="text-2xl font-bold text-indigo-400">
            {{ counterStore.count }} 次
          </div>
        </div>
      </section>

      <!-- 跨平台虚拟物品价格聚合与套利表格 -->
      <section
        class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"
      >
        <div
          class="p-6 border-b border-slate-800 flex items-center justify-between"
        >
          <div>
            <h2 class="text-lg font-bold text-white">
              跨平台虚拟物品价格聚合看板
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              实时从 Python 后端爬虫模块拉取多源异构数据
            </p>
          </div>
          <span class="text-xs text-slate-500">Status: Live API Connected</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr
                class="border-b border-slate-800 text-slate-400 bg-slate-950/40"
              >
                <th class="py-3.5 px-6 font-medium">代号</th>
                <th class="py-3.5 px-6 font-medium">游戏</th>
                <th class="py-3.5 px-6 font-medium">物品名称</th>
                <th class="py-3.5 px-6 font-medium">第三方平台价 (AOEAH)</th>
                <th class="py-3.5 px-6 font-medium">官方参考价 (Steam)</th>
                <th class="py-3.5 px-6 font-medium">价差收益率</th>
                <th class="py-3.5 px-6 font-medium text-right">策略状态</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <!-- 加载状态展示 -->
              <tr v-if="isLoading">
                <td colspan="7" class="py-12 text-center text-slate-500">
                  正在通过后端聚合管道获取实时价格...
                </td>
              </tr>
              <!-- 空数据展示 -->
              <tr v-else-if="items.length === 0">
                <td colspan="7" class="py-12 text-center text-slate-500">
                  暂无聚合数据
                </td>
              </tr>
              <!-- 正常数据循环 -->
              <tr
                v-for="item in items"
                :key="item.id"
                class="hover:bg-slate-800/40 transition"
              >
                <td class="py-4 px-6 font-mono text-xs text-indigo-400">
                  {{ item.id }}
                </td>
                <td class="py-4 px-6 text-slate-300 font-medium">
                  {{ item.game }}
                </td>
                <td class="py-4 px-6 text-white font-semibold">
                  {{ item.name }}
                </td>
                <td class="py-4 px-6 font-mono text-slate-200">
                  ¥ {{ item.platformA }}
                </td>
                <td class="py-4 px-6 font-mono text-slate-400">
                  ¥ {{ item.platformB }}
                </td>
                <td class="py-4 px-6 font-mono text-emerald-400 font-bold">
                  {{ item.profit_spread }}
                </td>
                <td class="py-4 px-6 text-right">
                  <span
                    :class="{
                      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20':
                        item.status === '套利机会',
                      'text-slate-400 bg-slate-800 border-slate-700':
                        item.status !== '套利机会',
                    }"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  >
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- 底部版权 -->
    <footer
      class="border-t border-slate-800 py-6 px-6 text-center text-xs text-slate-500"
    >
      ItemPulse Aggregator Engine &copy; 2026 — Built with Vite + Vue 3 +
      Tailwind + Pinia + Axios
    </footer>
  </div>
</template>
