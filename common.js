module.exports = {
  chunk: 64 * 1024,
  wesoClient: [
    'uploadStart',
    'uploadProgress',
    'uploadDone',
    'fileChange',
  ],
  wesoServer: [
    'uploadStatus',
    'uploadReady',
    'uploadError',
    'processingEnd',
    'processingError',
    'debug',
    'tupac',
  ],
}