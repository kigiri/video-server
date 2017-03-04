const h = require('izi/vanilla-h')
const btn = h('button.btn')
const colors = [
  'primary',
].forEach(key => btn[key] = h(`button.btn.btn-${key}`))

module.exports = btn
