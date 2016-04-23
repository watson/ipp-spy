'use strict'

var net = require('net')
var http = require('http')
var PassThrough = require('readable-stream').PassThrough
var debug = require('debug')('ipp-spy')
var tcpSpy = require('tcp-spy')
var pump = require('pump')
var thunky = require('thunky')
var ipp = require('ipp-encoder')

module.exports = function (opts, onoperation) {
  if (!opts.port) opts.port = 631

  var spy = tcpSpy(opts)
  if (onoperation) spy.on('operation', onoperation)

  var getHttpServer = thunky(function (cb) {
    var server = http.createServer(function (req, res) {
      var body

      debug('new http request')

      req.on('data', consumeAttrGroups)

      function consumeAttrGroups (chunk) {
        body = body ? Buffer.concat([body, chunk]) : chunk

        try {
          var operation = ipp.request.decode(body)
        } catch (e) {
          debug('incomplete IPP body - waiting for more data...')
          return
        }

        req.removeListener('data', consumeAttrGroups)

        debug('IPP operation %d detected', operation.operationId)

        var stream = new PassThrough()

        // partial body remains after headers have been read
        if (ipp.request.decode.bytes < body.length) {
          stream.write(body.slice(ipp.request.decode.bytes))
        }

        pump(req, stream)
        spy.emit('operation', operation, stream)
      }
    })

    debug('starting http server')

    server.listen(function () {
      debug('http server is listening on port %d', server.address().port)
      cb(null, server)
    })
  })

  getHttpServer(function (err, httpServer) {
    if (err) return spy.emit('error', err)

    spy.on('connection', function (source) {
      debug('new TCP connection')

      var copy = net.connect(httpServer.address().port)

      source.on('data', function (chunk) {
        copy.write(chunk)
      })

      source.on('close', function () {
        copy.end()
      })
    })
  })

  return spy
}
