/* eslint-env jest */

const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(
  path.resolve(__dirname, '../src/components/TimelinePanel.vue'),
  'utf8'
)

describe('timeline visual alignment', () => {
  test.each([
    '.tl-hour-marker',
    '.tl-current-time',
    '.tl-ddl-marker',
  ])('%s centers its visual line on the calculated top coordinate', selector => {
    expect(source).toMatch(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{[^}]*transform:\\s*translateY\\(-50%\\);`))
  })

  test('ddl dashed line is centered on its marker coordinate', () => {
    expect(source).toMatch(/\.tl-ddl-marker::before\s*\{[^}]*top:\s*50%;[^}]*transform:\s*translateY\(-50%\);/)
  })
})
