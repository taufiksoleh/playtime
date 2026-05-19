<script setup>
import { ref } from 'vue'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'

const phase = ref('setup')
const players = ref([])

function onStart(payload) {
  players.value = payload.players
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
    <GameScreen v-else :players="players" @exit="onExit" />
  </main>
</template>
