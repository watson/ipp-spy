'use strict'

var http = require('http')
var test = require('tape')
var ipp = require('ipp-encoder')
var spy = require('./')

test(function (t) {
  t.plan(4)

  var server = http.createServer(function (req, res) {
    var buffers = []
    req.on('data', buffers.push.bind(buffers))
    req.on('end', function () {
      var data = Buffer.concat(buffers)
      var decoded = ipp.request.decode(data)

      t.deepEqual(decoded, {
        version: { major: 1, minor: 1 },
        operationId: 1,
        requestId: 1,
        groups: []
      })

      res.end(ipp.response.encode({ statusCode: 200, requestId: decoded.requestId }))
    })
  })

  server.unref()

  server.listen(function () {
    spy({ port: 3210, forwardPort: server.address().port }, function (operation, document) {
      t.deepEqual(operation, {
        version: { major: 1, minor: 1 },
        operationId: 1,
        requestId: 1,
        groups: []
      })

      var buffers = []
      document.on('data', buffers.push.bind(buffers))
      document.on('end', function () {
        var data = Buffer.concat(buffers)

        t.deepEqual(new Buffer('foobar'), data)
      })
    })

    var data = ipp.request.encode({ operationId: 1, requestId: 1 })
    var req = http.request({ method: 'POST', port: 3210 }, function (res) {
      var buffers = []
      res.on('data', buffers.push.bind(buffers))
      res.on('end', function () {
        var data = Buffer.concat(buffers)
        var decoded = ipp.response.decode(data)

        t.deepEqual(decoded, {
          version: { major: 1, minor: 1 },
          statusCode: 200,
          requestId: 1,
          groups: []
        })
      })
    })

    // send everything in one write to complicate seperation of header and body
    req.end(Buffer.concat([data, new Buffer('foobar')]))
  })
})

test('end', function (t) {
  t.end()
  process.exit()
})
