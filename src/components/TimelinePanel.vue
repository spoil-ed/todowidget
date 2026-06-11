<template>
  <div class="timeline-panel">
    <div class="timeline-header">
      <span>日程</span>
      <button class="tl-add-btn" @click="openModal('08:00')" title="添加日程">
        <i class="bi bi-plus"></i>
      </button>
    </div>
    <div
      class="timeline-scroll"
      :style="{ height: totalHeight + 'px' }"
      @click="handleTimelineClick"
      ref="scrollArea"
    >
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
      <!-- Event blocks -->
      <timeline-event
        v-for="event in events"
        :key="event.id"
        :event="event"
        :top-px="eventTop(event)"
        :height-px="eventHeight(event)"
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
    <add-event-modal
      v-if="showModal"
      :date="date"
      :initial-time="modalInitialTime"
      @close="showModal = false"
    />
  </div>
</template>

<script>
import { timeToMinutes, minutesToTime, calcTimelineRange } from '../helpers/timeHelper'

import TimelineEvent from './TimelineEvent.vue'
import AddEventModal from '../views/AddEventModal.vue'

export default {
  name: 'TimelinePanel',
  components: { TimelineEvent, AddEventModal },
  props: {
    date: { type: String, required: true },
  },
  data() {
    return { showModal: false, modalInitialTime: '09:00' }
  },
  computed: {
    events() { return this.$store.getters.eventsForDate(this.date) },
    ddlMarkers() {
      return (this.$store.getters.todosForDate(this.date) || [])
        .filter(t => t.ddl && t.ddl.includes(' '))
        .map(t => ({ ...t, ddlTime: t.ddl.split(' ')[1] }))
    },
    range() {
      const ddlMins = this.ddlMarkers.map(t => timeToMinutes(t.ddlTime))
      return calcTimelineRange(this.events, ddlMins)
    },
    totalHeight() { return this.range.end - this.range.start },
    hourMarkers() {
      const markers = []
      const startHour = Math.floor(this.range.start / 60)
      const endHour = Math.ceil(this.range.end / 60)
      for (let h = startHour; h <= endHour; h++) {
        const minutes = h * 60
        if (minutes < this.range.start || minutes > this.range.end) continue
        markers.push({
          label: minutesToTime(minutes),
          top: minutes - this.range.start,
        })
      }
      return markers
    },
  },
  methods: {
    ddlMarkerTop(t) { return timeToMinutes(t.ddlTime) - this.range.start },
    eventTop(event) { return timeToMinutes(event.startTime) - this.range.start },
    eventHeight(event) {
      return Math.max(20, timeToMinutes(event.endTime) - timeToMinutes(event.startTime))
    },
    handleTimelineClick(e) {
      if (e.target.closest('.timeline-event')) return
      const offsetY = e.offsetY
      const clickedMinutes = this.range.start + offsetY
      const snapped = Math.round(clickedMinutes / 15) * 15
      this.modalInitialTime = minutesToTime(Math.min(snapped, 1380))
      this.showModal = true
    },
    deleteEvent(id) {
      this.$store.dispatch('deleteEvent', { date: this.date, id })
    },
    openModal(time) {
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
  position: relative;
  overflow-y: auto;
  flex: 1;
  cursor: crosshair;
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
