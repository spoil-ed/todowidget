/* eslint-env jest */

const {
  DEFAULT_WIDGET_MARGIN,
  widgetBottomRightBounds,
  widgetResizeBounds,
} = require('../src/helpers/windowBoundsHelper')

const workArea = { x: 0, y: 0, width: 1920, height: 1040 }

test('widgetBottomRightBounds places a widget inside the bottom-right work area', () => {
  expect(widgetBottomRightBounds(workArea, 300, 440)).toEqual({
    x: 1608,
    y: 588,
    width: 300,
    height: 440,
  })
})

test('widgetBottomRightBounds respects non-zero display origins', () => {
  expect(widgetBottomRightBounds({ x: 1920, y: 40, width: 1280, height: 900 }, 460, 470)).toEqual({
    x: 2728,
    y: 458,
    width: 460,
    height: 470,
  })
})

test('widgetResizeBounds keeps a right-bottom anchored widget on screen after it grows', () => {
  const currentBounds = widgetBottomRightBounds(workArea, 300, 440)

  expect(widgetResizeBounds(currentBounds, workArea, 460, 470)).toEqual({
    x: 1448,
    y: 558,
    width: 460,
    height: 470,
  })
})

test('widgetResizeBounds preserves a manually moved widget unless it would overflow', () => {
  expect(widgetResizeBounds({ x: 200, y: 160, width: 300, height: 440 }, workArea, 460, 470)).toEqual({
    x: 200,
    y: 160,
    width: 460,
    height: 470,
  })

  expect(widgetResizeBounds({ x: 1750, y: 900, width: 120, height: 120 }, workArea, 460, 470)).toEqual({
    x: 1448,
    y: 558,
    width: 460,
    height: 470,
  })
})

test('widgetResizeBounds shrinks requested bounds to fit very small work areas', () => {
  expect(widgetResizeBounds({ x: 0, y: 0, width: 300, height: 440 }, { x: 0, y: 0, width: 320, height: 240 }, 460, 470)).toEqual({
    x: DEFAULT_WIDGET_MARGIN,
    y: DEFAULT_WIDGET_MARGIN,
    width: 296,
    height: 216,
  })
})
