<template>
  <div
    :class="[
      'border rounded-md p-3',
      variant === 'default'
        ? 'bg-background border-border'
        : variant === 'destructive'
          ? 'bg-destructive/10 border-destructive'
          : variant === 'warning'
            ? 'bg-warning/10 border-warning'
            : 'bg-success/10 border-success',
    ]"
  >
    <div class="flex items-start gap-3">
      <slot name="icon"></slot>
      <div class="flex-1">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: "default",
    validator: (value: string) =>
      ["default", "destructive", "warning", "success"].includes(value),
  },
});
</script>
