<template>
  <div class="home-page">
    <!-- Header -->
    <header class="home-header">
      <div class="logo-section">
        <img src="../assets/logo.svg" alt="Logo" class="logo" />
        <h1>Pokémon Marketplace</h1>
        <p>Top Games Gold & Items Seller Site</p>
      </div>

      <!-- Search and User Actions -->
      <div class="header-actions">
        <VanSearch
          v-model="searchValue"
          placeholder="Input order-number"
          shape="round"
          class="search-bar"
        />
        <div class="user-actions">
          <VanDropdownMenu>
            <VanDropdownItem v-model="language" :options="languageOptions" />
          </VanDropdownMenu>
          <VanDropdownMenu>
            <VanDropdownItem v-model="currency" :options="currencyOptions" />
          </VanDropdownMenu>
          <VanButton
            type="primary"
            size="small"
            class="login-btn"
            @click="showLogin = true"
            >Log in</VanButton
          >
          <VanButton
            type="success"
            size="small"
            class="signup-btn"
            @click="showRegister = true"
            >Sign up</VanButton
          >
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="main-nav">
      <VanTabs v-model:active="activeTab" color="#1989fa">
        <VanTab title="CHOOSE GAME" to="/games">
          <VanIcon name="apps-o" /> CHOOSE GAME
        </VanTab>
        <VanTab title="News" to="/news">
          <VanIcon name="newspaper-o" /> News
        </VanTab>
        <VanTab title="Help Center" to="/help">
          <VanIcon name="question-o" /> Help Center
        </VanTab>
        <VanTab title="Games Activity" to="/activity">
          <VanIcon name="video-o" /> Games Activity
        </VanTab>
        <VanTab title="Member Discount" to="/discount">
          <VanIcon name="balance-list-o" /> Member Discount
        </VanTab>
        <VanTab title="Sell To Us" to="/sell">
          <VanIcon name="cart-o" /> Sell To Us
        </VanTab>
        <VanTab title="Contact Us" to="/contact">
          <VanIcon name="phone-o" /> Contact Us
        </VanTab>
      </VanTabs>
    </nav>

    <!-- Hero Banner -->
    <section class="hero-banner">
      <div class="banner-content">
        <div class="pokemon-icons">
          <img
            src="https://via.placeholder.com/80x80/4169E1/FFFFFF?text=Pikachu"
            alt="Pokémon Icon 1"
          />
          <img
            src="https://via.placeholder.com/80x80/F57C00/FFFFFF?text=Charmander"
            alt="Pokémon Icon 2"
          />
          <img
            src="https://via.placeholder.com/80x80/9C27B0/FFFFFF?text=Squirtle"
            alt="Pokémon Icon 3"
          />
          <img
            src="https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=Bulbasaur"
            alt="Pokémon Icon 4"
          />
        </div>
        <h2>POKÉMON Z-A HOT SALE</h2>
        <p class="banner-subtitle">BUY POKÉMON & ITEMS</p>
        <p class="banner-description">
          Exclusive November deals on Pokémon & Items
        </p>
      </div>
      <img
        src="https://via.placeholder.com/300x400/E91E63/FFFFFF?text=Pokémon+Girl"
        alt="Pokémon Character"
        class="hero-image"
      />
    </section>

    <!-- Hot Games Section -->
    <section class="hot-games">
      <h2>Hot Game</h2>
      <VanButton type="primary" to="/games" class="view-more-btn"
        >View More
      </VanButton>
      <div class="games-grid">
        <!-- Game cards will be added here -->
      </div>
    </section>

    <!-- Login Modal -->
    <VanDialog v-model:show="showLogin" title="Login" close-on-click-overlay>
      <VanForm @submit="onLogin">
        <VanField
          v-model="loginForm.username"
          name="username"
          label="Username"
          placeholder="Username"
          :rules="[{ required: true, message: 'Please enter username' }]"
        />
        <VanField
          v-model="loginForm.password"
          type="password"
          name="password"
          label="Password"
          placeholder="Password"
          :rules="[{ required: true, message: 'Please enter password' }]"
        />
        <div style="margin: 16px">
          <VanButton round block native-type="submit" @click="onLogin"
            >Login</VanButton
          >
        </div>
      </VanForm>
    </VanDialog>

    <!-- Register Modal -->
    <VanDialog
      v-model:show="showRegister"
      title="Register"
      close-on-click-overlay
    >
      <VanForm @submit="onRegister">
        <VanField
          v-model="registerForm.username"
          name="username"
          label="Username"
          placeholder="Username"
          :rules="[{ required: true, message: 'Please enter username' }]"
        />
        <VanField
          v-model="registerForm.email"
          type="email"
          name="email"
          label="Email"
          placeholder="Email"
          :rules="[
            { required: true, message: 'Please enter email' },
            {
              pattern: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
              message: 'Please enter valid email',
            },
          ]"
        />
        <VanField
          v-model="registerForm.password"
          type="password"
          name="password"
          label="Password"
          placeholder="Password"
          :rules="[
            { required: true, message: 'Please enter password' },
            {
              validator: (value) =>
                value.length >= 6 || 'Password must be at least 6 characters',
            },
          ]"
        />
        <VanField
          v-model="registerForm.confirmPassword"
          type="password"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm Password"
          :rules="[
            { required: true, message: 'Please confirm password' },
            { validator: validatePasswordMatch },
          ]"
        />
        <div style="margin: 16px">
          <VanButton
            round
            block
            type="success"
            native-type="submit"
            >Register</VanButton
          >
        </div>
      </VanForm>
    </VanDialog>

    <!-- Live Chat Button -->
    <VanFloatingBubble axis="xy" icon="chat-o" />
  </div>
</template>

<script setup lang="ts">
import {
  Button as VanButton,
  Dialog as VanDialog,
  DropdownItem as VanDropdownItem,
  DropdownMenu as VanDropdownMenu,
  Field as VanField,
  FloatingBubble as VanFloatingBubble,
  Form as VanForm,
  Icon as VanIcon,
  Search as VanSearch,
  Tab as VanTab,
  Tabs as VanTabs,
} from "vant";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Search functionality
const searchValue = ref("");

// Language and currency dropdowns
const language = ref("en");
const currency = ref("USD");

const languageOptions = [
  { text: "English", value: "en" },
  { text: "简体中文", value: "zh-CN" },
];

const currencyOptions = [
  { text: "$ USD", value: "USD" },
  { text: "€ EUR", value: "EUR" },
  { text: "£ GBP", value: "GBP" },
];

// Tab navigation
const activeTab = ref(0);

// Login modal
const showLogin = ref(false);
const loginForm = ref({
  username: "",
  password: "",
});

const onLogin = () => {
  // API call for login
  console.log("Login form:", loginForm.value);
  // In a real app, you would call your authentication API here
  alert("Login functionality would be implemented here");
};

// Register modal
const showRegister = ref(false);
const registerForm = ref({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const validatePasswordMatch = (value: string) => {
  return value === registerForm.value.password || "Passwords do not match";
};

const onRegister = async () => {
  // API call for registration
  const { username, email, password } = registerForm.value;

  try {
    const response = await fetch("http://localhost:8000/api/v1/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert("Registration successful!");
      showRegister.value = false;
      registerForm.value = {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      };
    } else {
      alert(`Registration failed: ${data.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Network error during registration");
  }
};
</script>

<style scoped>
.home-page {
  font-family: "Arial", sans-serif;
}

.home-header {
  background-color: #f8f9fa;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo {
  height: 40px;
  width: auto;
}

.home-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.home-header p {
  font-size: 14px;
  color: #666;
  margin: 5px 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-bar {
  width: 300px;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-btn,
.signup-btn {
  font-size: 14px;
  padding: 8px 16px;
  color: #333 !important;
}

.main-nav {
  background-color: #2c3e50;
  color: white;
  padding: 0 40px;
}

.van-tabs {
  --van-tabs-nav-background: #2c3e50;
  --van-tabs-default-color: #ccc;
  --van-tabs-line-height: 46px;
}

.hero-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-banner::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="%23FFD700" opacity="0.6"/><circle cx="80" cy="40" r="1.5" fill="%23FFD700" opacity="0.6"/><circle cx="40" cy="80" r="1" fill="%23FFD700" opacity="0.6"/></svg>')
    repeat;
  pointer-events: none;
}

.banner-content {
  position: relative;
  z-index: 1;
}

.pokemon-icons {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.pokemon-icons img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 3px solid white;
}

.hero-banner h2 {
  font-size: 48px;
  margin: 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.banner-subtitle {
  font-size: 24px;
  margin: 5px 0;
  opacity: 0.9;
}

.banner-description {
  font-size: 16px;
  opacity: 0.8;
}

.hero-image {
  width: 300px;
  height: auto;
  border-radius: 20px;
}

.hot-games {
  padding: 40px;
  background-color: #f5f5f5;
}

.hot-games h2 {
  font-size: 36px;
  color: #333;
  margin-bottom: 20px;
}

.view-more-btn {
  float: right;
  margin-bottom: 20px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
</style>
