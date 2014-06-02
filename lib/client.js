/*
 * coap application layer client
 */

var util = require('util');
var Message = require('coap-message').Message;
var generateMsgId = require("coap-message").generateMsgId;
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
  var key = null;
  var callback = null;

  // server response event
  self.message.on('data', function(data) {
    var messageId = parseInt(data.msg.messageId);
    var token = parseInt(data.msg.token);
    var client = data.client;

    key = util.format('%s:%s', client.address, client.port);
    if (self.congestion.hasOwnProperty(key)) {
      if (self.congestion[key].messageId === messageId && self.congestion[key].token === token) {
        if (self.congestion[key].isBackOff) {
          self.message.senders[key].clearTimer();
        } else {
          clearTimeout(self.congestion[key].timer);
        }
        callback = self.congestion[key].callback;
        if (parseFloat(data.msg.code) < 4.00) {
          return callback(null, data.msg.payload);
        } else {
          return callback(data.msg.payload, null);
        }
      }
    }
  });

  self.message.on('error', function(err, port, host) {
    console.error(err.stack);
    process.exit(1);
  });

  // over the exchange life time
  self.message.on('dead', function(err, sender) {
    // release messsageid and token
    key = util.format('%s:%s', sender.host, sender.port);
    if (self.congestion.hasOwnProperty(key)) {
      callback = self.congestion[key].callback;
      delete self.congestion[key];
      return callback(err.stack, null);
    }
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
  var client = {address: '127.0.0.1', port: 5638};
  var isBackOff = false;

  var messageId = self.nextMsgId();
  var token = self.nextToken();

  if (options.host !== undefined) {
    if (options.host === 'localhost') {
      client.address = '127.0.0.1';
    }
    // need resolve hostname to ip address
  }

  if (options.port !== undefined) {
    client.port = options.port;
  }

  var key = util.format('%s:%s', client.address, client.port);

  // congestion control check
  // if request hasn't complete, raise error
  if (self.congestion.hasOwnProperty(key)) {
    throw new Error('congestion control');
  }

  self.setHeader('Uri-Host', client.address);
  self.setHeader('Uri-Port', client.port);

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

  self.packet.messageId = messageId;
  self.packet.token = token;
 
  self.congestion[key] = {
    'callback': callback,
    'isBackOff': isBackOff,
    'messageId': messageId,
    'token': token
  }

  if (!isBackOff) {
    // relase
    self.congestion[key].timer = setTimeout(function() {
      delete self.congestion[key];
    }, params.nonLifetime);
  }

  self.message.send(self.packet, isBackOff, client);
};

