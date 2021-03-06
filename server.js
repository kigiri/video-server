const http = require('http')
const { resolve, extname } = require('path')
const mz = require('izi/mz')
const { split, remove } = require('izi/str')
const merge = require('izi/collection/merge')
const map = require('izi/collection/map')
const initWeso = require('izi/weso-node')
const curry = require('izi/auto-curry')
const filter = require('izi/collection/filter')
const oops = require('izi/oops')
const f = require('izi/flow')
const uuid = require('izi/uuid')
const tupac = require('tupac/lib/tupac')
const common = require('./common.js')
const ffmpeg = require('fluent-ffmpeg')
const { stat, open, write, mkdir, writeFile } = mz('fs')
const { ffprobe } = mz(ffmpeg)
//const { parse: parseUrl } = require('url')

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
    //const videoId = req.url.split(/^\/watch\/([A-Za-z0-9_-]{0,6})/)[1]
    //console.log(req.headers)
    //const { pathname } = parseUrl(req.url)
/*
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
    */
    next(res)
  } ]
}).then((server) => {
  global.weso = initWeso({
    server,
    subscribe: common.wesoClient,
    publish: common.wesoServer,
    //secret: 'oh lol this is fun',
    //secure: { key, cert },
    //login: true,
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
  .then(ws.uploadStatus, console.error)

const uploadStart = ({ data, ws }) => {
  const { file } = Object.assign(ws.session, data)

  file.path = tmpName(file.name)

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
    .catch(err => ws.uploadError(err.message))
}

const getUuid = () => {
  const id = uuid().slice(0, 6)
  return stat(`${vidDir}/${id}.json`).then(getUuid, () => id)
}

const getStreamType = type => f.pipe(f.path('streams'),
  filter(s => s.codec_type === type),
  f.path('0'))

const getAudio = getStreamType('audio')
const getVideo = getStreamType('video')

const uploadDone = ({ ws }) => {
  const file = ws.session.file
  ws.session.file = undefined
  Promise.all([
    getUuid(),
    ffprobe(file.path),
  ]).then(([ id, metadata ]) => {
    const { width, height, avg_frame_rate } = getVideo(metadata)
    const fps = eval(avg_frame_rate)
    const output = `${vidDir}/${id}${extname(file.name)}`
    const ext = extname(file.name)
    const dataFile = `${vidDir}/${id}.json`
    const dataContent = JSON.stringify({
      id,
      ext,
      fps,
      width,
      height,
      date: Date.now(),
      name: file.name,
      size: file.size,
      lastName: ws.session.lastName,
      firstName: ws.session.firstName,
    })

    const ffmpegStream = ffmpeg(file.path)
      .videoCodec('libx264')
      .videoBitrate('1024k')
      .renice(5)
      .audioCodec('libmp3lame')
      .audioChannels(1)

    if (fps > 29.7) {
      ffmpegStream.fps(29.7)
    }

    if (width > 720) {
      ffmpegStream.size('720x?')
    } else if (height > 405) {
      ffmpegStream.size('?x405')
    }

    ffmpegStream
      .on('error', err => ws.processingError(err.message))
      .on('end', () => ws.processingEnd(id))
      .save(output)

    console.log(`saving file to ${output}`)

    return writeFile(dataFile, dataContent)
  }).catch(console.error)
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

$ ffmpeg -re -i input.mkv -c:v libx264 -preset veryfast -maxrate 3000k \
-bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 \
-ar 44100 -f flv rtmp://live.twitch.tv/app/<stream key>
  */
}
