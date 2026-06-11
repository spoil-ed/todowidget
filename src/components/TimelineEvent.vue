<template>
  <div
    class="timeline-event"
    :class="{ compact: isCompact, tiny: isTiny }"
    :style="{ top: topPx + 'px', height: heightPx + 'px' }"
    :title="`${event.startTime}-${event.endTime} ${event.text}`"
    @click.stop="$emit('edit', event)"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <span class="tl-event-title">{{ event.text }}</span>
    <span class="tl-event-time">{{ event.startTime }}–{{ event.endTime }}</span>
    <div v-if="hovered" class="tl-event-actions">
      <button class="tl-event-action" title="修改" @click.stop="$emit('edit', event)">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="tl-event-action" title="删除" @click.stop="$emit('delete', event.id)">
        <i class="bi bi-x"></i>
      </button>
    </div>
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
  emits: ['edit', 'delete'],
  data() { return { hovered: false } },
  computed: {
    isCompact() { return this.heightPx < 38 },
    isTiny() { return this.heightPx < 24 },
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
  cursor: pointer;
  min-height: 0;
  line-height: 1.15;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
  transition: filter 0.12s, box-shadow 0.12s;
}
.timeline-event:hover {
  filter: brightness(1.04);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.16);
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
.tiny {
  padding-top: 1px;
  padding-bottom: 1px;
}
.tiny .tl-event-time { display: none; }
.tl-event-actions {
  position: absolute;
  top: 1px;
  right: 4px;
  display: flex;
  gap: 2px;
}
.tl-event-action {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 1px 2px;
  line-height: 1;
  font-size: 12px;
  border-radius: 3px;
}
.tl-event-action:hover {
  background: rgba(255,255,255,0.18);
}
</style>
