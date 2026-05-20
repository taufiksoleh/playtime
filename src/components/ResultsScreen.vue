<script setup>
import { computed } from 'vue'
import PlayerAvatar from './PlayerAvatar.vue'
import { useLeaderboard } from '../composables/useLeaderboard.js'
import { formatTime } from '../composables/useGameTimer.js'

const props = defineProps({
  players: { type: Array, required: true },
  stats: { type: Array, required: true },
  mode: { type: String, default: 'per-turn' },
})

const emit = defineEmits(['playAgain', 'viewLeaderboard'])

const { save } = useLeaderboard()

const ranked = computed(() =>
  props.players.map((p, i) => {
    const s = props.stats[i] ?? { turns: 0, totalUsedMs: 0, fastestMs: 0, slowestMs: 0, timeouts: 0, streak: 0 }
    const avgMs = s.turns > 0 ? s.totalUsedMs / s.turns : Infinity
    return { ...p, ...s, originalIndex: i, avgMs }
  }).sort((a, b) => a.avgMs - b.avgMs)
)

const top3 = computed(() => ranked.value.slice(0, Math.min(3, ranked.value.length)))
const winnerIndex = computed(() => ranked.value[0]?.originalIndex ?? 0)
const noData = computed(() => ranked.value[0]?.avgMs === Infinity)

const MEDALS = ['🥇', '🥈', '🥉']

function fmtAvg(s) {
  return s.turns > 0 ? formatTime(s.totalUsedMs / s.turns) : '—'
}
function fmtFastest(s) {
  return s.turns > 0 && s.fastestMs > 0 ? formatTime(s.fastestMs) : '—'
}
function fmtSlowest(s) {
  return s.turns > 0 && s.slowestMs > 0 ? formatTime(s.slowestMs) : '—'
}

function handleSave() {
  const entry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode: props.mode,
    players: props.players.map((p, i) => {
      const s = props.stats[i] ?? {}
      return {
        name: p.name,
        colorIndex: i,
        turns: s.turns ?? 0,
        totalUsedMs: s.totalUsedMs ?? 0,
        fastestMs: s.fastestMs === Infinity ? 0 : (s.fastestMs ?? 0),
        slowestMs: s.slowestMs ?? 0,
        timeouts: s.timeouts ?? 0,
        streak: s.streak ?? 0,
      }
    }),
    winnerIndex: winnerIndex.value,
  }
  save(entry)
  emit('viewLeaderboard')
}
</script>

<template>
  <section class="panel results">
    <h2>Game Over</h2>

    <div v-if="noData" class="no-data muted">No completed turns recorded.</div>

    <div v-else class="podium">
      <div v-if="top3.length >= 2" class="podium-slot second">
        <span class="medal">{{ MEDALS[1] }}</span>
        <PlayerAvatar :name="top3[1].name" :index="top3[1].originalIndex" size="44px" />
        <span class="podium-name">{{ top3[1].name }}</span>
        <span class="podium-avg">avg {{ fmtAvg(top3[1]) }}</span>
      </div>
      <div v-if="top3.length >= 1" class="podium-slot first">
        <span class="medal">{{ MEDALS[0] }}</span>
        <PlayerAvatar :name="top3[0].name" :index="top3[0].originalIndex" size="56px" />
        <span class="podium-name">{{ top3[0].name }}</span>
        <span class="podium-avg">avg {{ fmtAvg(top3[0]) }}</span>
      </div>
      <div v-if="top3.length >= 3" class="podium-slot third">
        <span class="medal">{{ MEDALS[2] }}</span>
        <PlayerAvatar :name="top3[2].name" :index="top3[2].originalIndex" size="40px" />
        <span class="podium-name">{{ top3[2].name }}</span>
        <span class="podium-avg">avg {{ fmtAvg(top3[2]) }}</span>
      </div>
    </div>

    <div class="table-wrap">
      <table class="stats-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Turns</th>
            <th>Avg</th>
            <th>Fastest</th>
            <th>Slowest</th>
            <th>Timeouts</th>
            <th>Streak</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, rank) in ranked" :key="p.originalIndex">
            <td class="player-cell">
              <PlayerAvatar :name="p.name" :index="p.originalIndex" size="28px" />
              <span>{{ p.name }}</span>
              <span v-if="rank === 0 && !noData" class="crown">👑</span>
            </td>
            <td>{{ p.turns }}</td>
            <td>{{ fmtAvg(p) }}</td>
            <td>{{ fmtFastest(p) }}</td>
            <td>{{ fmtSlowest(p) }}</td>
            <td :class="{ 'text-danger': p.timeouts > 0 }">{{ p.timeouts }}</td>
            <td>{{ p.streak > 0 ? `🔥 ${p.streak}` : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="actions">
      <button class="ghost" @click="$emit('playAgain')">← Play Again</button>
      <button class="primary" @click="handleSave">Save to Leaderboard 🏆</button>
    </div>
  </section>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: slideUp 0.4s ease both;
}
.results h2 { margin: 0; font-size: 24px; }

.no-data { text-align: center; padding: 20px 0; }

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 12px;
}
.podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid transparent;
  min-width: 100px;
}
.podium-slot.first {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.25);
  padding-top: 28px;
}
.podium-slot.second {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.18);
}
.podium-slot.third {
  background: rgba(205, 127, 50, 0.08);
  border-color: rgba(205, 127, 50, 0.18);
}
.medal { font-size: 26px; }
.podium-name { font-weight: 600; font-size: 15px; text-align: center; }
.podium-avg { font-size: 12px; color: var(--muted); }

.table-wrap { overflow-x: auto; }
.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.stats-table th {
  text-align: left;
  color: var(--muted);
  font-weight: 500;
  padding: 8px 10px;
  border-bottom: 1px solid var(--panel-2);
  white-space: nowrap;
}
.stats-table td {
  padding: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  font-variant-numeric: tabular-nums;
}
.stats-table tr:last-child td { border-bottom: none; }
.player-cell { display: flex; align-items: center; gap: 8px; }
.crown { font-size: 14px; }
.text-danger { color: var(--danger); }

.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 520px) {
  .podium-slot { padding: 12px 12px; min-width: 80px; }
  .actions { flex-direction: column; }
}
</style>
