<script setup>
import { computed } from 'vue'
import { playerColor, playerBg, playerInitial } from '../composables/usePlayerColors.js'

const props = defineProps({
  name: { type: String, required: true },
  index: { type: Number, required: true },
  size: { type: String, default: '36px' },
})

const color = computed(() => playerColor(props.index))
const bg = computed(() => playerBg(props.index))
const initial = computed(() => playerInitial(props.name))
</script>

<template>
  <div
    class="avatar"
    :style="{
      width: size,
      height: size,
      background: bg,
      color: color,
      borderColor: color,
      fontSize: `calc(${size} * 0.42)`,
    }"
  >
    {{ initial }}
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  border: 2px solid;
  display: grid;
  place-items: center;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
}
</style>
