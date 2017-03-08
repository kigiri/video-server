const h = require('izi/vanilla-h')
const f = require('izi/flow')
const observ = require('izi/emiter/observ')
const wsInit = require('./ws')
const bsAlert = require('./bs/alert')
const bsProgress = require('./bs/progress')
const bsBtn = require('./bs/btn')
const bsForm = require('./bs/form')
const prefix = require('izi/prefix')
const { chunk } = require('./common.js')

// observable state
const selectedFile = observ()

const videoMimes = [ '3gp', '3gpp', 'annodex', 'avi', 'm2ts', 'mp4', 'mpeg',
  'mpeg2', 'ogg', 'quicktime', 'webm', 'x-m2ts', 'x-m4v', 'x-mpeg2', 'x-flv',
  'x-ms-wmv', 'mp2t', 'x-msvideo', 'x-quicktime', '*' ]
  .map(m => `video/${m}`)
  .join()

// prepared elements
const { form } = h.proxy
const alertLink = h('a.alert-link')

module.exports = () => {
  const ws = wsInit()
  const progressCb = f.pipe(f.path('target.result'), ws.publish.uploadProgress)
  // interactive elements
  const alertBox = bsAlert(' .. ')
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
        ws.publish.fileChange,
      ]),
    }
  })

  // init elements state
  progressBar.hide()
  alertBox.hide()

  const readNextBlob = blob => {
    const r = new FileReader()
    r.onload = progressCb
    r.readAsArrayBuffer(blob)
  }

  const centred = h('.text-center')

  const onsubmit = ev => {
    ev.preventDefault()
    const { firstName, lastName, file } = userInput.values()

    if (file.uploading) {
      file.uploading = false
      return uploadButton.primary.enable('Reprendre')
    }

    ws.publish.uploadStart({
      firstName,
      lastName,
      file: { name: file.name, size: file.size },
    })

    file.uploading = true
    userInput.disableAll()
    uploadButton.warning('Suspendre')
    alertBox.info('Envoi en cours')
  }

  ws.processingEnd(({ data: videoHash }) => {
    if (progressBar.textContent !== ' ') return
    progressBar.pause()
    progressBar.hide(2000)
    alertBox.success([
      'Votre video est prete, ',
      alertLink({ href: `#v=${videoHash}` }, 'regardez-la maintenant'),
    ])
  })

  ws.uploadError(({ data }) =>
    alertBox.danger(`Erreur lors de l'envoi : ${data}`))

  ws.processingError(({ data }) =>
    alertBox.danger(`Erreur lors de l'encodage : ${data}`))

  ws.on.close(() => alertBox.error(`connexion avec le serveur perdu`))
  ws.on.open(() => alertBox.success(`connexion avec le serveur reussi`))
  ws.on.error(console.error)

  ws.uploadStatus(({ data: progress }) => {
    if (!progress) {
      progressBar.setValue(0)
      progressBar.hide()
      return uploadButton.enable('Envoyer')
    }

    const file = selectedFile()

    progressBar.setValue(progress / file.size)
    progressBar.pause()

    if (progress < file.size) return uploadButton.enable('Reprendre')
    alertBox.warning(`Fichier déja existant`)
    uploadButton.disable()
  })

  const slice = prefix.call('slice')
  ws.uploadReady(({ data: { progress } }) => {
    const file = selectedFile()
    if (progress < file.size) {
      if (!file.uploading) return progressBar.pause()

      readNextBlob(slice(file, progress, Math.min(chunk + progress), file.size))
      return progressBar.setValue(progress / file.size)
    }
    progressBar.setValue(2, ' ')
    alertBox.info('Encodage de la vidéo')
    uploadButton.hide()
    ws.publish.uploadDone()
  })

  return form({ onsubmit, style: { margin: '0 auto' } }, [
    userInput.firstName,
    userInput.lastName,
    userInput.file,
    bsForm.formGroup(progressBar),
    alertBox,
    centred(uploadButton),
  ])
}
