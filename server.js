const http = require('http')
const { resolve, extname } = require('path')
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
const vidDir = resolve('video')

Promise.all([ tmpDir, vidDir ].map(dir => stat(dir).catch(() => mkdir(dir))))
  .catch(console.error)

tupac({
  weso: true,
  title: 'Elzéar vidéo server (beta)',
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
  weso.uploadDone(uploadDone)
  weso.fileChange(fileChange)

}).catch(console.error)

const orZero = () => 0
const _size = f.path('size')
const getFileSize = path => stat(path).then(_size, orZero)
const tmpName = name => `${tmpDir}/${name}.part`

const fileChange = ({ data, ws }) => getFileSize(tmpName(data))
  .then(ws.uploadStatus)

const uploadStart = ({ data: { file }, ws }) => {
  file.path = tmpName(file.name)
  ws.session.file = file

  Promise.all([ getFileSize(file.path), open(file.path, "a", 0755) ])
    .then(([ progress, fd ]) => {
      file.fd = fd
      file.progress = progress
      ws.uploadReady({ progress })
    })
    .catch(console.log)
}

const uploadProgress = ({ data, ws }) => {
  const file = ws.session.file
  file.progress += common.chunk
  write(file.fd, data, null, 'binary')
    .then(() => ws.uploadReady({ progress: file.progress }))
    .catch(err => {
      err.stack = undefined
      ws.uploadError(err)
    })
}

const uploadDone = ({ ws }) => {
  const file = ws.session.file
  files[ws.id] = undefined
  rename(file.path, `${vidDir}/${file.name}`)
    .then(() => console.log('file ${file.name} uploaded'), console.error)

ffmpeg('/path/to/file.avi')

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
