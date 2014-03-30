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
  this.backOff = function () {
    this.inteval *= 2;
    this.send(); 
  };

  events.EventEmitter.call(this);
}

util.inherits(CoAPSend, events.EventEmitter);
module.exports = CoAPSend;

// clean timer schedule
CoAPSend.prototype.cleanTimer = function () {

};

/* 
 * send data
 * when message is ack, reset, 
 */
CoAPSend.prototype.send = function (isBackOff) {
  var that = this;

  if (isBackOff && ++that.retransCounter < params.maxRetransmit) {
    that.backOffTimer = setTimeout(that.backOff, that.inteval);
  }

  
};



