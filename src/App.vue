<script setup>
import { ref } from 'vue'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ResultsScreen from './components/ResultsScreen.vue'
import LeaderboardScreen from './components/LeaderboardScreen.vue'

const phase = ref('setup')
const players = ref([])
const resetOnNext = ref(true)
const gameStats = ref([])
const gameMode = ref('per-turn')

function onStart(payload) {
  players.value = payload.players
  resetOnNext.value = payload.resetOnNext ?? true
  gameMode.value = payload.resetOnNext ? 'per-turn' : 'chess'
  gameStats.value = []
  phase.value = 'game'
}

function onEndGame(stats) {
  gameStats.value = stats
  phase.value = 'results'
}

function onPlayAgain() {
  phase.value = 'setup'
}

function onViewLeaderboard() {
  phase.value = 'leaderboard'
}

function onBackFromLeaderboard() {
  phase.value = 'setup'
}
</script>

<template>
  <main class="app-shell">
    <div class="brand">
      <h1>🎲 Playtime</h1>
      <span class="tag">Game turn timer</span>
    </div>

    <Transition name="fade-slide" mode="out-in">
      <SetupScreen
        v-if="phase === 'setup'"
        key="setup"
        @start="onStart"
        @leaderboard="onViewLeaderboard"
      />
      <GameScreen
        v-else-if="phase === 'game'"
        key="game"
        :players="players"
        :reset-on-next="resetOnNext"
        @endGame="onEndGame"
      />
      <ResultsScreen
        v-else-if="phase === 'results'"
        key="results"
        :players="players"
        :stats="gameStats"
        :mode="gameMode"
        @playAgain="onPlayAgain"
        @viewLeaderboard="onViewLeaderboard"
      />
      <LeaderboardScreen
        v-else-if="phase === 'leaderboard'"
        key="leaderboard"
        @back="onBackFromLeaderboard"
      />
    </Transition>
  </main>
</template>
