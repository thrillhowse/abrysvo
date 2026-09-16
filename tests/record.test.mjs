import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDate, displayDate, displayMonth, validateRecord } from '../src/record.js'
const record = { name: 'Amélie Example', confirmed: true, date: '2026-09-12', unsure: false, delivery: '2026-10', location: '' }
const now = new Date(2026, 8, 16)
test('complete record allows missing optional location', () => assert.deepEqual(validateRecord(record, now), {}))
test('requires name, confirmation and pregnancy', () => {
  const errors = validateRecord({ ...record, name: ' ', confirmed: false, delivery: '' }, now)
  assert.deepEqual(Object.keys(errors), ['name', 'confirmed', 'delivery'])
})
test('does not guess an unknown vaccination date', () => {
  assert.deepEqual(validateRecord({ ...record, date: '', unsure: true }, now), {})
  assert.ok(validateRecord({ ...record, date: '', unsure: false }, now).date)
})
test('rejects future and impossible vaccination dates', () => {
  for (const date of ['2026-09-17', '2026-02-30', '2026-13-01', '2026-00-01', '2026-09-00', 'not-a-date']) assert.ok(validateRecord({ ...record, date }, now).date, date)
})
test('accepts today without UTC conversion', () => assert.deepEqual(validateRecord({ ...record, date: '2026-09-16' }, now), {}))
test('validates leap days', () => { assert.ok(parseDate('2024-02-29')); assert.equal(parseDate('2025-02-29'), null) })
test('formats dates with a written month', () => { assert.equal(displayDate('2026-09-12'), 'September 12, 2026'); assert.equal(displayMonth('2026-10'), 'October 2026') })
test('rejects invalid delivery months and oversized fields', () => {
  assert.ok(validateRecord({ ...record, delivery: '2026-13' }, now).delivery)
  assert.ok(validateRecord({ ...record, name: 'x'.repeat(101) }, now).name)
  assert.ok(validateRecord({ ...record, location: 'x'.repeat(141) }, now).location)
})
