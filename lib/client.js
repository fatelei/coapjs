'use strict';

/*
 * coap application layer client
 */

const util = require('util');
const Message = require('coap-message').Message;
const generateMsgId = require("coap-message").generateMsgId;
const generateToken = require("./utils/token").generateToken;
const macro = require('./macro/macro.json');

/*
 * @param options: server port, server host, socket type
 *                 {type: 'udp4 / udp6'}
 *
 */
class CoAPClient {
  constructor(options) {
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

  /*
   * clean
   */
  clean() {
    this.packet = {
      ack: false,
      confirm: false,
      reset: false,
      unconfirm: true,
      options: [],
      payload: new Buffer(0)
    }
  }

  /*
   * initialize
   *
   * add listener for message event
   */
  initialize() {
    let key = null;
    let callback = null;

    // server response event
    this.message.on('data', (data) => {
      var messageId = parseInt(data.msg.messageId);
      var token = parseInt(data.msg.token);
      var client = data.client;

      key = util.format('%s:%s', client.address, client.port);
      if (this.congestion.hasOwnProperty(key)) {
        if (this.congestion[key].messageId === messageId && this.congestion[key].token === token) {
          if (this.congestion[key].isBackOff) {
            this.message.senders[key].clearTimer();
          } else {
            clearTimeout(this.congestion[key].timer);
          }
          callback = this.congestion[key].callback;
          delete this.congestion[key];
          this.clean();
          if (parseFloat(data.msg.code) < 4.00) {
            return callback(null, data.msg.payload);
          } else {
            return callback(data.msg.payload, null);
          }
        }
      }
    });

    this.message.once('error', (err, port, host) => {
      console.error(err.stack);
      process.exit(1);
    });

    // over the exchange life time
    this.message.once('dead', (err, sender) => {
      // release messsageid and token
      key = util.format('%s:%s', sender.host, sender.port);
      if (this.congestion.hasOwnProperty(key)) {
        callback = this.congestion[key].callback;
        delete this.congestion[key];
        self.clean();
        return callback(err.stack, null);
      }
    });
  }

  /*
   * set request header
   * @param key
   * @param value
   */
  setHeader(key, value) {
    let flag = false;

    // check key
    if (this.validOptions.indexOf(key) !== -1) {

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
        this.packet.options.push({"type": key, "value": new Buffer(value)});
      } else {
        throw new Error('option value format error');
      }
    }
  }

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
  request(options, callback) {
    let code = '0.01';  // GET method
    let uri = null;
    let query = null;
    let client = {address: '127.0.0.1', port: 5638};
    let isBackOff = false;

    let messageId = this.nextMsgId();
    let token = this.nextToken();

    if (options.host !== undefined) {
      if (options.host === 'localhost') {
        client.address = '127.0.0.1';
      }
      // need resolve hostname to ip address
    }

    if (options.port !== undefined) {
      client.port = options.port;
    }

    let key = util.format('%s:%s', client.address, client.port);

    // congestion control check
    // if request hasn't complete, raise error
    if (this.congestion.hasOwnProperty(key)) {
      throw new Error('congestion control');
    }

    this.setHeader('Uri-Host', client.address);
    this.setHeader('Uri-Port', client.port);

    if (options.method !== undefined) {
      if (Object.keys(macro.method_codes).indexOf(options.method) !== -1) {
        this.packet.code = macro.method_codes[options.method];
      }
    } else {
      this.packet.code = code;
    }

    if (options.path !== undefined) {
      // if has query

      if (options.path.indexOf('?') !== -1) {
        let tmp = options.path.split('?');
        uri = tmp[0];
        query = tmp[1];
      } else {
        uri = options.path;
      }

      uri = uri.split('/');

      for (let i = 0; i < uri.length; i++) {
        if (uri[i].length !== 0) {
          this.setHeader('Uri-Path', uri[i]);
        }
      }

      if (query !== null) {
        query = query.split('&');
        for (let i = 0; i < query.length; i++) {
          this.setHeader('Uri-Query', query[i]);
        }
      }
    } else {
      this.setHeader('Uri-Path', '/');
    }

    if (typeof options.headers === 'object') {
      for (let k in options.headers) {
        if (options.headers.hasOwnProperty(k)) {
          this.setHeader(k, options.headers[k]);
        }
      }
    }

    if (options.type !== undefined) {
      if (options.type === 'confirmable') {
        this.packet.confirm = true;
        isBackOff = true;
      } else if (options.type === 'unconfirmable') {
        this.packet.unconfirm = true;
      }
    }

    this.packet.messageId = messageId;
    this.packet.token = token;

    this.congestion[key] = {
      'callback': callback,
      'isBackOff': isBackOff,
      'messageId': messageId,
      'token': token
    }

    if (!isBackOff) {
      // relase
      this.congestion[key].timer = setTimeout(() => {
        delete this.congestion[key];
        this.clean();
      }, params.nonLifetime);
    }

    this.message.send(this.packet, isBackOff, client);
  }
}

module.exports = CoAPClient;
