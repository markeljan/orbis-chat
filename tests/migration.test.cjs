const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

function loadSource(filename, mocks) {
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  }).outputText
  const exports = {}
  vm.runInNewContext(output, {
    exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name)
  }, { filename })
  return exports
}

test('avatar page awaits Next 15 route params and preserves username', async () => {
  const Chat = () => null
  const page = loadSource('app/[username]/page.tsx', { '@/components/chat': { Chat } })
  const rendered = await page.default({ params: Promise.resolve({ username: 'avatar-fixture' }) })
  assert.equal(rendered.props.children.type, Chat)
  assert.equal(rendered.props.children.props.username, 'avatar-fixture')
})

function loadHook(profile, calls) {
  const state = [undefined, profile, undefined]
  return loadSource('lib/hooks/use-orbis.ts', {
    react: { useState: () => [state.shift(), () => {}], useEffect: () => {} },
    '@orbisclub/orbis-sdk': { Orbis: class {
      async connect_v2(options) {
        calls.push(options)
        return { status: 200, did: 'did:pkh:fixture' }
      }
    } }
  }).useOrbis()
}

test('Orbis profiles without training data can initialize', () => {
  for (const profile of [undefined, {}, { details: { profile: { data: {} } } }]) {
    const hook = loadHook(profile, [])
    assert.equal(hook.data, undefined)
    assert.equal(hook.voiceId, undefined)
  }
})

test('Orbis training data and Ethereum connection options are preserved', async () => {
  const calls = []
  const hook = loadHook({ details: { profile: { data: {
    trainingData: { data: 'Avatar instructions', voiceId: 'voice-fixture' }
  } } } }, calls)
  assert.equal(hook.data, 'Avatar instructions')
  assert.equal(hook.voiceId, 'voice-fixture')
  await hook.connect()
  assert.equal(JSON.stringify(calls), JSON.stringify([{ chain: 'ethereum', lit: false }]))
})
