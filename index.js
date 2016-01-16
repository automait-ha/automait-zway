module.exports = init

var Emitter = require('events').EventEmitter
  , request = require('request')

function init(callback) {
  callback(null, 'zway', Zway)
}

function Zway(automait, logger, config) {
  Emitter.call(this)
  this.automait = automait
  this.logger = logger
  this.config = config
  this.lastUpdateTime = 0
  this.deviceValues = {}

  Object.keys(this.config.devices).forEach(function (id) {
    this.deviceValues[id] = null
  }.bind(this))
}

Zway.prototype = Object.create(Emitter.prototype)

Zway.prototype.init = function () {
  pollForChanges.call(this)
}

function pollForChanges() {
  setInterval(function () {
    var url = 'http://' + this.config.username + ':' + this.config.password + '@'
      + this.config.host + ':' + this.config.port
      + '/ZAutomation/api/v1/devices?since=' + this.lastUpdateTime

    request(url, function (error, res, body) {
      if (error) {
        this.logger.error('Error polling Zway:')
        this.logger.error(error)
        return
      }
      this.lastUpdateTime = Math.round(Date.now() / 1000)
      body = JSON.parse(body)

      body.data.devices.forEach(function (device) {
        var id = device.id.replace('ZWayVDev_zway_', '')
          , currentValue = this.deviceValues[id]
          , newValue = device.metrics.level

        if (!currentValue) {
          this.deviceValues[id] = newValue
        } else if (currentValue !== newValue) {
          this.deviceValues[id] = newValue
          this.emit(this.config.devices[id] + ':' + newValue)
          this.emit(this.config.devices[id] + ':change', newValue)
        }
      }.bind(this))

    }.bind(this))

  }.bind(this), this.config.pollInterval || 2000)
}
