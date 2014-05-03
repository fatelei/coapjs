/*
 * reponse message
 */


// own module
var sortArrayByObject = require("../utils/sort").sortArrayByObject;

// config
var macro = require("../macro/macro.json");


function OutcomeMessage (packet) {
  this.packet = packet;
  this.binary = 0;
}

module.exports = OutcomeMessage;


// generate binary message
OutcomeMessage.prototype.generate = function () {
  var that          = this;
  var packetLength  = 0;
  var pos           = 0;

  var binaryOptions = that.setOptons();


  packetLength += that.packet.payload.length + that.packet.token.length + 4;

  if (that.packet.code !== "0.00" && that.packet.payload.length !== 0) {
    packetLength += 1;
  }

  for (var i = 0; i < binaryOptions.length; i++) {
    packetLength += binaryOptions[i].length;
  }

  var buffer = new Buffer(packetLength);

  /* -- write coap header -- */

  that.setVersion();
  that.setType();
  that.setTkl();

  buffer.writeUInt8(that.binary, pos++);

  var code = that.setCode();

  // write code
  buffer.writeUInt8(code, pos++);
  
  // write messageid
  buffer.writeUInt16BE(that.packet.messageId, pos);
  pos += 2;
  

  /* -- write body -- */

  // write token
  that.packet.token.copy(buffer, pos);
  pos += that.packet.token.length;

  // write options
  for (var i = 0; i < binaryOptions.length; i++) {
    binaryOptions[i].copy(buffer, pos);
    pos += binaryOptions[i].length;
  }


  // not empty message
  if (that.packet.code !== "0.00" && that.packet.payload.length !== 0) {
    // write payload marker
    buffer.writeUInt8(255, pos++);
    that.packet.payload.copy(buffer, pos);

  }

  return buffer;
};

// set token length
OutcomeMessage.prototype.setTkl = function () {
  var that = this;

  that.binary |= that.packet.token.length;
};


// set options
OutcomeMessage.prototype.setOptons = function () {
  var that            = this;
  var start           = 0;
  var options         = []; // used store binary options
  var binary          = 0;
  var pos             = 0;
  var reverse_options = macro.reverse_options;


  that.packet.options.sort(sortArrayByObject);

  for (var i = 0; i < that.packet.options.length; i++) {
    var optionName        = that.packet.options[i].name;

    // option value is buffer type
    var optionValue       = that.packet.options[i].value;
    var optionValueLength = optionValue.length;

    // max option length is 1 header, 2 ext numb, 2 ext length, value
    var buffer = new Buffer(optionValueLength + 5);

    var delta  = reverse_options[optionName] - start;

    binary = 0;
    pos    = 0;

    if (delta <= 12) {
      binary |= delta << 4;
    } else if (delta > 12 && delta < 269) {
      binary |= 13 << 4;
    } else {
      binary |= 14 << 4;
    }

    if (optionValueLength <= 12) {
      binary |= optionValueLength
    } else if (optionValueLength > 12 && optionValueLength < 269) {
      binary |= 13;
    } else {
      binary |= 14;
    }

    buffer.writeUInt8(binary, pos++);

    // write extend option length
    if (delta > 12 && delta < 269) {
      buffer.writeUInt8(delta - 13, pos++);
    } else if (delta >= 269) {
      buffer.writeUInt16BE(delta - 269, pos);
      pos += 2;
    }

    // write extend option value
    if (optionValueLength > 12 && optionValueLength < 269) {
      buffer.writeUInt8(optionValueLength - 13, pos++);
    } else if (optionValueLength >= 269) {
      buffer.writeUInt16BE(optionValueLength - 269, pos);
      pos += 2;
    }

    optionValue.copy(buffer, pos);
    start += delta;
    pos   += optionValueLength;

    options.push(buffer.slice(0, pos));
  }
  return options;
};

// set message version
OutcomeMessage.prototype.setVersion = function () {
  var that = this;

  that.binary |= 1 << 6;
};

// set message type
OutcomeMessage.prototype.setType = function () {
  var that = this;

  if (that.packet.confirm) {
    that.binary |= 0;
  } else if (that.packet.ack) {
    that.binary |= (1 << 5);
  } else if (that.packet.reset) {
    that.binary |= (3 << 4);
  } else if (that.packet.unconfirm) {
    that.binary |= (1 << 4);
  }
};

// set message code
OutcomeMessage.prototype.setCode = function () {
  var that = this;

  var split = that.packet.code.split(".").map(function (element) {
    return parseInt(element, 10);
  });

  var byte_ = 0;
  byte_ |= split[0] << 5;
  byte_ |= split[1];
  return byte_;
};

