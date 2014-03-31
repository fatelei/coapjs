/*
 * CoAP Response Handler
 *
 */

// own module
var OutcomeMessage = require("./message/out");

function CoAPResponse (reqInfo) {
  var empty = new Buffer(0);

  this.packet = {
    ack: false,
    confirm: false,
    reset: false,
    unconfirm: false,
    messageId: reqInfo.messageId,
    token: reqInfo.token,
    options: [],
    payload: empty
  };
}

module.exports = CoAPResponse;

// generate ack message
CoAPResponse.prototype.genAck = function (code, payload, cb) {
  var that     = this;
  var callback = null;

  that.packet.ack  = true;

  if (typeof code === "function") {
    that.packet.code = "0.00";
    callback = code;
  } else if (typeof payload === "function") {
    that.packet.code = code;
    callback = payload;
  } else {
    that.packet.code    = code;
    that.packet.payload = new Buffer(payload, payload.length);
    callback = cb;
  }

  var out    = new OutcomeMessage(that.packet);
  try {
    var binary = out.generate();
    return callback(null, binary);
  } catch (err) {
    return callback(err, null);
  }
};

// generate reset message
CoAPResponse.prototype.genReset = function (callback) {
  var that = this;

  that.packet.reset = true;
  that.packet.code  = "0.00";

  var out    = new OutcomeMessage(that.packet);
  try {
    var binary = out.generate();
    return callback(null, binary);
  } catch (err) {
    return callback(err, null);
  }
};


// generate unconfirm message 
CoAPResponse.prototype.genUnconfirm = function (code, payload, callback) {
  var that = this;

  that.packet.unconfirm = true;

  if (typeof code === "function") {
    that.packet.code = "0.00";
  } else if (typeof payload === "function") {
    that.packet.code = code;
  } else {
    that.packet.code    = code;
    that.packet.payload = new Buffer(payload, payload.length); 
  }

  var out    = new OutcomeMessage(that.packet);
  try {
    var binary = out.generate();
    return callback(null, binary);
  } catch (err) {
    return callback(err, null);
  }
};
