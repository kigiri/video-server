const http = require('http')
const { resolve } = require('path')
const { stat, open, write, mkdir } = require('izi/mz')('fs')
const { split, remove } = require('izi/str')
const merge = require('izi/collection/merge')
const map = require('izi/collection/map')
const initWeso = require('izi/weso-node')
const curry = require('izi/auto-curry')
const oops = require('izi/oops')
const f = require('izi/flow')
const tupac = require('tupac/lib/tupac')
const common = require('./common.js')

const notFound = oops('ENOENT')
const sendError = curry((code, message, res) => {
  res.writeHead(code, { "Content-Type": "text/plain" })
  res.end(`${code} ${message}\n`)
})

const send401 = sendError(401, 'Access Denied')
const send404 = sendError(404, 'Not Found')
const send500 = sendError(500, 'Internal Server Error')
const next = res => res.emit && res.emit('next')
const tmpDir = resolve('tmp')

stat(tmpDir).catch(() => mkdir(tmpDir))

tupac({
  weso: true,
  before: [ (req, res) => {
    const session = weso.getOrInitSession(req, res, {
      superSecure: 'true dat !!',
    })

    switch (req.url) {
      case '/video':
      case '/video/':
      case '/server':
      case '/server/': return send401(res)
      //case '/app.js': {}
    }
    next(res)
  } ]
}).then((server) => {
  global.weso = initWeso({
    server,
    subscribe: common.wesoClient,
    publish: common.wesoServer,
    secret: 'oh lol this is fun',
    //secure: { key, cert },
    login: true,
  })

  weso.uploadStart(uploadStart)
  weso.uploadProgress(uploadProgress)

  setInterval(() => {
    //weso.publish.debug(('lol'))
  }, 1000)

}).catch(console.error)

const files = Object.create(null)
const chunk = 64 * 1024

const uploadDone = ({ ws }) => {
  files[ws.id] = undefined
  console.log('file written')
  //Get Thumbnail Here
  /*

  var inp = fs.createReadStream("Temp/" + Name);
  var out = fs.createWriteStream("Video/" + Name);
  util.pump(inp, out, function(){
    fs.unlink("Temp/" + Name, function () { //This Deletes The Temporary File
      //Moving File Completed
    });
  });

  exec("ffmpeg -i Video/" + Name  + " -ss 01:30 -r 1 -an -vframes 1 -f mjpeg Video/" + Name  + ".jpg", function(err){
    socket.emit('Done', {'Image' : 'Video/' + Name + '.jpg'});
  });
  */
}

const uploadProgress = ({ data, ws }) => {
  const file = files[ws.id]
  file.progress += chunk
  write(file.fd, data, null, 'binary')
    .then(() => {
      console.log('sending progress', file.progress)
      ws.uploadReady({ progress: file.progress })
    })
    .catch(err => {
      err.stack = undefined
      ws.uploadError(err)
    })
}

const uploadStart = ({ data, ws }) => {
  const name = data.file.name
  const filepath = `tmp/${name}`
  const file = files[ws.id] = { filepath, name, size: data.file.size }
  Promise.all([
    stat(filepath).then(f.path('size')).catch(() => 0),
    open(filepath, "a", 0755),
  ]).then(([ progress, fd ]) => {
      file.fd = fd
      file.progress = progress
      console.log('sending progress', progress)
      ws.uploadReady({ progress })
    })
    .catch(console.log)
}
