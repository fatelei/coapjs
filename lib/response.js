/*
 * CoAP response
 * 
 * GET response code: 2.05(content) or 2.03(valid etag verify)
 * POST response code: 2.01(created)
 * PUT response code: 2.04
 * DELETE response code: 2.02
 *
 * Cacheable respone code
 * # 2.05
 */

var macro = require('./macro/macro.json');
var convert = require('./utils/convert');
var crypto = require('crypto');


/*
 * piggy back response
 *
 * @param req: coap request
 */
function Response(req) {

  this.packet = {
    ack: false,
    confirm: false,
    reset: false,
    unconfirm: false,
    messageId: null,
    token: null,
    options: [],
    payload: null,
    code: null
  };

  this.etag = null;
  this.packet.messageId = new Buffer(req.messageId.toString());
  this.packet.token = new Buffer(req.token.toString());

  // set response message type
  if (req.type.unconfirm) {
    this.packet.unconfirm = true;
  } else if (req.type.confirm) {
    this.packet.ack = true;
  }

  this.accept = req.headers['Accept'];

  switch(req.method) {
    case 'GET':
      this.packet.code = '2.05';
      break;
    case 'POST':
      this.packet.code = '2.01';
      break;
    case 'DELETE':
      this.packet.code = '2.02';
      break;
    case 'PUT':
      this.packet.code = '2.04';
      break;
  }

  this.method = req.method;


  this.validOptions = Object.keys(macro.reverse_options);
}

module.exports = Response;

/*
 * set response header
 * @param key: coap option key
 * @param value
 */
Response.prototype.setHeader = function(key, value) {
  var self = this;
  var flag = false;

  // check key
  if (self.validOptions.indexOf(key) !== -1) {

    switch(key) {
      case 'Uri-Host':
        flag = typeof value === 'string' ? true : false;
        break;
      case 'Uri-Port':
        flag = typeof value === 'number' ? true : false;
        break;
      case 'Location-Path':
        flag = typeof value === 'string' ? true : false;
        break;
      case 'Uri-Path':
        flag = typeof value === 'string' ? true : false;
        break;
      case 'Content-Format':
        flag = typeof value === 'number' ? true : false;
        break;
      case 'Max-Age':
        flag = typeof value === 'number' ? true : false;
        break;
      case 'Uri-Query':
        flag = typeof value === 'string' ? true : false;
        break;
      case 'Location-Query':
        flag = typeof value === 'string' ? true : false;
        break;
      case 'Proxy-Uri':
        flag = typeof value === 'string' ? true : false;
        break;
      case 'Proxy-Scheme':
        flag = typeof value === 'string' ? true : false;
        break;
      case 'Size1':
        flag = typeof value === 'number' ? true : false;
        break;
    }

    if (flag || key === 'ETag' || key === 'If-Match') {
      value = value.toString();
      self.packet.options.push({"type": key, "value": new Buffer(value)});
    } else {
      throw new Error('option value format error');
    }
  }
};


/*
 * end coap response
 * @param code: response code optional
 * @param payload: representation data
 * @return packet
 */
Response.prototype.end = function(code, payload) {
  var self = this;
  var body = null;

  if (typeof payload === 'number') {
    self.packet.code = payload.toString();
  }

  if (typeof payload === 'string') {
    body = payload;
  }

  if (typeof code === 'number') {
    self.packet.code = code.toString();
  } 

  if (typeof code === 'string') {
    body = code;
  }



  // check whether client specific
  // accept content formt
  if (self.accept !== null) {
    var formatNumber = cf.toContentFormatNum(self.accept);
    self.setHeader('Content-Format', formatNumber);
  }

  if (body === null) {
    self.packet.payload = new Buffer(0);
  } else {
    self.packet.payload = new Buffer(JSON.stringify(body));
  }

  self.setHeader('Size1', self.packet.payload.length);

  var md5 = crypto.createHash('md5');
  var etag = md5.update(self.packet.payload.toString()).digest('hex');
  self.etag = etag;
  self.setHeader('ETag', etag);
  return self.packet;
};


/*
 * get response code
 */
Response.prototype.getStatusCode = function() {
  var self = this;

  return self.packet.code;
};

/*
 * get response header
 */
Response.prototype.getHeader = function(key) {
  var self = this;
  var data = [];

  for (var i = 0; i < self.packet.options.length; i++) {
    if (self.packet.options[i].type === key) {
      data.push(self.packet.options[i].value.toString());
    }
  }

  if (data.length === 0) {
    return null;
  } else if (data.length === 1) {
    return data[0];
  }
  return null;
};