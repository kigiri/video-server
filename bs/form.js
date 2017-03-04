const h = require('izi/vanilla-h')
const { isStr } = require('izi/is')
const map = require('izi/collection/map')
const each = require('izi/collection/each')
const helpText = h('small.form-text.text-muted')
const formGroup = h('.form-group')
const bsLabel = h('label')
const baseInput = h('input.form-control', { type: 'text' })

let inputId = 0
const input = (label, props, children) => {
  props.id || (props.id = `bs-input-${++inputId}`)
  props.help && (props['aria-describedby']
    || (props['aria-describedby'] =`${props.id}-help`))

  const _input = baseInput(props)
  const el = formGroup([
    label && bsLabel({ htmlFor: props.id }, label),
    _input,
    props.help && helpText({ id: props['aria-describedby'] }),
    children,
  ])

  if (_input.type !== 'file') {
    if (localStorage[props.id]) {
      _input.value = localStorage[props.id]
    }
    _input.addEventListener('change', () => localStorage[props.id] = _input.value)
  }


  el.input = _input

  return el
}

const buildInputs = map(inputDescriptor => isStr(inputDescriptor)
  ? input(inputDescriptor)
  : input(inputDescriptor.label, inputDescriptor))

const getValues = map((input, key) => {
  if (!input) return
  switch (input.type) {
    case 'file': return input.value && input.files[0]
    default: return input.value
  }
})

const disable = el => {
  if (!el) return
  el.classList.add('disabled')
  el.disabled = true
}

const enable = el => {
  if (!el) return
  el.classList.add('enabled')
  el.disabled = false
}

const disableAll = each(disable)
const enableAll = each(enable)

const getInputs = map(({input}) => input)
const form = inputDescriptors => {
  elems = buildInputs(inputDescriptors)
  const inputs = getInputs(elems)

  elems.values = () => getValues(inputs)
  elems.disableAll = () => disableAll(inputs)
  elems.enableAll = () => enabledAll(inputs)

  return elems
}

module.exports = Object.assign(form, {
  input,
  formGroup,
  helpText,
  baseInput,
})

