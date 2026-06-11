<template>
  <div
    class="timeline-event"
    :class="{ compact: isCompact }"
    :style="{ top: topPx + 'px', height: heightPx + 'px' }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <span class="tl-event-title">{{ event.text }}</span>
    <span class="tl-event-time">{{ event.startTime }}–{{ event.endTime }}</span>
    <button v-if="hovered" class="tl-event-delete" @click.stop="$emit('delete', event.id)">
      <i class="bi bi-x"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TimelineEvent',
  props: {
    event: { type: Object, required: true },
    topPx: { type: Number, required: true },
    heightPx: { type: Number, required: true },
  },
  emits: ['delete'],
  data() { return { hovered: false } },
  computed: {
    isCompact() { return this.heightPx < 38 },
  },
}
</script>

<style scoped>
.timeline-event {
  position: absolute;
  left: 48px;
  right: 8px;
  background: var(--accent, #4a90d9);
  color: #fff;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  overflow: hidden;
  cursor: default;
  min-height: 28px;
  line-height: 1.15;
}
.timeline-event.compact {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}
.tl-event-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tl-event-time { font-size: 11px; opacity: 0.85; white-space: nowrap; flex-shrink: 0; }
.compact .tl-event-title { min-width: 0; }
.compact .tl-event-time { font-size: 10px; }
.tl-event-delete {
  position: absolute;
  top: 2px;
  right: 4px;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  font-size: 14px;
}
</style>
