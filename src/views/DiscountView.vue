<template>
  <div class="discount-view">
    <van-nav-bar title="Discounts" left-arrow @click-left="goBack" />
    <div class="discount-container">
      <h2>Special Offers</h2>
      <div class="discount-list">
        <div
          class="discount-card"
          v-for="(offer, index) in offers"
          :key="index"
        >
          <img :src="offer.image" :alt="offer.title" />
          <div class="discount-content">
            <h3>{{ offer.title }}</h3>
            <p class="original-price">{{ offer.originalPrice }}</p>
            <p class="discounted-price">{{ offer.discountedPrice }}</p>
            <p class="description">{{ offer.description }}</p>
            <van-button type="primary" @click="redeemOffer(offer.id)"
              >Redeem Now</van-button
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

const offers = ref([
  {
    id: 1,
    title: "50% Off Premium Membership",
    originalPrice: "$9.99/month",
    discountedPrice: "$4.99/month",
    description:
      "Limited time offer for new members! Get 50% off your first month.",
    image: "https://via.placeholder.com/300x200?text=Premium+Membership",
  },
  {
    id: 2,
    title: "Starter Pack Bundle",
    originalPrice: "$19.99",
    discountedPrice: "$9.99",
    description: "Get all essential Pokémon items in one bundle!",
    image: "https://via.placeholder.com/300x200?text=Starter+Pack",
  },
  {
    id: 3,
    title: "Exclusive Skin Pack",
    originalPrice: "$14.99",
    discountedPrice: "$7.49",
    description: "Customize your Pokémon with special skins!",
    image: "https://via.placeholder.com/300x200?text=Skin+Pack",
  },
  {
    id: 4,
    title: "Battle Pass Season 1",
    originalPrice: "$9.99",
    discountedPrice: "$4.99",
    description: "Unlock exclusive rewards and bonuses!",
    image: "https://via.placeholder.com/300x200?text=Battle+Pass",
  },
]);

const goBack = () => {
  router.go(-1);
};

const redeemOffer = (offerId: number) => {
  console.log(`Redeeming offer ${offerId}`);
  alert(`Redeemed Pokémon discount offer #${offerId}!`);
};
</script>

<style scoped>
.discount-view {
  padding: 16px;
}

.discount-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.discount-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.discount-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
}

.discount-card img {
  width: 300px;
  height: 200px;
  object-fit: cover;
  flex-shrink: 0;
}

.discount-content {
  flex: 1;
  padding: 16px;
}

.discount-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.discount-content .original-price {
  color: #999;
  font-size: 14px;
  text-decoration: line-through;
  margin: 0 0 4px 0;
}

.discount-content .discounted-price {
  color: #ff5053;
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.discount-content .description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.van-button {
  width: 100%;
}
</style>
