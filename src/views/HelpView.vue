<template>
  <div class="help-view">
    <van-nav-bar title="Help Center" left-arrow @click-left="goBack" />
    <div class="help-container">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">
        <div class="faq-item" v-for="(item, index) in faqItems" :key="index">
          <div class="faq-question" @click="toggleAnswer(index)">
            <span>{{ item.question }}</span>
            <van-icon
              name="arrow-down"
              :class="{ rotated: activeIndex === index }"
            />
          </div>
          <div class="faq-answer" v-show="activeIndex === index">
            {{ item.answer }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon as VanIcon } from "vant";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const activeIndex = ref<number | null>(null);

const faqItems = ref([
  {
    question: "How do I create an account?",
    answer:
      'You can create an account by clicking the "Register" button on the homepage and filling out the registration form with your email, username, and password.',
  },
  {
    question: "I forgot my password. What should I do?",
    answer:
      'Click the "Forgot Password" link on the login page and follow the instructions to reset your password via email.',
  },
  {
    question: "How do I play Pokémon games?",
    answer:
      'Once logged in, navigate to the Games section where you can find various Pokémon games. Click "Play Now" to start any game.',
  },
  {
    question: "Are there any fees for using this service?",
    answer:
      "Basic account features are free. Some premium content or special events may require in-game purchases.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach our support team by visiting the Contact page or using the live chat feature available on all pages.",
  },
]);

const goBack = () => {
  router.go(-1);
};

const toggleAnswer = (index: number) => {
  activeIndex.value = activeIndex.value === index ? null : index;
};
</script>

<style scoped>
.help-view {
  padding: 16px;
}

.help-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.faq-question {
  padding: 16px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.faq-answer {
  padding: 0 16px 16px 16px;
  color: #666;
  line-height: 1.5;
}

.van-icon {
  transition: transform 0.3s ease;
}

.rotated {
  transform: rotate(180deg);
}
</style>
