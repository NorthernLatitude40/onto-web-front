<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
    <!-- 1. 展開後的聊天窗口 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-y-4"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 translate-y-4"
    >
      <div
        v-if="isOpen"
        class="w-[380px] h-[560px] mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
      >
        <!-- 窗口頂部 Header -->
        <div
          class="bg-blue-600 text-white px-5 py-4 flex items-center justify-between shadow-md"
        >
          <div class="flex items-center space-x-2">
            <span class="text-xl">🚐</span>
            <div>
              <h3 class="font-bold text-sm leading-tight">
                Get Lost NZ 智能助手
              </h3>
              <p class="text-[11px] text-blue-100">為您答疑房車配置與預訂</p>
            </div>
          </div>
          <!-- 關閉按鈕 -->
          <button
            @click="toggleChat"
            class="text-blue-100 hover:text-white hover:bg-blue-700/50 p-1.5 rounded-lg transition"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- 消息展示區 -->
        <div
          class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50"
          ref="chatContainer"
        >
          <!-- 預設歡迎語 -->
          <div
            v-if="messages.length === 0"
            class="text-center text-gray-400 py-8 px-4"
          >
            <div class="text-3xl mb-2">👋</div>
            <p class="text-xs font-medium text-gray-600">
              Kia Ora! 我是 Get Lost NZ 的 AI 房車專家。
            </p>
            <p class="text-[11px] mt-1 text-gray-400">
              可以問我關於 2026 新款 Toyota Hiace
              的配置、營地指南，或直接查特定日期的價格與庫存！
            </p>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            ]"
          >
            <div
              :class="[
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs',
              ]"
            >
              <!-- 消息內容 -->
              <div class="whitespace-pre-wrap">{{ msg.content }}</div>

              <!-- 參考來源 (Sources) -->
              <div
                v-if="msg.sources && msg.sources.length > 0"
                class="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500"
              >
                <span class="font-semibold text-gray-600">📚 知識庫參考：</span>
                <ul class="mt-1 space-y-0.5">
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
                      {{ src.title }} (相似度:
                      {{ (src.similarity * 100).toFixed(0) }}%)
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Loading 加載狀態（支持顯示後端實時傳來的 status） -->
          <div v-if="loading" class="flex justify-start">
            <div
              class="bg-white border border-gray-100 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-gray-500 shadow-sm flex items-center space-x-1.5"
            >
              <div
                class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
              ></div>
              <div
                class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"
              ></div>
              <div
                class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"
              ></div>
              <span class="ml-1 text-[11px]">{{ statusText }}</span>
            </div>
          </div>
        </div>

        <!-- 底部輸入框 -->
        <div class="p-3 bg-white border-t border-gray-100">
          <form
            @submit.prevent="sendMessage"
            class="flex items-center space-x-2"
          >
            <input
              v-model="userInput"
              type="text"
              placeholder="輸入問題或查詢價格..."
              class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50/50"
              :disabled="loading || isStreaming"
            />
            <button
              type="submit"
              :disabled="loading || isStreaming || !userInput.trim()"
              class="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- 2. 右下角懸浮圓球按鈕 -->
    <button
      @click="toggleChat"
      class="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition duration-200 flex items-center justify-center group"
      aria-label="打開客服聊天"
    >
      <span v-if="!isOpen" class="text-2xl leading-none">💬</span>
      <svg
        v-else
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { nextTick, ref } from "vue";
import { env } from "@/config/env";

const isOpen = ref(false);
const userInput = ref("");
const messages = ref([]);
const loading = ref(false);
const isStreaming = ref(false);
const statusText = ref("正在檢索知識庫與數據庫...");
const chatContainer = ref(null);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  const query = userInput.value.trim();
  if (!query || loading.value || isStreaming.value) return;

  // 1. 推入用戶消息
  messages.value.push({ role: "user", content: query });
  userInput.value = "";

  // 2. 占位助手消息
  const assistantMsgIndex = messages.value.length;
  messages.value.push({
    role: "assistant",
    content: "",
    sources: [],
  });

  loading.value = true;
  isStreaming.value = true;
  statusText.value = "OntoAgent 收到請求，正在啟動推理工作流...";
  await scrollToBottom();

  try {
    // 3. 使用原生 fetch 請求流式接口
    const response = await fetch(`${env.API_BASE_URL}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: query,
        top_k: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();

          if (dataStr === "[DONE]") {
            break;
          }

          try {
            const data = JSON.parse(dataStr);

            // 處理後端狀態提示
            if (data.type === "status") {
              statusText.value = data.content || "正在生成回答...";
              continue;
            }

            // 處理結束標記
            if (data.type === "done") {
              break;
            }

            // 處理內容 token
            if (data.type === "token" && data.content) {
              // 收到第一個 token 時，隱藏 loading 狀態框，正式開始顯示文本
              loading.value = false;

              let textToDisplay = data.content;
              try {
                // 如果 content 內部包裹了 JSON (如 {"reply": "...", "parsedData": null})
                const parsedContent = JSON.parse(data.content);
                if (parsedContent.reply) {
                  textToDisplay = parsedContent.reply;
                }
              } catch (e) {
                // 不是 JSON 則直接作爲普通文本處理
              }

              messages.value[assistantMsgIndex].content += textToDisplay;
              scrollToBottom();
            }
          } catch (e) {
            console.error("解析流數據 JSON 出錯:", e, line);
          }
        }
      }
    }
  } catch (error) {
    console.error("流式請求失敗:", error);
    messages.value[assistantMsgIndex].content =
      "抱歉，無法連接到 AI 響應服務，請檢查網絡或後端接口。";
  } finally {
    loading.value = false;
    isStreaming.value = false;
    await scrollToBottom();
  }
};
</script>
