const h = require('izi/vanilla-h')
const method = require('./method')
const btn = h('button.btn')

const prefixed = method.prefixClass('btn')

method.class.forEach(c => {
  const constructor = h(`button.btn.btn-${c}`)
  btn[c] = function () {
    const el = constructor.apply(null, arguments)

    method.replaceContent(el)
    method.hide(el)

    el.disable = content => (el.disabled = true, el.replaceContent(content))
    el.enable = content => (el.disabled = false, el.replaceContent(content))

    prefixed.forEach(prefix => {
      const changeContentAndClass = el[prefix.class] = content =>
        (el.replaceContent(content), prefix.fn(el))

      changeContentAndClass.disable = content =>
        (el.disabled = true, changeContentAndClass(content))

      changeContentAndClass.enable = content =>
        (el.disabled = false, changeContentAndClass(content))
    })

    return el
  }
})

module.exports = btn
