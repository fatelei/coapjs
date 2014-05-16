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
 * it supply methods which includes parse, gernerate
 * 
 * # parse: parse binary message to object for futher processing
 * # gernate: convert object to binary message
 */

var util = require('util');
var events = require('events');
var dgram = require('dgram');
var IncomeMessage = require('./in');
var OutcomeMessage = require('./out');

/*
 * Message
 *
 * @param options: it is a object, contains type and port
 */

function Message(options) {
  var options = options || {};
  
  this.type = 'udp4';
  this.port = 5368;

  this._socket = null; // socket used for recv and send

  if (options.type !== undefined) {
    this.type = options.type;
  }

  if (options.port !== undefined) {
    this.port = options.port;
  }

  events.EventEmitter.call(this);
}

util.inherits(Message, events.EventEmitter);
module.exports = Message;


/*
 * start message layer for sending or receiving
 */
Message.prototype.listen = function() {
  var self = this;

  if (self._socket === null) {
    self._socket = dgram.createSocket(self.type, function(msg, rinfo) {
      // listen for message event
      self.parse(msg, rinfo);
    });

    self._socket.bind(self.port);
  }
};


/*
 * parse received message
 * @param msg: received message buffer
 * @param rinfo: remote info
 * @return
 */
Message.prototype.parse = function(msg, rinfo) {
  var self = this;

  // parse binary message
  var incomeMessage = new IncomeMessage(msg);
  var msgObj = incomeMessage.parse();

  // set client info to msg object
  msgObj.client = rinfo;

  // emit a message event
  self.emit('message', msgObj);
};


/*
 * generate msg object to coap binary message
 * @param msgObj
 * @return 
 */
Message.prototype.generate = function(msgObj) {
  var self = this;

  var client = msgObj.client;
  delete msgObj.client;
  var outcomeMessage = new OutcomeMessage(msgObj);
  var packet = outcomeMessage.generate();

  // emit a gernerate event
  self.emit('generate', packet, client);
};

/*
 * send message
 * @param ip
 * @param port
 * @param buffer
 * @param callback optional
 */
Message.prototype.write = function(ip, port, buffer, callback) {
  var self = this;

  // whether it needs retransit when it is timeout
  
};
