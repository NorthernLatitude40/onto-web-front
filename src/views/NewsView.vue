<template>
  <div class="news-view">
    <van-nav-bar title="News" left-arrow @click-left="goBack" />
    <div class="news-container">
      <h2>Latest Pokémon News</h2>
      <div class="news-list">
        <div
          class="news-card"
          v-for="(article, index) in articles"
          :key="index"
        >
          <img :src="article.image" :alt="article.title" />
          <div class="news-content">
            <h3>{{ article.title }}</h3>
            <p class="date">{{ article.date }}</p>
            <p class="summary">{{ article.summary }}</p>
            <van-button type="primary" @click="readArticle(article.id)"
              >Read More</van-button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button as VanButton } from "vant";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const articles = ref([
  {
    id: 1,
    title: "Pokémon Scarlet and Violet: The Hidden Treasure of Area Zero",
    date: "2023-09-15",
    summary:
      "The latest DLC expansion for Pokémon Scarlet and Violet brings new regions, Pokémon, and story content!",
    image: "https://via.placeholder.com/300x200?text=Scarlet+Violet+DLC",
  },
  {
    id: 2,
    title: "Pokémon GO Fest 2023 Recap",
    date: "2023-08-20",
    summary:
      "Thousands of trainers gathered worldwide for the annual Pokémon GO Fest event!",
    image: "https://via.placeholder.com/300x200?text=GO+Fest+2023",
  },
  {
    id: 3,
    title: "New Pokémon Revealed for Pokémon UNITE",
    date: "2023-07-10",
    summary: "Garchomp and Lucario join the battle in the latest update!",
    image: "https://via.placeholder.com/300x200?text=UNITE+Update",
  },
  {
    id: 4,
    title: "Pokémon Sleep Launch Announcement",
    date: "2023-07-05",
    summary: "The new sleep tracking app is now available worldwide!",
    image: "https://via.placeholder.com/300x200?text=Sleep+Launch",
  },
]);

const goBack = () => {
  router.go(-1);
};

const readArticle = (articleId: number) => {
  console.log(`Reading article ${articleId}`);
  alert(`Reading Pokémon news article #${articleId}!`);
};
</script>

<style scoped>
.news-view {
  padding: 16px;
}

.news-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.news-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
}

.news-card img {
  width: 300px;
  height: 200px;
  object-fit: cover;
  flex-shrink: 0;
}

.news-content {
  flex: 1;
  padding: 16px;
}

.news-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.news-content .date {
  color: #999;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.news-content .summary {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.van-button {
  width: 100%;
}
</style>
