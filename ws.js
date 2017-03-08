const initWeso = require('izi/weso-browser')
const { wesoServer, wesoClient } = require('./common.js')

//* // **** WEBSOCKET LINK **** \\ **\
const port = window.__tupac__port__

module.exports = () => window.weso || (window.weso = initWeso({
  retryDelay: 2500,
  publish: wesoClient,
  subscribe: wesoServer,
}))
