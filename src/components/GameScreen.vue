<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGameTimer, formatTime, beep } from '../composables/useGameTimer.js'
import PlayerAvatar from './PlayerAvatar.vue'

const CONFETTI_PIECES = [
  { tx: '60px',   ty: '-90px',  rot: '720deg',  delay: '0ms',   c: '#38bdf8' },
  { tx: '-70px',  ty: '-80px',  rot: '-540deg', delay: '40ms',  c: '#f59e0b' },
  { tx: '80px',   ty: '-40px',  rot: '480deg',  delay: '80ms',  c: '#10b981' },
  { tx: '-50px',  ty: '-110px', rot: '-360deg', delay: '20ms',  c: '#f43f5e' },
  { tx: '30px',   ty: '-120px', rot: '600deg',  delay: '60ms',  c: '#a78bfa' },
  { tx: '-90px',  ty: '-50px',  rot: '-480deg', delay: '100ms', c: '#fb923c' },
  { tx: '100px',  ty: '-70px',  rot: '300deg',  delay: '30ms',  c: '#38bdf8' },
  { tx: '-40px',  ty: '-130px', rot: '-720deg', delay: '70ms',  c: '#10b981' },
  { tx: '50px',   ty: '-100px', rot: '540deg',  delay: '10ms',  c: '#f59e0b' },
  { tx: '-80px',  ty: '-90px',  rot: '-300deg', delay: '50ms',  c: '#f43f5e' },
  { tx: '70px',   ty: '-60px',  rot: '420deg',  delay: '90ms',  c: '#a78bfa' },
  { tx: '-60px',  ty: '-70px',  rot: '-600deg', delay: '25ms',  c: '#fb923c' },
  { tx: '90px',   ty: '-110px', rot: '240deg',  delay: '65ms',  c: '#38bdf8' },
  { tx: '-30px',  ty: '-95px',  rot: '-420deg', delay: '15ms',  c: '#10b981' },
  { tx: '40px',   ty: '-75px',  rot: '660deg',  delay: '55ms',  c: '#f59e0b' },
  { tx: '-100px', ty: '-60px',  rot: '-240deg', delay: '85ms',  c: '#f43f5e' },
]

const props = defineProps({
  players: { type: Array, required: true },
  resetOnNext: { type: Boolean, default: true },
})
const emit = defineEmits(['endGame'])

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
const barColor = computed(() => {
  if (pct.value > 50) return 'var(--ok)'
  if (pct.value > 20) return 'var(--warn)'
  return 'var(--danger)'
})
const lowTime = computed(() => timer.remainingMs.value > 0 && timer.remainingMs.value <= 5000)
const flashDanger = computed(() => lowTime.value && timer.running.value)
const currentStreak = computed(() => timer.stats.value[timer.currentIndex.value]?.streak ?? 0)

function upcomingIndex(offset) {
  const n = timer.players.value.length
  if (n === 0) return 0
  return (timer.currentIndex.value + offset + 1) % n
}

function upcomingTime(offset) {
  const n = timer.players.value.length
  if (n === 0) return 0
  const idx = (timer.currentIndex.value + offset + 1) % n
  if (timer.resetOnNext.value) {
    return (timer.players.value[idx]?.seconds ?? 0) * 1000
  }
  return timer.banks.value[idx] ?? 0
}

const showConfetti = ref(false)
let confettiTimer = null

watch(timer.turnSuccess, (val) => {
  if (val) {
    timer.turnSuccess.value = false
    showConfetti.value = true
    clearTimeout(confettiTimer)
    confettiTimer = setTimeout(() => { showConfetti.value = false }, 900)
  }
})

function endGame() {
  if (confirm('End the game and see results?')) {
    timer.pause()
    const snapshot = timer.stats.value.map(s => ({
      ...s,
      fastestMs: s.fastestMs === Infinity ? 0 : s.fastestMs,
    }))
    emit('endGame', snapshot)
  }
}
</script>

<template>
  <section class="panel game" :class="{ 'flash-danger': flashDanger }">
    <Transition name="confetti-fade">
      <div v-if="showConfetti" class="confetti-container" aria-hidden="true">
        <span
          v-for="(piece, idx) in CONFETTI_PIECES"
          :key="idx"
          class="confetti-piece"
          :style="{
            '--tx': piece.tx,
            '--ty': piece.ty,
            '--rot': piece.rot,
            animationDelay: piece.delay,
            background: piece.c,
          }"
        />
      </div>
    </Transition>

    <header class="head">
      <div class="player-info">
        <div class="label">
          Current turn
          <span class="mode-badge">{{ timer.resetOnNext.value ? 'Per-turn' : 'Chess clock' }}</span>
        </div>
        <Transition name="player-swap" mode="out-in">
          <div class="player-card" :key="timer.currentIndex.value">
            <PlayerAvatar
              :name="timer.currentPlayer.value?.name ?? '?'"
              :index="timer.currentIndex.value"
              size="48px"
            />
            <div class="player-name">{{ timer.currentPlayer.value?.name ?? '—' }}</div>
            <span v-if="currentStreak >= 2" class="streak-badge">🔥 {{ currentStreak }}</span>
          </div>
        </Transition>
      </div>
      <div class="turn-index">{{ timer.currentIndex.value + 1 }} / {{ timer.players.value.length }}</div>
    </header>

    <div class="clock" :class="{ low: lowTime, paused: !timer.running.value && timer.remainingMs.value > 0 }">
      {{ display }}
    </div>

    <div class="bar">
      <div class="bar-fill" :style="{ width: pct + '%', background: barColor }"></div>
    </div>

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
          <PlayerAvatar :name="p.name" :index="upcomingIndex(i)" size="28px" />
          <span class="name">{{ p.name }}</span>
          <span class="time">{{ formatTime(upcomingTime(i)) }}</span>
        </li>
      </ol>
    </div>

    <footer class="foot">
      <button class="danger" @click="endGame">End Game</button>
    </footer>
  </section>
</template>

<style scoped>
.game { display: flex; flex-direction: column; gap: 18px; position: relative; overflow: visible; }
.game.flash-danger { animation: bgFlash 1s ease-in-out infinite; }

.confetti-container {
  position: absolute;
  top: 40%;
  left: 50%;
  pointer-events: none;
  z-index: 10;
}
.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confettiBurst 0.65s ease-out both;
}
.confetti-fade-enter-active { transition: opacity 0.1s; }
.confetti-fade-leave-active { transition: opacity 0.4s; }
.confetti-fade-enter-from, .confetti-fade-leave-to { opacity: 0; }

.head { display: flex; justify-content: space-between; align-items: flex-end; }
.player-info { display: flex; flex-direction: column; gap: 6px; }
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
.player-card { display: flex; align-items: center; gap: 12px; }
.player-name { font-size: 28px; font-weight: 700; }
.streak-badge {
  font-size: 13px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--warn);
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}
.turn-index { color: var(--muted); font-variant-numeric: tabular-nums; }

.player-swap-enter-active { animation: playerIn 0.25s ease; }
.player-swap-leave-active { animation: playerOut 0.2s ease; }

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
.clock.low { color: var(--danger); animation: pulse 0.8s ease-in-out infinite, shake 0.5s ease-in-out infinite; }
.clock.paused { color: var(--warn); }
@keyframes pulse { 50% { opacity: 0.55; } }

.bar { height: 10px; background: #0b1220; border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; transition: width 0.15s linear, background 0.4s ease; }

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
.upcoming .time { color: var(--muted); font-variant-numeric: tabular-nums; }

.foot { display: flex; justify-content: flex-end; }

@media (max-width: 520px) {
  .controls { grid-template-columns: 1fr 1fr; }
  .controls .big { grid-column: 1 / -1; }
  .player-name { font-size: 22px; }
}
</style>
