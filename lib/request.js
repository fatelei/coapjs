/*
 * CoAP request
 *
 * method
 * # getHeader: get header value by specific key
 * 
 *
 */

var convert = require('./utils/convert');

/*
 * @param data: coap message
 * @param remoteAddress: client ip
 * @param remotePort: client port
 */
function Request(data, remoteAddress, remotePort) {
  this.remoteAddress = remoteAddress;
  this.remotePort = remotePort;

  // coap version
  this.version = data.version;

  // coap message type
  // 0 -> confirmable
  // 1 -> non-confirmable
  // 2 -> ack
  // 3 -> reset
  this.type = data.type;

  // token length
  this.tkl = data.tkl;

  // code
  // 0.01 -> GET 
  // 0.02 -> POST
  // 0.03 -> PUT
  // 0.04 -> DELETE
  switch (data.code) {
    case '0.01':
      this.method = 'GET';
      break;
    case '0.02':
      this.method = 'POST';
      break;
    case '0.03':
      this.method = 'PUT';
      break;
    case '0.04':
      this.method = 'DELETE';
      break;
  }

  // message id
  this.messageId = data.messageId;

  // token
  this.token = data.token;

  // options
  this.options = data.options;

  // set path and query parameters
  var path = [];
  this.params = {};
  this.headers = {'Accept': null};

  for (var i = 0; i < data.options.length; i++) {
    if (data.options[i].type === 'Uri-Path') {
      path.push(data.options[i].value);
    } else if (data.options[i].type === 'Uri-Query') {
      var tmp = data.options[i].value.split('=');
      this.params[tmp[0]] = tmp[1];
    } else if (data.options[i].type === 'Accept') {
      this.headers['Accept'] = cf.toContentFormatName(data.options[i].value);
    } else {
      this.headers[data.options[i].type] = data.options[i].value;
    }
  }

  this.path = '/' + path.join('/');
  
  // payload
  this.payload = data.payload;
}

module.exports = Request;

/*
 * get option value by specific key
 * @param key: option key
 * @return value
 */
Request.prototype.getHeader = function(key) {
  var self = this;

  for (var i = 0; i < self.options.length; i++) {
    var type = self.options[i].type;
    if (type === type) {
      return self.options[i].value;
    }
  }
  return null;
};
