/*
 * IncomeMessage
 * parse message to object
 *
 * 
 *
 *
 *
 */


// config
var macro = require("../macro/macro.json");


function IncomeMessage (packet) {
  this.packet = packet;
  this.index  = 4;      // used for parse options and payload
}


module.exports = IncomeMessage;


// parse income message
IncomeMessage.prototype.parse = function () {
  var that = this;

  var msg  = {};

  msg.version   = that.getVersion();
  msg.type      = that.getType();
  msg.tkl       = that.getTkl();
  msg.code      = that.getCode();
  msg.messageId = that.getMessageId();
  msg.token     = that.getToken();

  // check whether message is empty, empty message's code === 0.00
  if (msg.code !== "0.00") {
    msg.options   = that.getOptions();
    msg.payload   = that.getPayload();
  } else {
    if (that.packet.length !== 4) {
      var err = new Error("Message format error");
      throw err;
    } else {
      msg.options = [];
      msg.paylaod = new Buffer(0);
    }
  }

  return msg;
};

/*
 * get version
 * version must be 1
 */
IncomeMessage.prototype.getVersion = function () {
  var that = this;

  var version = that.packet.readUInt8(0) >> 6;

  if (version !== 1) {
    var err = new Error("Unsupport version");
    throw err;
  }
  return version;
};

// get type
IncomeMessage.prototype.getType = function () {
  var that = this;
  var type = {
    confirm   : false,
    unconfirm : false,
    ack       : false,
    reset     : false
  };
  var tmp   = that.packet.readUInt8(0);
  var _type = tmp & 48;

  if (_type === 0) {
    type.confirm = true; 
  } else if (_type === 16) {
    type.unconfirm = true;
  } else if (_type === 32) {
    type.ack = true;
  } else if (_type === 48) {
    type.reset = true;
  }
  return type;
};

/*
 * get token length
 * length must not be larger than 8
 */
IncomeMessage.prototype.getTkl = function () {
  var that = this;

  var length = that.packet.readUInt8(0) & 15;
  
  if (length > 8) {
    var err = new Error("Not Support Length");
    throw err;
  }
  return length
};

/*
 * get code
 * code format c.dd
 * c is 3bit, dd is 5bit
 * such as 2.xx
 */
IncomeMessage.prototype.getCode = function () {
  var that = this;

  var codeByte = that.packet.readUInt8(1);

  var c  = codeByte >> 5;
  var dd = codeByte & 31;

  var code = '' + c + ".";

  if (dd < 10) {
    code += '0' + dd;
  } else {
    code += dd;
  }
  return code;
};

/*
 * get message id
 */
IncomeMessage.prototype.getMessageId = function () {
  var that = this;

  var messageId = that.packet.readUInt16BE(2);
  return messageId;
};

/*
 * get token
 */
IncomeMessage.prototype.getToken = function () {
  var that  = this;
  var tkl   = that.getTkl();
  var start = that.index;
  var end   = that.index + tkl;

  var token = that.packet.slice(start, end);
  that.index += tkl;

  return token.toString();
};


/*
 * get options if any
 * option number = option delta + proceeding option number
 *
 *
 */
IncomeMessage.prototype.getOptions = function () {
  var that    = this;
  var total   = that.packet.length;
  var err     = null;
  var options = [];
  var number  = 0;

  while (that.index < total) {
    var tmp = that.packet.readUInt8(that.index);
    // when 0xFF or end of the packet, break
    if (tmp === 255 || that.index > total) {
      break;
    }

    that.index += 1;

    var delta  = tmp >> 4;
    var length = tmp & 15;

    // check whether delta is special
    if (delta === 13) {
      delta = that.packet.readUInt8(that.index) + 13;
      that.index += 1;
    } else if (delta === 14) {
      delta = that.packet.readUInt16BE(that.index) + 269;
      that.index += 2;
    } else if (delta === 15) {
      err = new Error("Message format error");
      throw err;
    }

    // check whether length is special
    if (length === 13) {
      length = that.packet.readUInt8(that.index) + 13;
      that.index += 1;
    } else if (length === 14) {
      length = that.packet.readUInt16BE(that.index) + 269;
      that.index += 2; 
    } else if (length === 15) {
      err = new Error("Message format error");
      throw err;
    }

    number += delta;

    var option_value = that.packet.slice(that.index, that.index + length);

    options.push({
      type : macro.options[number.toString()],
      value: option_value.toString()
    });
    that.index += length;
  }
  return options;
};

/*
 * get payload if any
 */
IncomeMessage.prototype.getPayload = function () {
  var that = this;

  var payload = that.packet.slice(that.index + 1);
  return payload.toString();
};