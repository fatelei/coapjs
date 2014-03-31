/*
 * coap client
 */

// core module
var util   = require("util");
var events = require("events");
var dgram  = require("dgram");

// own module
var CoAPSend       = require("./send");
var generateMsgId  = require("./utils/msgid").generateMsgId;
var generateToken  = require("./utils/token").generateToken;
var OutcomeMessage = require("./message/out");
var IncomeMessage  = require("./message/in");
var CoAPSend       = require("./send");

function CoAPClient (port, host, type) {
  var that  = this;

  this.port = port;
  this.host = host;

  this.curMsgId = null;
  this.curToken = null;

  this.options = [];
  this.nextMsgId = generateMsgId();
  this.nextToken = generateToken();

  this.packet = {
    ack: false,
    confirm: false,
    reset: false,
    unconfirm: false,
    options: [],
    payload: new Buffer(0)
  };

  if (type === undefined) {
    this.socket = dgram.createSocket("udp4");
  } else if (type === "udp6") {
    this.socket = dgram.createSocket(type);
  }

  this.send = new CoAPSend(that.socket, that.port, that.host);

  this.socket.on("message", function (msg, rinfo) {
    var inMsg     = new IncomeMessage(msg);
    var unpackMsg = inMsg.parse();
  
    if (that.packet.messageId === unpackMsg.messageId) {
      that.emit("message", unpackMsg);
    }
  });

  events.EventEmitter.call(this);
}

util.inherits(CoAPClient, events.EventEmitter);
module.exports = CoAPClient;


// set options
CoAPClient.prototype.setOption = function (key, value) {
  var that = this;

  that.packet.options[key] = value;
};


// send confirm message
CoAPClient.prototype.sendConfirm = function (code) {
  var that      = this;
  var isBackOff = true;

  that.packet.confirm   = true;
  that.packet.messageId = that.nextMsgId();

  if (code === undefined) {
    that.packet.code  = "0.00";
    that.packet.token = new Buffer(0);
  } else {
    that.packet.code  = code;
    if (code === "0.00") {
      if (that.packet.options.length !== 0) {
        var err = new Error("packet error");
        throw err;
      } else {
        that.packet.token = new Buffer(0);
      }
    } else {
      that.packet.token = that.nextToken();
    }
  }

  var out     = new OutcomeMessage(that.packet);
  var message = out.generate();

  that.send.on("error", function (err) {
    that.send.backOff();
  });

  that.send.send(message, isBackOff);
};

// send non confirm message
CoAPClient.prototype.sendNonconfirm = function (code) {
  var that      = this;
  var isBackOff = false;

  that.packet.unconfirm = true;

  if (code === undefined) {
    that.code = "0.00";
    if (that.packet.options.length !== 0) {
      var err = new Error("packet error");
      throw err;
    }
    that.packet.token = new Buffer(0);
  } else {
    that.packet.code = code;
    if (code === "0.00") {
      if (that.packet.options.length !== 0) {
        var err = new Error("packet error");
        throw err;
      } else {
        that.packet.token = new Buffer(0);
      }
    } else {
      that.packet.code  = code;
      that.packet.token = that.nextToken();
    }
  }

  that.send.send(message, isBackOff);
};
