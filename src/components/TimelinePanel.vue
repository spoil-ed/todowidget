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
    range() { return calcTimelineRange(this.events) },
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
</style>
