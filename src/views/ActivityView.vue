<template>
  <div class="activity-view">
    <van-nav-bar title="Activities" left-arrow @click-left="goBack" />
    <div class="activity-container">
      <h2>Current Activities</h2>
      <div class="activity-list">
        <div
          class="activity-card"
          v-for="(activity, index) in activities"
          :key="index"
        >
          <img :src="activity.image" :alt="activity.title" />
          <div class="activity-content">
            <h3>{{ activity.title }}</h3>
            <p class="date-range">
              {{ activity.startDate }} - {{ activity.endDate }}
            </p>
            <p class="description">{{ activity.description }}</p>
            <van-button type="primary" @click="joinActivity(activity.id)"
              >Join Now</van-button
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

const activities = ref([
  {
    id: 1,
    title: "Community Pokémon Hunt",
    startDate: "2023-10-01",
    endDate: "2023-10-31",
    description:
      "Join our monthly community event to catch rare Pokémon together!",
    image: "https://via.placeholder.com/300x200?text=Community+Hunt",
  },
  {
    id: 2,
    title: "Double XP Weekend",
    startDate: "2023-10-15",
    endDate: "2023-10-17",
    description:
      "Earn double experience points for all games played during the weekend!",
    image: "https://via.placeholder.com/300x200?text=Double+XP",
  },
  {
    id: 3,
    title: "New Pokémon Tournament",
    startDate: "2023-10-20",
    endDate: "2023-10-22",
    description: "Compete in our 3-day tournament with special prizes!",
    image: "https://via.placeholder.com/300x200?text=Tournament",
  },
  {
    id: 4,
    title: "Exclusive Item Giveaway",
    startDate: "2023-10-25",
    endDate: "2023-10-28",
    description: "Log in daily to receive exclusive in-game items!",
    image: "https://via.placeholder.com/300x200?text=Giveaway",
  },
]);

const goBack = () => {
  router.go(-1);
};

const joinActivity = (activityId: number) => {
  console.log(`Joining activity ${activityId}`);
  alert(`Joined Pokémon activity #${activityId}!`);
};
</script>

<style scoped>
.activity-view {
  padding: 16px;
}

.activity-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.activity-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
}

.activity-card img {
  width: 300px;
  height: 200px;
  object-fit: cover;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  padding: 16px;
}

.activity-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.activity-content .date-range {
  color: #999;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.activity-content .description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.van-button {
  width: 100%;
}
</style>
