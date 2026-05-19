<script setup>
import { ref } from 'vue'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'

const phase = ref('setup')
const players = ref([])
const resetOnNext = ref(true)

function onStart(payload) {
  players.value = payload.players
  resetOnNext.value = payload.resetOnNext ?? true
  phase.value = 'game'
}

function onExit() {
  phase.value = 'setup'
}
</script>

<template>
  <main class="app-shell">
    <div class="brand">
      <h1>🎲 Playtime</h1>
      <span class="tag">Game turn timer</span>
    </div>

    <SetupScreen v-if="phase === 'setup'" @start="onStart" />
    <GameScreen v-else :players="players" :reset-on-next="resetOnNext" @exit="onExit" />
  </main>
</template>
