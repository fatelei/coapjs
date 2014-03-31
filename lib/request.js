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
  this.packet      = packet;

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

  try {
    realPacket = inMsg.parse();
    msgType    = realPacket.type;

    // it's confirm type message
    if (msgType.confirm) {
      // should reply with ack
      that.emit("confirm", realPacket);

    } else if (msgType.unconfirm) {
      // should reply with unconfirm
      that.emit("unconfirm", realPacket);
    }
  } catch (err) {
    // the packet has format error
    // using reset message to response
    // must be a empty message, code 0.00
    console.log(err.stack);
    that.emit("error", err);
  }
};

