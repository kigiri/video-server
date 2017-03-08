const h = require('izi/vanilla-h')
const span = h('span')
const alertBox = h('.alert.alert-success.text-center', { role: 'alert' })
const method = require('./method')

const prefixed = method.prefixClass('alert')

module.exports = (initMessage = ' ') => {
  const content = span(initMessage)
  const el = alertBox(content)

  method.hide(el)
  prefixed.forEach(prefix => el[prefix.class] = msg => {
    el.show()
    method._replaceContent(content, msg)
    return prefix.fn(el)
  })
  return el
}
