<template>
  <div
    class="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50 shadow-xl rounded-lg overflow-hidden border border-gray-200"
  >
    <!-- 顶部标题栏 -->
    <div
      class="bg-blue-600 text-white px-6 py-4 flex items-center justify-between"
    >
      <h1 class="text-lg font-bold">🚐 Get Lost NZ - 房车租赁智能助手</h1>
      <span class="text-xs bg-blue-500 px-2 py-1 rounded-full"
        >RAG + SQL Agent</span
      >
    </div>

    <!-- 聊天消息展示区域 -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="chatContainer">
      <div v-if="messages.length === 0" class="text-center text-gray-400 py-12">
        <p class="text-base">你好！我是你的新西兰房车租赁智能向导。</p>
        <p class="text-sm mt-1">
          你可以问我关于车辆配置、租车攻略、或者查询特定日期的价格和库存！
        </p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']"
      >
        <div
          :class="[
            'max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm',
            msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none',
          ]"
        >
          <!-- 消息正文 -->
          <div class="whitespace-pre-wrap leading-relaxed">
            {{ msg.content }}
          </div>

          <!-- 如果有 RAG 检索来源，展示引用标签 -->
          <div
            v-if="msg.sources && msg.sources.length > 0"
            class="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500"
          >
            <span class="font-semibold text-gray-600">📚 参考来源：</span>
            <ul class="mt-1 space-y-1">
              <li
                v-for="(src, sIndex) in msg.sources"
                :key="sIndex"
                class="truncate"
              >
                <a
                  :href="src.source_url"
                  target="_blank"
                  class="text-blue-500 hover:underline"
                >
                  {{ src.title }} (相关度:
                  {{ (src.similarity * 100).toFixed(0) }}%)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 加载状态提示 -->
      <div v-if="loading" class="flex justify-start">
        <div
          class="bg-white text-gray-500 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center space-x-2"
        >
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            class="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"
          ></div>
          <div
            class="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"
          ></div>
          <span class="ml-1">AI 正在查询知识库与库存...</span>
        </div>
      </div>
    </div>

    <!-- 底部输入框区域 -->
    <div class="bg-white border-t border-gray-200 p-4">
      <form @submit.prevent="sendMessage" class="flex items-center space-x-3">
        <input
          v-model="userInput"
          type="text"
          placeholder="例如：2-Berth 房车在 2026-11-01 到 2026-11-07 还有车吗？"
          class="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="loading"
        />
        <button
          type="submit"
          :disabled="loading || !userInput.trim()"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from "vue";

const userInput = ref("");
const messages = ref([]);
const loading = ref(false);
const chatContainer = ref(null);

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  const query = userInput.value.trim();
  if (!query || loading.value) return;

  // 1. 添加用户消息
  messages.value.push({ role: "user", content: query });
  userInput.value = "";
  await scrollToBottom();

  loading.value = true;

  // 2. 先创建一个空的助手消息，后续通过流式更新它的 content
  const assistantMsg = {
    role: "assistant",
    content: "",
    sources: [],
  };
  messages.value.push(assistantMsg);

  try {
    // 使用原生的 fetch 代替 axios 以支持 Stream 响应
    const response = await fetch("http://localhost:8000/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: query,
        session_id: "string",
      }),
    });

    if (!response.ok) {
      throw new Error("网络请求失败");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // 按行处理后端推送的数据流 (兼容你的 message{"type": ...} 格式)
      const lines = buffer.split("\n");
      buffer = lines.pop(); // 保留最后未完成的残缺行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 如果后端返回的是类似 message{...} 或者是标准 SSE 的 data: {...}
        // 这里根据你的日志格式兼容处理：
        let jsonStr = trimmed;
        if (trimmed.startsWith("message")) {
          jsonStr = trimmed.replace(/^message/, "").trim();
        } else if (trimmed.startsWith("data:")) {
          jsonStr = trimmed.replace(/^data:/, "").trim();
        }

        try {
          const data = JSON.parse(jsonStr);
          
          // 处理不同类型的流消息
          if (data.type === "status") {
            // 可选：如果想在界面上显示“OntoAgent 收到请求...”等状态，可以更新
            console.log(data.content);
          } else if (data.type === "token") {
            // 解析 token 中的 JSON（根据你的日志：{"reply": "...", "parsedData": null}）
            const payload = JSON.parse(data.content);
            if (payload.reply) {
              assistantMsg.content += payload.reply;
              await scrollToBottom();
            }
          }
        } catch (e) {
          // 如果不是纯 JSON，可能是一般的文本流，直接拼接
          assistantMsg.content += trimmed;
          await scrollToBottom();
        }
      }
    }
  } catch (error) {
    console.error(error);
    assistantMsg.content = "抱歉，系统处理您的请求时遇到了网络或后端错误，请稍后重试。";
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};
</script>
