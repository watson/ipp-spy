# ipp-spy

Listen for IPP requests on a given port and proxy requests to a real IPP
printer. Allows for spying on the traffic between the client and the
server.

[![Build status](https://travis-ci.org/watson/ipp-spy.svg?branch=master)](https://travis-ci.org/watson/ipp-spy)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

## Installation

```
npm install ipp-spy --save
```

## Usage Example

Start an IPP printer spy on port 3000 and proxy all requests to
`example.com`:

```js
var spy = require('ipp-spy')

var opts = {
  port: 3000
  forwardHost: 'example.com', // defaults to localhost
  forwardPort: 631            // default to 631
}

spy(opts, function (operation, document) {
  console.log('New IPP operation:', operation)

  var bytes = 0
  document.on('data', function (chunk) {
    bytes += chunk.length
  })
  document.on('end', function () {
    console.log('Attached document size: %d bytes', bytes)
  })
})
```

## API

The module exposes a generator function which creates a new spy proxy.
An EventEmitter is returned:

```js
var server = spy(options[, onOperation])
```

Options:

- `port` - the port that the spy should listen on
- `forwardHost` - the host to forward requests to (defaults to
  `localhost`)
- `forwardPort` - the port to forward requests to (defaults to `631`)

The optional `onOperation` callback argument will be attached to the
`operation` event emitted by the returned EventEmitter.

The returned EventEmitter can emmit the following events:

### Event: connection

```js
function (client, server) {}
```

Emitted every time a new TCP connection is made to the spy proxy.

- `client` - a TCP socket streaming the data coming from the client
- `server` - a TCP socket streaming the data returned from the server

### Event: operation

```js
function (operation, document) {}
```

Emitted every time an IPP request is sent to the spy.

The callback is called with two arguments:

- `operation` - the IPP opperation metadata. See
  [ipp-encoder](https://github.com/watson/ipp-encoder#ipprequestdecodebuffer-start-end)
  for details
- `document` - a readable stream containing the body of the IPP request
  (i.e. the document being printed)

## License

MIT
