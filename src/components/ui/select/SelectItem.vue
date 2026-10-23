<script setup lang="ts">
import type { SelectItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { CheckIcon, Trash2Icon } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SelectItemProps & {
  class?: HTMLAttributes['class'],
  showDeleteIcon?: boolean,
  itemName?: string,
  isActive?: boolean
}>()

const delegatedProps = reactiveOmit(props, 'class', 'showDeleteIcon', 'itemName', 'isActive')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    data-slot="select-item"
    v-bind="forwardedProps"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm [&_svg:not([class*=size-])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
        props.class,
      )
    "
  >
    <span class="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
      <SelectItemIndicator>
        <slot name="indicator-icon">
          <CheckIcon class="pointer-events-none" />
        </slot>
      </SelectItemIndicator>
    </span>

    <div class="group relative flex w-full items-center">
      <SelectItemText class="flex-1">
        <slot />
      </SelectItemText>
      
      <!-- Delete Icon - shown on hover -->
      <button
        v-if="showDeleteIcon"
        type="button"
        @click.stop
        class="absolute right-0 ml-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:text-red-500 text-gray-400"
      >
        <Trash2Icon class="h-3.5 w-3.5" />
      </button>
    </div>
  </SelectItem>
</template>
