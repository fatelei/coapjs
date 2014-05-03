/*
 * CoAP Response Handler
 *
 */

// own module
var OutcomeMessage = require("./message/out");

function CoAPResponse (messageId, token, msgType) {
  var empty = new Buffer(0);
  this.msgType = msgType;

  this.packet = {
    ack: false,
    confirm: false,
    reset: false,
    unconfirm: false,
    messageId: messageId,
    token: token,
    options: [],
    payload: empty,
    code: "2.05"
  };

  if (msgType === 'confirm') {
    this.packet.ack = true;
  } else if (msgType === 'unconfirm') {
    this.packet.unconfirm = true;
  }
}

module.exports = CoAPResponse;

// set response header
CoAPResponse.prototype.setHeader = function (key, value) {
  var that = this;

  if (typeof value === 'object' || typeof value === 'number') {
    value = JSON.stringify(value);
  }

  that.packet.options.push({"name": key, "value": new Buffer(value)});
};

// set status code
CoAPResponse.prototype.setStatusCode = function (code) {
  var that = this;

  that.packet.code = code;
};

// finish
CoAPResponse.prototype.end = function (payload) {
  var that = this;

  if (typeof payload === 'object') {
    payload = JSON.stringify(payload);
  }


  that.packet.payload = new Buffer(payload);
  var out    = new OutcomeMessage(that.packet);

  var binary = out.generate();
  return binary;
};
