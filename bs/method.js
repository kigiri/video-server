const h = require('izi/vanilla-h')
const { isChildren } = require('izi/is')
const bsClass = [ 'success', 'info', 'warning', 'danger', 'primary' ]

const switchClass = (el, className, classes) => {
  el.classList.remove.apply(el.classList, classes)
  el.classList.add(className)
  return el
}

const replaceContent = (el, content) => {
  console.log({ el, content })
  if (!isChildren(content)) return el
  h.empty(el)
  h.appendChild(el, content)
  return el
}

module.exports = {
  class: bsClass,

  prefixClass: prefix => {
    const addPrefix = c => `${prefix}-${c}`
    const classes = bsClass.map(addPrefix)
    return bsClass.map(c => {
      const className = addPrefix(c)
      return { class: c, fn: el => switchClass(el, className, classes) }
    })
  },
  _switchClass: switchClass,
  _replaceContent: replaceContent,
  replaceContent: el =>
    el.replaceContent = content => replaceContent(el, content),

  hide: el => {
    let hideTimeout

    el.hide = n => {
      clearTimeout(hideTimeout)
      return ((n
        ? (hideTimeout = setTimeout(() => el.style.opacity = 0, n))
        : (el.style.opacity = 0)), el)
    }
    el.show = () => {
      clearTimeout(hideTimeout)
      el.style.visibility = ''
      el.style.opacity = 1
      return el
    }
  }
}
