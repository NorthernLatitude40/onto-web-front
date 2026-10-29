<script setup lang="ts">
import { type HTMLAttributes } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}>()
</script>

<template>
  <span
    class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
    :class="[
      variant === 'default' && 'bg-gray-100 text-gray-800',
      variant === 'secondary' && 'bg-gray-50 text-gray-600',
      variant === 'destructive' && 'bg-red-100 text-red-800',
      variant === 'outline' && 'border border-gray-200 bg-white text-gray-700'
    ]"
  >
    <slot />
  </span>
</template>