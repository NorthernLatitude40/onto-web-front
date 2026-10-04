<template>
  <div class="games-view">
    <van-nav-bar title="Games" left-arrow @click-left="goBack" />
    <div class="games-container">
      <h2>Popular Games</h2>
      <div class="game-grid">
        <div class="game-card" v-for="(game, index) in games" :key="index">
          <img :src="game.image" :alt="game.title" />
          <h3>{{ game.title }}</h3>
          <p>{{ game.description }}</p>
          <van-button type="primary" @click="playGame(game.id)"
            >Play Now</van-button
          >
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

const games = ref([
  {
    id: 1,
    title: "Pokémon GO",
    description: "Catch Pokémon in the real world with augmented reality!",
    image: "https://via.placeholder.com/200x150?text=Pok%C3%A9mon+GO",
  },
  {
    id: 2,
    title: "Pokémon Masters EX",
    description: "Battle with your favorite Pokémon trainers!",
    image: "https://via.placeholder.com/200x150?text=Pok%C3%A9mon+Masters",
  },
  {
    id: 3,
    title: "Pokémon Sleep",
    description: "Track your sleep and catch Pokémon while you dream!",
    image: "https://via.placeholder.com/200x150?text=Pok%C3%A9mon+Sleep",
  },
  {
    id: 4,
    title: "Pokémon UNITE",
    description: "5v5 team strategy battle game!",
    image: "https://via.placeholder.com/200x150?text=Pok%C3%A9mon+UNITE",
  },
]);

const goBack = () => {
  router.go(-1);
};

const playGame = (gameId: number) => {
  console.log(`Playing game ${gameId}`);
  // In a real app, this would navigate to the actual game
  alert(`Starting Pokémon game #${gameId}!`);
};
</script>

<style scoped>
.games-view {
  padding: 16px;
}

.games-container {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

.game-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.game-card:hover {
  transform: translateY(-4px);
}

.game-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.game-card h3 {
  margin: 12px 0 8px 0;
  padding: 0 16px;
  font-size: 18px;
}

.game-card p {
  padding: 0 16px 16px 16px;
  color: #666;
  font-size: 14px;
}

.van-button {
  margin: 0 16px 16px;
  width: calc(100% - 32px);
}
</style>
