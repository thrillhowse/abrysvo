import test from 'node:test'
import assert from 'node:assert/strict'
import config from '../vite.config.js'

function policy(environment) {
  const plugin = config(environment).plugins.find(p => p.name === 'privacy-policy')
  return plugin.transformIndexHtml()[0].attrs.content
}

test('development permits the React Refresh inline preamble and local reload connection', () => {
  const value = policy({ command: 'serve', isPreview: false })
  assert.match(value, /script-src 'self' 'unsafe-inline';/)
  assert.match(value, /connect-src 'self' ws:\/\/localhost:\*/)
  assert.match(value, /form-action 'none'/)
})

test('production builds and previews retain strict script and network policies', () => {
  for (const environment of [{ command: 'build' }, { command: 'serve', isPreview: true }]) {
    const value = policy(environment)
    assert.match(value, /script-src 'self';/)
    assert.match(value, /connect-src 'none';/)
    assert.match(value, /form-action 'none'/)
  }
})
