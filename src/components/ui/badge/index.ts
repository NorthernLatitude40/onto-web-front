import { type HTMLAttributes } from 'vue'
import BadgeRoot from './Badge.vue'

export const Badge = BadgeRoot
export default Badge

export interface BadgeProps extends HTMLAttributes {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}