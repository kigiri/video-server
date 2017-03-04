//'use strict'
const wesh = _ => (console.log(_), _)
const byId = document.getElementById.bind(document)
const body = document.getElementsByTagName('body')[0]
const h = require('izi/vanilla-h')
const f = require('izi/flow')
const observ = require('izi/emiter/observ')
const bsProgress = require('./bs/progress')
const bsBtn = require('./bs/btn')
const bsForm = require('./bs/form')
const { div, h2, label, input, button, form, p, small } = h.proxy
const prefix = require('izi/prefix')
const { chunk, wesoServer, wesoClient } = require('./common.js')
const initWeso = require('izi/weso-browser')

// constants
const MB = 1048576

//* // **** WEBSOCKET LINK **** \\ **\
const port = window.__tupac__port__

const weso = window.weso = initWeso({
  retryDelay: 2500,
  publish: wesoClient,
  subscribe: wesoServer,
})

weso.on.open((...args) => console.log('open', ...args))
weso.on.close((...args) => console.log('close', ...args))
weso.on.error((...args) => console.error('error', ...args))

// observable state
const selectedFile = observ()

const videoMimes = [ '3gp', '3gpp', 'annodex', 'avi', 'm2ts', 'mp4', 'mpeg',
  'mpeg2', 'ogg', 'quicktime', 'webm', 'x-m2ts', 'x-m4v', 'x-mpeg2', 'x-flv',
  'x-ms-wmv', 'mp2t', 'x-msvideo', 'x-quicktime', '*' ]
  .map(m => `video/${m}`)
  .join()

// interactive elements
const progressBar = bsProgress(0)
const uploadButton = bsBtn.primary('Envoyer')
const userInput = bsForm({
  firstName: { label: 'Nom', required: true },
  lastName: { label: 'Prénom', required: true },
  file: {
    label: 'Fichier Vidéo',
    help: `Veuillez ajouter ici votre vidéo d'une durée de 5 minutes environ.`,
    type: 'file',
    accept: videoMimes,
    class: 'form-control-file',
    required: true,
    onchange: f.pipe([
      f.path('target.files.0'),
      f.hold(selectedFile.set),
      f.path('name'),
      weso.publish.fileChange,
    ]),
  }
})

// init elements state
progressBar.hide()

//* // **** UPLOAD **** \\ **\
const progressCb = f.pipe(f.path('target.result'), 
  weso.publish.uploadProgress)
const readNextBlob = blob => {
  const r = new FileReader()
  r.onload = progressCb
  r.readAsArrayBuffer(blob)
}

weso.uploadStatus(({ data: progress }) => {
  if (!progress) {
    progressBar.setValue(0)
    progressBar.hide()
    uploadButton.disabled = false
    return uploadButton.textContent = 'Envoyer'
  }

  const file = selectedFile()

  progressBar.setValue(progress / file.size)
  progressBar.pause()

  if (progress < file.size) {
    uploadButton.disabled = false
    return uploadButton.textContent = 'Reprendre'
  }
  uploadButton.textContent = 'file already uploaded'
  uploadButton.disabled = true

})

const slice = prefix.call('slice')
weso.uploadReady(({ data: { progress } }) => {
  const file = selectedFile()
  if (progress < file.size) {
    readNextBlob(slice(file, progress, Math.min(chunk + progress), file.size))
    return progressBar.setValue(progress / file.size)
  }
  progressBar.setValue(1)
  progressBar.pause()
  progressBar.hide(2000)
  uploadButton.classList.remove('disabled', 'loading')
  uploadButton.textContent = 'Envoyer'
  uploadButton.disabled = false
})

const container = h('.container')
const content = h('.row.marketing')
const footer = h('footer.footer.text-center')
const header = h('.header.clearfix.text-center')

const weshForm = form({
  onsubmit: ev => {
    ev.preventDefault()
    const { firstName, lastName, file } = userInput.values()

    weso.publish.uploadStart({
      firstName,
      lastName,
      file: {
        name: file.name,
        size: file.size,
      },
    })

    userInput.disableAll()
    uploadButton.classList.add('disabled', 'loading')
    uploadButton.disabled = true
    uploadButton.textContent = 'Envoi en cours'

  },
  style: { margin: '0 auto' },
}, [
  userInput.firstName,
  userInput.lastName,
  userInput.file,
  bsForm.formGroup(progressBar),
  div({ className: 'text-center' }, uploadButton),
])

body.appendChild(container([
  header({
    innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="332px" viewBox="0 0 421.61472 100.00879"><defs><style>.b{fill:#006298;}</style></defs><title>Logo-Elzéar-France-RVB</title><path d="M390.85463,255.08008v5.85937H361.55727v18.75h27.93018v5.85938H361.55727v19.53125h29.8833v5.85938H354.33071V255.08008h36.52393Z" transform="translate(-226.77165 -240.23633)"/><path d="M409.60463,255.08008v50H438.8229v5.85938H402.37807V255.08008h7.22656Z" transform="translate(-226.77165 -240.23633)"/><path d="M487.84633,255.08008v5.85937l-33.47656,44.14063h32.69531v5.85938H445.65883v-5.85937l34.53125-44.14062h-33.75v-5.85937h41.40625Z" transform="translate(-226.77165 -240.23633)"/><path d="M535.89321,255.08008v5.85937H506.59633v18.75H534.526v5.85938H506.59633v19.53125h29.88281v5.85938H499.36977V255.08008h36.52344Zm-16.79687-14.84375h9.33594l-9.33594,9.33594h-6.40625Z" transform="translate(-226.77165 -240.23633)"/><path d="M549.25258,310.93945h-7.5l23.71094-55.85937h8.00781l23.82813,55.85937h-8.00781l-7.22656-17.57812H563.58852l1.99219-5.85937h14.0625l-10.42969-25.3125Z" transform="translate(-226.77165 -240.23633)"/><path d="M604.91665,310.93945V255.08008h23.82813q15.9375,0,15.9375,13.39844,0,10.89844-15.58594,16.13281L648.276,310.93945h-9.53125l-17.77344-25.11719V281.0957q16.01514-2.53857,16.01563-12.30469,0-7.73437-8.90625-7.73437h-15.9375v49.88281h-7.22656Z" transform="translate(-226.77165 -240.23633)"/><path d="M362.9352,327.58887v2.00391h-6.293v3.16406h5.99414v2.083h-6.02051v3.2959h6.44238v2.02148h-8.72754V327.58887h8.60449Z" transform="translate(-226.77165 -240.23633)"/><path d="M377.16128,333.873l-4.94824-6.28418h2.94434l3.47168,4.58789,3.47168-4.58789h2.94434l-4.93945,6.28418,4.93945,6.28418h-2.94434l-3.47168-4.58789-3.47168,4.58789H372.213Z" transform="translate(-226.77165 -240.23633)"/><path d="M403.21694,327.58887v2.00391h-6.293v3.16406h5.99414v2.083H396.8976v3.2959H403.34v2.02148h-8.72754V327.58887h8.60449Z" transform="translate(-226.77165 -240.23633)"/><path d="M423.61342,339.62988a10.37619,10.37619,0,0,1-3.69141.61523q-6.76758,0-6.76758-6.54785,0-6.19629,6.76758-6.19629a10.37619,10.37619,0,0,1,3.69141.61523v2.10938a8.76154,8.76154,0,0,0-3.51562-.70312q-4.52637,0-4.52637,4.1748,0,4.52637,4.52637,4.52637a8.76154,8.76154,0,0,0,3.51563-.70312v2.10938Z" transform="translate(-226.77165 -240.23633)"/><path d="M433.91128,335.21777v-7.62891h2.3291v7.62891q0,3.00586,3.07568,3.00586,3.07617,0,3.07617-3.00586v-7.62891h2.3291v7.62891q0,5.02734-5.40527,5.02734Q433.91152,340.24512,433.91128,335.21777Z" transform="translate(-226.77165 -240.23633)"/><path d="M463.67544,327.58887v2.02148h-3.60352v10.54688h-2.3291V329.61035H454.1393v-2.02148h9.53613Z" transform="translate(-226.77165 -240.23633)"/><path d="M475.42251,327.58887v12.56836h-2.3291V327.58887h2.3291Z" transform="translate(-226.77165 -240.23633)"/><path d="M498.13051,327.58887l-5.51074,12.56836h-2.50488l-5.27344-12.56836H487.61l3.89355,9.624,3.88477-9.624h2.74219Z" transform="translate(-226.77165 -240.23633)"/><path d="M516.153,327.58887v2.00391H509.86v3.16406h5.99414v2.083h-6.02051v3.2959H516.276v2.02148h-8.72754V327.58887H516.153Z" transform="translate(-226.77165 -240.23633)"/><path d="M538.5846,339.71777V338.751a12.93438,12.93438,0,0,0,4.35939.70313q3.94629,0,3.94629-2.98828,0-2.19727-2.56641-2.19727h-2.584q-3.50684,0-3.50684-3.16406,0-3.60352,5.1416-3.60352a15.7932,15.7932,0,0,1,4.08691.52734v0.87891a13.67792,13.67792,0,0,0-4.08691-.61523q-4.21875,0-4.21875,2.8125,0,2.28516,2.584,2.28516h2.584q3.48926,0,3.48926,3.07617,0,3.7793-4.86914,3.7793A16.89967,16.89967,0,0,1,538.5846,339.71777Z" transform="translate(-226.77165 -240.23633)"/><path d="M566.53872,327.58887v0.791h-7.33008v5.00977h7.03125v0.791h-7.03125v5.18555h7.45313v0.791h-8.376V327.58887h8.25293Z" transform="translate(-226.77165 -240.23633)"/><path d="M577.24086,340.15723h-0.98437l5.68652-12.56836h1.09863l5.71289,12.56836H587.6559l-1.86328-4.21875h-5.63379l0.27246-.791h5.01855l-3.01465-6.83789Z" transform="translate(-226.77165 -240.23633)"/><path d="M598.568,340.15723V327.58887h5.18555q3.41016,0,3.41016,3.01465,0,2.61035-3.7002,3.7002l4.24512,5.85352H606.443l-4.1748-5.82715v-0.624q3.86719-.57129,3.86719-3.03223,0-2.26758-2.53125-2.26758h-4.11328v11.751H598.568Z" transform="translate(-226.77165 -240.23633)"/><path d="M627.19106,339.71777a11.88775,11.88775,0,0,1-3.51562.52734q-6.5918,0-6.5918-6.54785,0-6.19629,6.5918-6.19629a11.88775,11.88775,0,0,1,3.51563.52734v0.791a11.32717,11.32717,0,0,0-3.33984-.52734q-5.84473,0-5.84473,5.40527,0,5.75684,5.84473,5.75684a11.32717,11.32717,0,0,0,3.33984-.52734v0.791Z" transform="translate(-226.77165 -240.23633)"/><path d="M637.97133,340.15723V327.58887h0.92285v5.80078h8.56934v-5.80078h0.92285v12.56836h-0.92285v-5.97656h-8.56934v5.97656h-0.92285Z" transform="translate(-226.77165 -240.23633)"/><path class="b" d="M294.30761,258.5642l-3.36255,17.42L308.365,272.6215a4.252,4.252,0,0,0,3.44606-4.17489V255.11811H298.48251A4.252,4.252,0,0,0,294.30761,258.5642Z" transform="translate(-226.77165 -240.23633)"/><path class="b" d="M285.81138,274.40614l4.47928-19.288H276.40975a5.66929,5.66929,0,0,0-4.70416,2.50516l-17.06376,25.36892,27.83371-5.373A4.252,4.252,0,0,0,285.81138,274.40614Z" transform="translate(-226.77165 -240.23633)"/><polygon class="b" points="39.834 14.882 18.511 14.882 22.345 38.887 39.834 14.882"/><path class="b" d="M283.93688,312.28759l25.369-17.0638a5.66929,5.66929,0,0,0,2.50516-4.70416v-13.881L292.52291,281.118a4.252,4.252,0,0,0-3.213,3.33583Z" transform="translate(-226.77165 -240.23633)"/><path class="b" d="M257.13395,340.15746H311.811v-12.636l-28.67194-3.48286a8.50394,8.50394,0,0,0-6.03287,1.56854Z" transform="translate(-226.77165 -240.23633)"/><path class="b" d="M239.40762,255.11811h-12.636v54.677l14.5503-19.97229a8.50394,8.50394,0,0,0,1.56854-6.03286Z" transform="translate(-226.77165 -240.23633)"/><polygon class="b" points="85.039 81.41 85.039 60.087 61.034 77.576 85.039 81.41"/><path class="b" d="M283.78124,283.14819L252.386,290.439a8.50394,8.50394,0,0,0-5.13257,3.53729l-20.48179,30.45037v15.73077h15.7307l30.45045-20.48187a8.50394,8.50394,0,0,0,3.53726-5.13246Z" transform="translate(-226.77165 -240.23633)"/></svg>',
  }),
  content(weshForm),
  footer(small('© Elzéar 2017')),
]))
