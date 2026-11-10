const assert = require('node:assert/strict')
const Module = require('node:module')
const { test } = require('node:test')

test('Orbis timestamps render with the App Router React runtime', () => {
  const dependencyRequire = Module.createRequire(require.resolve('@orbisclub/components'))
  const React = require('next/dist/compiled/react')
  const originalLoad = Module._load
  Module._load = function (name, ...args) {
    if (name === 'react') return React
    if (name === 'react-dom') return require('next/dist/compiled/react-dom')
    return originalLoad.call(this, name, ...args)
  }
  try {
    const { renderToStaticMarkup } = require('next/dist/compiled/react-dom/server')
    const TimeAgo = dependencyRequire('javascript-time-ago').default
    TimeAgo.addDefaultLocale(dependencyRequire('javascript-time-ago/locale/en'))
    const ReactTimeAgo = dependencyRequire('react-time-ago').default
    const rendered = renderToStaticMarkup(React.createElement(ReactTimeAgo, {
      date: 1697717037000,
      locale: 'en-US',
      now: 1697717097000
    }))
    assert.match(rendered, /<time[^>]*>1 minute ago<\/time>/)
    assert.doesNotMatch(rendered, /NaN/)
  } finally {
    Module._load = originalLoad
  }
})
