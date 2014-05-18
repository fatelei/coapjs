/*
 * coap application layer client
 */

var util = require('util');
var Message = require('./message/message.js');
var generateMsgId = require("./utils/msgid").generateMsgId;
var generateToken = require("./utils/token").generateToken;
var macro = require('./macro/macro.json');

/*
 * @param options: server port, server host, socket type
 *                 {type: 'udp4 / udp6'}
 *
 */
function CoAPClient(options) {
  if (!this instanceof CoAPClient) {
    return new CoAPClient(options);
  }

  // init the message
  this.message = new Message(options);

  // store the custom option
  this.options = [];

  // generate messageid and token
  this.nextMsgId = generateMsgId();
  this.nextToken = generateToken();

  // timer
  this.exchangeTimer    = null;
  this.nonexchangeTimer = null;

  this.validOptions = Object.keys(macro.reverse_options);

  /*
   * coap congestion control
   *
   * remote server - > nstart
   */
  this.congestion = {};

  // packet template
  this.packet = {
    ack: false,
    confirm: false,
    reset: false,
    unconfirm: true,
    options: [],
    payload: new Buffer(0)
  };

  this.initialize();
}

module.exports = CoAPClient;

/*
 * initialize
 *
 * add listener for message event
 */
CoAPClient.prototype.initialize = function() {
  var self = this;

  // server response event
  self.message.on('request', function(data) {
    var messageId = data.msg.messageId;
    var token = data.msg.token;

    var key = util.format('%s:%s', messageId, token);
    var callback = self.congestion[key];

    if (callback !== undefined) {
      delete self.congestion[key];

      if (parseFloat(data.msg.code) < 4.00) {
        return callback(null, data.msg.payload);
      } else {
        return callback(data.msg.payload, null);
      }
    }
  });

  self.message.on('overflow', function(err) {
    console.error(err);
  });

  // over the exchange life time
  self.message.on('dead', function(err, messageId, token) {
    // release messsageid and token
    var key = util.format('%s:%s', messageId, token);
    delete self.congestion[key];
  });
};


/*
 * set request header
 * @param key
 * @param value
 */
CoAPClient.prototype.setHeader = function(key, value) {
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
        flag = typeof value === 'int' ? true : false;
        break;
    }

    if (flag) {
      value = value.toString();
      self.packet.options.push({"type": key, "value": new Buffer(value)});
    } else {
      throw new Error('option value format error');
    }
  }
};

/*
 * execute a request
 * @param options:
 *        hoat: ip or domain
 *        port: default 5638
 *        method: GET | POST | DELETE | PUT, default GET
 *        path: Request path. Defaults to '/'. Should include query string if any. E.G. '/index.html?page=12'
 *        headers: An object containing request headers
 *        type: confirmable or unconfirmable, default unconfirmable
 */
CoAPClient.prototype.request = function(options, callback) {
  var self = this;
  var code = '0.01';  // GET method
  var uri = null;
  var query = null;
  var client = {address: 'localhost', port: 5638};
  var isBackOff = false;

  var messageId = self.nextMsgId();
  var token = self.nextToken();
  var key = util.format('%s:%s', messageId, token);

  // congestion control check
  // if request hasn't complete, raise error
  if (self.congestion.hasOwnProperty(key)) {
    throw new Error('congestion control');
  }

  if (options.method !== undefined) {
    if (Object.keys(macro.method_codes).indexOf(options.method) !== -1) {
      self.packet.code = macro.method_codes[options.method];
    }
  } else {
    self.packet.code = code;
  }

  if (options.path !== undefined) {
    // if has query

    if (options.path.indexOf('?') !== -1) {
      var tmp = options.path.split('?');
      uri = tmp[0];
      query = tmp[1];
    } else {
      uri = options.path;
    }

    uri = uri.split('/');

    for (var i = 1; i < uri.length; i++) {
      self.setHeader('Uri-Path', uri[i]);
    }

    if (query !== null) {
      if (query.indexOf('&') !== -1) {
        query = query.split('&');

        for (var i = 0; i < query.length; i++) {
          self.setHeader('Uri-Query', query[i]);
        }
      }
    }
  } else {
    self.setHeader('Uri-Path', '/');
  }

  if (typeof options.headers === 'object') {
    for (var k in options.headers) {
      if (options.headers.hasOwnProperty(k)) {
        self.setHeader(k, options.headers[k]);
      }
    }
  }

  if (options.type !== undefined) {
    if (options.type === 'confirmable') {
      self.packet.confirm = true;
      isBackOff = true;
    } else if (options.type === 'unconfirmable') {
      self.packet.unconfirm = true;
    }
  }

  if (options.host !== undefined) {
    client.address = options.host;
    self.setHeader('Uri-Host', options.host);
  } else {
    self.setHeader('Uri-Host', 'localhost');
  }

  if (options.port !== undefined) {
    client.port = options.port;
    self.setHeader('Uri-Port', options.port);
  } else {
    self.setHeader('Uri-Port', options.port);
  }

  self.packet.messageId = messageId;
  self.packet.token = token;  
  
  self.congestion[key] = callback;

  self.message.send(self.packet, isBackOff, client);
};

