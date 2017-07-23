module.exports = init

var Emitter = require('events').EventEmitter
  , Websocket = require('ws')

function init(callback) {
  callback(null, 'zway', Zway)
}

function Zway(automait, logger, config) {
  Emitter.call(this)
  this.automait = automait
  this.logger = logger
  this.config = config
  this.currentState = {}
}

Zway.prototype = Object.create(Emitter.prototype)

Zway.prototype.init = function () {
  connect.call(this)
}

function connect() {
  var ws = new Websocket('ws://' + this.config.host + ':' + this.config.port)

  ws.on('open', function () {
    ws.on('message', function (data) {
      data = JSON.parse(data)
      if (data && data.data && data.type === 'me.z-wave.notifications.add') {
        data = JSON.parse(data.data)
        var id = data.source.replace('ZWayVDev_zway_', '')
          , newValue = data.message.l ? data.message.l.split(' ')[0] : null
          , deviceName = this.config.devices[id]
        if (!deviceName) return
        this.emit(deviceName + ':' + newValue)
        this.emit(deviceName + ':change', newValue)
      }
    }.bind(this))

    ws.on('close', function () {
      setTimeout(function () {
        connect.call(this)
      }.bind(this), 2000)
    }.bind(this))

  }.bind(this))

  ws.on('error', function (error) {
    this.logger.error('Error with Zway:')
    this.logger.error(error)
    setTimeout(function () {
      connect.call(this)
    }.bind(this), 2000)
  }.bind(this))
}
