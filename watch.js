const h = require('izi/vanilla-h')
const f = require('izi/flow')
const prefix = require('izi/prefix')
const { capitalize } = require('izi/str')
const formatDate = require('izi/date')('DD/mm/YYYY')

const isFullscreen = prefix.get('isFullScreen')
const enterFullscreen = prefix.call('requestFullscreen')
const leaveFullscreen = prefix.call('exitFullscreen')

const toggleFullScreen = el => (isFullscreen(document) || document.fullscreenElement)
  ? leaveFullscreen(document)
  : enterFullscreen(el)

const lead = h('p.lead', {
  style: {
    width: '50%',
    padding: '0 8px',
    display: 'inline-block',
    whiteSpace: 'pre',
    fontVariant: 'small-caps',
    marginBottom: '2px',
    letterSpacing: '1.25px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
})

const video = h('video', {
  onclick: ({ target }) => target.paused ? target.play() : target.pause(),
  ondblclick: ({ target }) => toggleFullScreen(target),
  controls: true,
  style: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    left: 0,
    top: 0,
  },
})

const div = h('div')
const small = h('small')
const textRight = h('.text-right', {
  style: {
    width: '100%',
    color: '#777',
    padding: '2px 11px',
    background: 'linear-gradient(to top, white, #fafafa)',
    borderRadius: '0 0 6px 6px',
    backgroundColor: '#fafafa',
  }
})

const videoWrapper = h({
  style: {
    paddingBottom: `${(9/16) * 100}%`,
    paddingTop: '25px',
    position: 'relative',
    width: '100%',
    height: 0,
  },
})

const fetchJSON = f(fetch, r => r.ok
  ? r.json()
  : Promise.reject(Object.assign(Error(r.statusText), r)))

module.exports = videoId => {
  const lastName = lead({ style: { textAlign: 'right', fontWeight: 'bold' } }, ' ')
  const firstName = lead({ style: { color: '#777' } }, ' ')
  const dateElem = small(' ')
  fetchJSON(`/video/${videoId}.json`)
    .then(info => {
      h.replaceContent(dateElem, formatDate(new Date(info.date)))
      h.replaceContent(lastName, capitalize(info.lastName))
      h.replaceContent(firstName, capitalize(info.firstName))
    })
    .catch(console.error)

  return [
    div({ style: { width: '100%' } }, [ lastName, firstName ]),
    videoWrapper(video({ src: `/video/${videoId}.mp4` })),
    textRight(dateElem),
  ]
}
