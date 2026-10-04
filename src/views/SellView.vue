<template>
  <div class="sell-view">
    <van-nav-bar title="Sell Items" left-arrow @click-left="goBack" />
    <div class="sell-container">
      <h2>Sell Your Pokémon Items</h2>
      <p class="subtitle">List your items for sale and earn credits!</p>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="formData.name"
            name="name"
            label="Item Name"
            placeholder="Enter item name"
            :rules="[{ required: true, message: 'Please enter item name' }]"
          />

          <van-field
            v-model="formData.description"
            name="description"
            label="Description"
            type="textarea"
            placeholder="Enter item description"
            :rules="[{ required: true, message: 'Please enter description' }]"
          />

          <van-field
            v-model="formData.price"
            name="price"
            label="Price (credits)"
            type="number"
            placeholder="Enter price"
            :rules="[{ required: true, message: 'Please enter price' }]"
          />

          <van-field
            v-model="formData.category"
            name="category"
            label="Category"
            placeholder="Select category"
            :rules="[{ required: true, message: 'Please select category' }]"
          >
            <template #input>
              <van-dropdown-menu>
                <van-dropdown-item
                  v-model="formData.category"
                  :options="categoryOptions"
                />
              </van-dropdown-menu>
            </template>
          </van-field>
        </van-cell-group>

        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit">
            List Item
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button as VanButton, Field as VanField, Form as VanForm } from "vant";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const formData = ref({
  name: "",
  description: "",
  price: "",
  category: "",
});

const categoryOptions = ref([
  { text: "Pokémon Cards", value: "cards" },
  { text: "Merchandise", value: "merchandise" },
  { text: "Account Items", value: "account" },
  { text: "Other", value: "other" },
]);

const goBack = () => {
  router.go(-1);
};

const onSubmit = () => {
  console.log("Submitting form:", formData.value);
  alert(
    `Item "${formData.value.name}" listed for sale at ${formData.value.price} credits!`,
  );
  // Reset form after submission
  formData.value = { name: "", description: "", price: "", category: "" };
};
</script>

<style scoped>
.sell-view {
  padding: 16px;
}

.sell-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 16px;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
}

.van-form {
  background: white;
  border-radius: 8px;
  padding: 16px;
}
</style>
