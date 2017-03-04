const h = require('izi/vanilla-h')
const method = require('./method')
const ANIMATED = 'progress-bar-animated'
const STRIPED = 'progress-bar-striped'

const wrapper = h('.progress')
const progressBar = h('.progress-bar', {
  role: 'progressbar',
  ariaValuemin: 0,
  ariaValuemax: 100,
})

module.exports = (initialValue = 0) => {
  const bar = progressBar()
  const el = wrapper(bar)
  const classes =  bar.classList

  method.hide(el)

  el.pause = () => bar.classList.remove(ANIMATED, STRIPED)
  el.start = () => bar.classList.add(ANIMATED, STRIPED)
  el.setValue = (n, text) => {
    n = Math.min(Math.max(n * 100, 1.5), 100)
    console.log({ n })
    el.start()
    el.show()
    bar.setAttribute('aria-valuenow', n)
    bar.style.width = bar.textContent = text || `${Math.floor(n)}%`
  }

  el.setValue(initialValue)

  return el
}
