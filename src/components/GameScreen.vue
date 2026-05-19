<script setup>
import { computed, onMounted, watch } from 'vue'
import { useGameTimer, formatTime, beep } from '../composables/useGameTimer.js'

const props = defineProps({
  players: { type: Array, required: true },
  resetOnNext: { type: Boolean, default: true },
})
const emit = defineEmits(['exit'])

const timer = useGameTimer({
  onTimeout: () => {
    beep()
    timer.next()
  },
})

onMounted(() => {
  timer.loadPlayers(props.players, { resetOnNext: props.resetOnNext })
})

watch(
  () => [props.players, props.resetOnNext],
  ([list, ron]) => timer.loadPlayers(list, { resetOnNext: ron }),
  { deep: true },
)

const display = computed(() => formatTime(timer.remainingMs.value))
const pct = computed(() => {
  const total = (timer.currentPlayer.value?.seconds ?? 0) * 1000
  if (!total) return 0
  return Math.max(0, Math.min(100, (timer.remainingMs.value / total) * 100))
})
const lowTime = computed(() => timer.remainingMs.value > 0 && timer.remainingMs.value <= 5000)

function upcomingTime(offset) {
  const n = timer.players.value.length
  if (n === 0) return 0
  const idx = (timer.currentIndex.value + offset + 1) % n
  if (timer.resetOnNext.value) {
    return (timer.players.value[idx]?.seconds ?? 0) * 1000
  }
  return timer.banks.value[idx] ?? 0
}

function confirmReset() {
  if (confirm('Reset the game and return to setup?')) {
    timer.resetGame()
    emit('exit')
  }
}
</script>

<template>
  <section class="panel game">
    <header class="head">
      <div>
        <div class="label">
          Current turn
          <span class="mode-badge">{{ timer.resetOnNext.value ? 'Per-turn' : 'Chess clock' }}</span>
        </div>
        <div class="player-name">{{ timer.currentPlayer.value?.name ?? '—' }}</div>
      </div>
      <div class="turn-index">{{ timer.currentIndex.value + 1 }} / {{ timer.players.value.length }}</div>
    </header>

    <div class="clock" :class="{ low: lowTime, paused: !timer.running.value && timer.remainingMs.value > 0 }">
      {{ display }}
    </div>

    <div class="bar"><div class="bar-fill" :style="{ width: pct + '%' }"></div></div>

    <div class="controls">
      <button
        class="ghost"
        @click="timer.running.value ? timer.pause() : timer.resume()"
        :disabled="timer.remainingMs.value <= 0"
      >
        {{ timer.running.value ? 'Pause' : 'Resume' }}
      </button>
      <button class="ghost" @click="timer.resetTurn()">Reset turn</button>
      <button class="primary big" @click="timer.next()">Next →</button>
    </div>

    <div v-if="timer.upcoming.value.length" class="upcoming">
      <div class="label">Up next</div>
      <ol>
        <li v-for="(p, i) in timer.upcoming.value" :key="i">
          <span class="num">{{ i + 1 }}</span>
          <span class="name">{{ p.name }}</span>
          <span class="time">{{ formatTime(upcomingTime(i)) }}</span>
        </li>
      </ol>
    </div>

    <footer class="foot">
      <button class="danger" @click="confirmReset">Reset game</button>
    </footer>
  </section>
</template>

<style scoped>
.game { display: flex; flex-direction: column; gap: 18px; }
.head { display: flex; justify-content: space-between; align-items: flex-end; }
.label { color: var(--muted); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
.mode-badge {
  text-transform: none;
  letter-spacing: 0;
  font-size: 11px;
  background: var(--panel-2);
  color: var(--text);
  padding: 2px 8px;
  border-radius: 999px;
}
.player-name { font-size: 30px; font-weight: 700; margin-top: 2px; }
.turn-index { color: var(--muted); font-variant-numeric: tabular-nums; }

.clock {
  text-align: center;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: clamp(72px, 18vw, 160px);
  line-height: 1;
  padding: 28px 0 10px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  transition: color 0.2s ease;
}
.clock.low { color: var(--danger); animation: pulse 0.8s ease-in-out infinite; }
.clock.paused { color: var(--warn); }
@keyframes pulse { 50% { opacity: 0.55; } }

.bar { height: 10px; background: #0b1220; border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-strong)); transition: width 0.15s linear; }

.controls { display: grid; grid-template-columns: 1fr 1fr 1.6fr; gap: 10px; }
.controls .big { padding: 18px; font-size: 18px; }

.upcoming ol { list-style: none; padding: 0; margin: 8px 0 0; display: flex; flex-direction: column; gap: 6px; }
.upcoming li {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  background: #0b1220;
  border: 1px solid var(--panel-2);
  padding: 8px 12px;
  border-radius: 8px;
}
.upcoming .num { color: var(--muted); }
.upcoming .time { color: var(--muted); font-variant-numeric: tabular-nums; }

.foot { display: flex; justify-content: flex-end; }

@media (max-width: 520px) {
  .controls { grid-template-columns: 1fr 1fr; }
  .controls .big { grid-column: 1 / -1; }
}
</style>
