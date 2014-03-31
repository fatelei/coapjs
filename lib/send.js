/*
 * cover the communicat between client and server
 */ 

// core module
var util   = require("util");
var events = require("events");

// own module
var params = require("./utils/parameters");

function CoAPSend (socket, port, host) {
  this.socket = socket;
  this.port   = port;
  this.host   = host;

  this.retransCounter = 0;
  this.inteval        = params.ackTimeout * (1 + (params.ackRandomFactor - 1) * Math.random());

  this.backOffTimer   = null;

  // backoff retransmit
  this.exponentially = function (isBackOff) {
    this.inteval *= 2;
    this._write(); 
  };

  events.EventEmitter.call(this);
}

util.inherits(CoAPSend, events.EventEmitter);
module.exports = CoAPSend;

// clean timer schedule
CoAPSend.prototype.clearTimer = function () {
  var that = this;

  clearTimeout(that.backOffTimer);
};

/* 
 * send data
 * when message is ack, reset, 
 */
CoAPSend.prototype._write = function () {
  var that = this;

  if (that.packet !== undefined) {
    that.socket.send(that.packet, 0, that.packet.length, that.port, that.host, function (err, bytes) {
      if (err) {
        that.emit("error", err);
      } else {
        that.emit("sent", bytes);
      }
    });
  }
};


/*
 * start back off
 */
CoAPSend.prototype.backOff = function () {
  var that = this;

  if (that.isBackOff && ++that.retransCounter < params.maxRetransmit) {
    that.backOffTimer = setTimeout(that.exponentially, that.inteval);
  }
};

/*
 * 
 */
CoAPSend.prototype.send = function (packet, isBackOff) {
  var that = this;

  that.packet    = packet;
  that.isBackOff = isBackOff;
  
  that._write();

  if (isBackOff) {
    that.exchangeTimer = setTimeout(function () {
      var err = new Error('No reply in ' + params.exchangeLifetime + 's')
      that.emit("over", err);
    }, params.exchangeLifetime);
  }
};
