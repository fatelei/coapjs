/*
 * coap message layer
 *
 * ---------------------
 * | application layer |
 * ---------------------
 * |   message  layer  |
 * ---------------------
 *
 * message layer based on udp
 *
 * it supply methods which includes handle, finish
 * 
 * methods
 * # handle: handle request message
 * # finish: send response to requested client
 * # listen: bind port, address
 * # close: close socket
 *
 * expose event:
 * # request: for futher handle the message
 * # formaterror: parse packet or generate packet failed
 * # error:
 * # response:
 * # dead:
 */

var util = require('util');
var events = require('events');
var dgram = require('dgram');
var IncomeMessage = require('./in');
var OutcomeMessage = require('./out');
var Sender = require('./send');

/*
 * Message
 *
 * @param options: it is a object, contains type, port, address
 */

function Message(options) {
  var options = options || {};
  
  this.type = 'udp4';
  this.port = 5638;
  this.address = "0.0.0.0";

  this._socket = null; // socket used for recv and send

  if (options.type !== undefined) {
    this.type = options.type;
  }

  if (options.port !== undefined) {
    this.port = options.port;
  }

  if (options.address !== undefined) {
    this.address = options.address;
  }

  self._socket = dgram.createSocket(self.type, function(msg, rinfo) {
    // listen for message event
    self.parse(msg, rinfo);
  });

  events.EventEmitter.call(this);
}

util.inherits(Message, events.EventEmitter);
module.exports = Message;


/*
 * start message layer for sending or receiving
 */
Message.prototype.listen = function(callback) {
  var self = this;

  if (typeof callback !== "undefined") {
    self._socket.bind(self.port, self.address, callback);
  } else {
    self._socket.bind(self.port, self.address);
  }
  return self;
};


/*
 * close message server
 */
Message.prototype.close = function() {
  var self = this;

  self._socket.close();
  self.cache.clean();
  return self;
};

/*
 * parse received message
 * @param msg: received message buffer
 * @param rinfo: remote info
 * @return
 */
Message.prototype.handle = function(msg, rinfo) {
  var self = this;

  // parse binary message
  var incomeMessage = new IncomeMessage(msg);

  try {
    var msgObj = incomeMessage.parse();
  } catch(err) {
    self.emit("formaterror", err);
  }
  // set client info to msg object
  msgObj.client = rinfo;

  // emit a message event
  self.emit('request', msgObj);
};


/*
 * send message
 * @param response
 * @param backOff: whether it needs retransit when it hasn't received from server
 * @param callback optional
 */
Message.prototype.send = function(response, isBackOff) {
  var self = this;

  // whether it needs retransit when it is timeout
  var msg = response.msg;
  var client = response.client;

  var outcomeMessage = new OutcomeMessage(msg);

  try {
    var packet = outcomeMessage.generate();
    var sender = new Sender(self._socket, client.port, client.host);

    sender.on('error', function(err) {
      if (isBackOff) {
        sender.backOff();
      } else {
        self.emit('error', err);
      }
    });

    sender.on('overflow', function() {
      sender.clearTimer();
      self.emit('error', new Error)
    });

    sender.on('sent', function() {
      if (isBackOff) {
        sender.clearTimer();
      }
      self.emit('response');
    });

    sender.on('dead', function(err) {
      self.emit('dead', err);
    });

    sender.send(packet, isBackOff);
  } catch(err) {
    self.emit("formaterror", err);
  }
};
