<template>
  <div class="timeline-panel">
    <div class="timeline-header">
      <span>日程</span>
      <button class="tl-add-btn" @click="openModal('08:00')" title="添加日程">
        <i class="bi bi-plus"></i>
      </button>
    </div>
    <div class="timeline-scroll" @click="handleTimelineClick" ref="scrollArea">
      <div class="timeline-canvas" :style="{ height: totalHeight + 'px' }" ref="canvas">
        <!-- Hour markers -->
        <div
          v-for="hour in hourMarkers"
          :key="hour.label"
          class="tl-hour-marker"
          :style="{ top: hour.top + 'px' }"
        >
          <span class="tl-hour-label">{{ hour.label }}</span>
          <div class="tl-hour-line"></div>
        </div>
        <!-- Current time -->
        <div
          v-if="showCurrentTime"
          class="tl-current-time"
          :style="{ top: currentTimeTop + 'px' }"
        >
          <span class="tl-current-label">{{ currentTimeLabel }}</span>
          <div class="tl-current-line"></div>
        </div>
        <!-- Event blocks -->
        <timeline-event
          v-for="event in events"
          :key="event.id"
          :event="event"
          :top-px="eventTop(event)"
          :height-px="eventHeight(event)"
          @edit="editEvent"
          @delete="deleteEvent(event.id)"
        />
        <!-- DDL markers -->
        <div
          v-for="t in ddlMarkers"
          :key="t.id"
          class="tl-ddl-marker"
          :style="{ top: ddlMarkerTop(t) + 'px' }"
          :class="{ done: t.checked }"
          :title="t.text"
        >
          <span class="tl-ddl-time">{{ t.ddlTime }}</span>
          <span class="tl-ddl-label">{{ t.text }}</span>
        </div>
      </div>
    </div>
    <add-task-modal
      v-if="showModal"
      :initial-date="date"
      :initial-time="modalInitialTime"
      :task="editingEvent"
      @close="closeModal"
    />
  </div>
</template>

<script>
import { timeToMinutes, minutesToTime, calcTimelineRange } from '../helpers/timeHelper'
import { today } from '../helpers/dateHelper'
import TimelineEvent from './TimelineEvent.vue'
import AddTaskModal from '../views/AddTaskModal.vue'

export default {
  name: 'TimelinePanel',
  components: { TimelineEvent, AddTaskModal },
  props: {
    date: { type: String, required: true },
  },
  data() {
    return {
      showModal: false,
      modalInitialTime: '09:00',
      editingEvent: null,
      now: new Date(),
      clockTimer: null,
    }
  },
  mounted() {
    this.clockTimer = setInterval(() => { this.now = new Date() }, 60000)
    this.$nextTick(this.scrollToInitialTime)
  },
  beforeUnmount() {
    if (this.clockTimer) clearInterval(this.clockTimer)
  },
  watch: {
    date() {
      this.$nextTick(this.scrollToInitialTime)
    },
  },
  computed: {
    events() {
      return this.$store.getters.tasksForDate(this.date)
        .filter(t => t.kind === 'event')
        .slice()
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    },
    ddlMarkers() {
      return this.$store.getters.tasksForDate(this.date)
        .filter(t => t.kind === 'ddl' && t.ddl && t.ddl.includes(' '))
        .map(t => ({ ...t, ddlTime: t.ddl.split(' ')[1] }))
        .sort((a, b) => a.ddlTime.localeCompare(b.ddlTime))
    },
    range() {
      return calcTimelineRange()
    },
    totalHeight() { return this.range.end - this.range.start },
    currentMinutes() {
      return this.now.getHours() * 60 + this.now.getMinutes()
    },
    showCurrentTime() {
      return this.date === today()
        && this.currentMinutes >= this.range.start
        && this.currentMinutes <= this.range.end
    },
    currentTimeTop() { return this.currentMinutes - this.range.start },
    currentTimeLabel() { return minutesToTime(this.currentMinutes) },
    hourMarkers() {
      const markers = []
      const startHour = Math.floor(this.range.start / 60)
      const endHour = Math.ceil(this.range.end / 60)
      for (let h = startHour; h <= endHour; h++) {
        const minutes = h * 60
        if (minutes < this.range.start || minutes > this.range.end) continue
        markers.push({ label: minutesToTime(minutes), top: minutes - this.range.start })
      }
      return markers
    },
  },
  methods: {
    ddlMarkerTop(t) { return timeToMinutes(t.ddlTime) - this.range.start },
    eventTop(event) { return timeToMinutes(event.startTime) - this.range.start },
    eventHeight(event) {
      return Math.max(16, timeToMinutes(event.endTime) - timeToMinutes(event.startTime))
    },
    handleTimelineClick(e) {
      if (e.target.closest('.timeline-event')) return
      const canvas = this.$refs.canvas
      if (!canvas) return
      const y = e.clientY - canvas.getBoundingClientRect().top
      const snapped = Math.round((this.range.start + y) / 15) * 15
      this.modalInitialTime = minutesToTime(Math.min(Math.max(snapped, 0), 1425))
      this.editingEvent = null
      this.showModal = true
    },
    scrollToInitialTime() {
      const scrollArea = this.$refs.scrollArea
      if (!scrollArea) return
      const target = this.date === today() ? this.currentTimeTop : timeToMinutes('08:00')
      scrollArea.scrollTop = Math.max(0, target - scrollArea.clientHeight * 0.35)
    },
    editEvent(event) {
      this.editingEvent = event
      this.modalInitialTime = event.startTime || '09:00'
      this.showModal = true
    },
    deleteEvent(id) { this.$store.dispatch('deleteTask', { id }) },
    closeModal() {
      this.showModal = false
      this.editingEvent = null
    },
    openModal(time) {
      this.editingEvent = null
      this.modalInitialTime = time
      this.showModal = true
    },
  },
}
</script>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--border);
  padding: 0 0 8px;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.tl-add-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 16px;
  padding: 0 4px;
}
.timeline-scroll {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  cursor: crosshair;
}
.timeline-canvas {
  position: relative;
  min-height: 100%;
}
.tl-hour-marker {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.tl-hour-label {
  width: 44px;
  text-align: right;
  font-size: 11px;
  color: var(--text-muted);
  padding-right: 6px;
  flex-shrink: 0;
}
.tl-hour-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
.tl-current-time {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 4;
  pointer-events: none;
}
.tl-current-label {
  width: 44px;
  text-align: right;
  font-size: 10px;
  color: var(--danger);
  padding-right: 6px;
  flex-shrink: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.tl-current-line {
  flex: 1;
  height: 2px;
  background: var(--danger);
  box-shadow: 0 0 0 1px rgba(229,62,62,0.12);
}
.tl-ddl-marker {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 2;
  &.done { opacity: 0.4; }
}
.tl-ddl-marker::before {
  content: '';
  position: absolute;
  left: 44px;
  right: 0;
  height: 1px;
  border-top: 2px dashed var(--danger);
  opacity: 0.7;
}
.tl-ddl-time {
  width: 44px;
  text-align: right;
  font-size: 10px;
  color: var(--danger);
  padding-right: 6px;
  flex-shrink: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.tl-ddl-label {
  position: absolute;
  right: 6px;
  background: #fff0f0;
  color: var(--danger);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid rgba(229,62,62,0.25);
}
</style>
