<template>
  <div class="contact-view">
    <van-nav-bar title="Contact Us" left-arrow @click-left="goBack" />
    <div class="contact-container">
      <h2>Get In Touch</h2>

      <div class="contact-methods">
        <div class="method-card">
          <van-icon name="chat-o" size="40" color="#1989fa" />
          <h3>Live Chat</h3>
          <p>Available 24/7 for instant support</p>
          <van-button type="primary" @click="startChat">Start Chat</van-button>
        </div>

        <div class="method-card">
          <van-icon name="phone-o" size="40" color="#1989fa" />
          <h3>Phone Support</h3>
          <p>Call us: +1 (555) 123-4567</p>
          <van-button type="primary" @click="callSupport">Call Now</van-button>
        </div>

        <div class="method-card">
          <van-icon name="envelope-o" size="40" color="#1989fa" />
          <h3>Email Support</h3>
          <p>support@pokemon.com</p>
          <van-button type="primary" @click="sendEmail">Send Email</van-button>
        </div>
      </div>

      <div class="contact-form-section">
        <h3>Contact Form</h3>
        <van-form @submit="onSubmit">
          <van-cell-group inset>
            <van-field
              v-model="formData.name"
              name="name"
              label="Your Name"
              placeholder="Enter your name"
              :rules="[{ required: true, message: 'Please enter your name' }]"
            />

            <van-field
              v-model="formData.email"
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              :rules="[{ required: true, message: 'Please enter your email' }]"
            />

            <van-field
              v-model="formData.message"
              name="message"
              label="Message"
              type="textarea"
              placeholder="Enter your message"
              :rules="[
                { required: true, message: 'Please enter your message' },
              ]"
            />
          </van-cell-group>

          <div style="margin: 16px">
            <van-button round block type="primary" native-type="submit">
              Send Message
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Button as VanButton,
  Field as VanField,
  Form as VanForm,
  Icon as VanIcon,
} from "vant";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const formData = ref({
  name: "",
  email: "",
  message: "",
});

const goBack = () => {
  router.go(-1);
};

const startChat = () => {
  alert("Live chat would open here!");
};

const callSupport = () => {
  alert("Calling support phone number...");
};

const sendEmail = () => {
  alert("Opening email client to support@pokemon.com");
};

const onSubmit = () => {
  console.log("Submitting contact form:", formData.value);
  alert(
    `Message from ${formData.value.name} sent successfully! We'll respond within 24 hours.`,
  );
  // Reset form after submission
  formData.value = { name: "", email: "", message: "" };
};
</script>

<style scoped>
.contact-view {
  padding: 16px;
}

.contact-container {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  color: #333;
}

.contact-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.method-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.method-card h3 {
  margin: 16px 0 8px 0;
}

.method-card p {
  color: #666;
  margin-bottom: 16px;
}

.contact-form-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
