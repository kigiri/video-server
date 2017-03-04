module.exports = {
  hide: el => {
    let hideTimeout

    el.hide = n => {
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => el.classList.add('fade'), n)
    }
    el.show = () => {
      clearTimeout(hideTimeout)
      el.classList.remove('fade')
    }
  }
}
