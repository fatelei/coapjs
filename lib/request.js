/*
 * coap request handler
 *
 */


// core module
var util   = require("util");
var events = require("events"); 

// own module
var IncomeMessage = require("./message/in");


function CoAPRequest (packet) {
  this.packet  = packet;
  this.method  = null;
  this.path    = null;
  this.params  = {};
  this.headers = {};
  this.mid     = null;
  this.token   = null;
  this.msgType = null;
  events.EventEmitter.call(this);
}

util.inherits(CoAPRequest, events.EventEmitter);
module.exports = CoAPRequest;


// handle request
CoAPRequest.prototype.handleRequest = function () {
  var that       = this;
  var msgType    = null;
  var realPacket = null;
  var inMsg      = new IncomeMessage(that.packet);
  var tmpPath    = [];

  try {
    realPacket = inMsg.parse();
    
    for (var k in realPacket.type) {
      if (realPacket.type.hasOwnProperty(k)) {
        if (realPacket.type[k]) {
          that.msgType = k;
          break;
        }
      }
    }

    that.mid        = realPacket.messageId;
    that.token      = realPacket.token;

    // get method
    switch (realPacket.code) {
      case "0.01":
        that.method = "GET";
        break;
      case "0.02":
        that.method = "POST";
        break;
      case "0.03":
        that.method = "PUT";
        break;
      case "0.04":
        that.method = "DELETE";
        break;
    }

    // get Uri-Path and Uri-Query
    for (var i = 0; i < realPacket.options.length; i++) {
      if (realPacket.options[i].type === "Uri-Path") {
        tmpPath.push(realPacket.options[i].value);
      } else if (realPacket.options[i].type === "Uri-Query") {
        var tmp = realPacket.options[i].value.split("=");
        that.params[tmp[0]] = tmp[1];
      } else {
        that.headers[realPacket.options[i].type] = realPacket.options[i].value;
      }
    }

    that.path = tmpPath.join("/");
    // emit request event
    that.emit("request", that);
  } catch (err) {
    // the packet has format error
    // using reset message to response
    // must be a empty message, code 0.00
    console.log(err.stack);
    that.emit("error", err);
  }
};

