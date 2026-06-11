/* eslint-env jest */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function readSource(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('week view drag navigation', () => {
  test.each([
    ['main week view', 'src/components/WeekView.vue'],
    ['widget week view', 'src/views/WidgetView.vue'],
  ])('%s does not bind pointer drag navigation', (_, filePath) => {
    const source = readSource(filePath)

    expect(source).not.toContain('@pointerdown="startWeekDrag"')
    expect(source).not.toContain('@pointermove="moveWeekDrag"')
    expect(source).not.toContain('@pointerup="endWeekDrag"')
    expect(source).not.toContain('@pointercancel="cancelWeekDrag"')
    expect(source).not.toContain('@pointerleave="cancelWeekDrag"')
    expect(source).not.toContain('startWeekDrag(')
    expect(source).not.toContain('endWeekDrag(')
  })
})
