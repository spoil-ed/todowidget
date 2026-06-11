export const DEFAULT_WIDGET_MARGIN = 12

const ANCHOR_TOLERANCE = 48

function clamp(value, min, max) {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

function fitWidgetSize(workArea, width, height, margin) {
  return {
    width: Math.min(width, Math.max(1, workArea.width - margin * 2)),
    height: Math.min(height, Math.max(1, workArea.height - margin * 2)),
  }
}

export function widgetBottomRightBounds(workArea, width, height, margin = DEFAULT_WIDGET_MARGIN) {
  const size = fitWidgetSize(workArea, width, height, margin)
  return {
    x: workArea.x + workArea.width - size.width - margin,
    y: workArea.y + workArea.height - size.height - margin,
    width: size.width,
    height: size.height,
  }
}

export function widgetResizeBounds(currentBounds, workArea, width, height, margin = DEFAULT_WIDGET_MARGIN) {
  const size = fitWidgetSize(workArea, width, height, margin)
  const minX = workArea.x + margin
  const minY = workArea.y + margin
  const maxX = workArea.x + workArea.width - size.width - margin
  const maxY = workArea.y + workArea.height - size.height - margin
  const anchoredRight = Math.abs((currentBounds.x + currentBounds.width) - (workArea.x + workArea.width - margin)) <= ANCHOR_TOLERANCE
  const anchoredBottom = Math.abs((currentBounds.y + currentBounds.height) - (workArea.y + workArea.height - margin)) <= ANCHOR_TOLERANCE

  const x = anchoredRight ? maxX : currentBounds.x
  const y = anchoredBottom ? maxY : currentBounds.y

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
    width: size.width,
    height: size.height,
  }
}
