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
var empty = require('../utils/convert').empty;

/*
 * Message
 *
 * @param options: it is a object, contains type
 */

function Message(options) {
  var options = options || {};
  var self = this;

  this.type = 'udp4';

  this._socket = null; // socket used for recv and send

  if (typeof options === 'object') {
    if (options.type !== undefined) {
      this.type = options.type;
    }
  }

  // store sender for specific host
  this.senders = {};

  this._socket = dgram.createSocket(this.type, function(msg, rinfo) {
    // listen for message event
    self.handle(msg, rinfo);
  });

  events.EventEmitter.call(this);
}

util.inherits(Message, events.EventEmitter);
module.exports = Message;


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
    var msg = incomeMessage.parse();
    var data = {};
    data.msg = msg
    data.client = rinfo;

    if (incomeMessage.index === 4) {
      // empty message
      self.emit('ping', rinfo, msg.messageId);
    } else {
      // emit a message event
      self.emit('data', data);      
    }
  } catch(err) {
    /*
     * parse message failed
     * emit a unrecognized event
     */
    console.log(err.stack);
    self.emit('unrecognized', err, rinfo);
  }
};


/*
 * send message
 * @param response
 * @param backOff: whether it needs retransit when it hasn't received from server
 * @param callback optional
 */
Message.prototype.send = function(msg, isBackOff, client) {
  var self = this;

  self.isBackOff = isBackOff;
  var outcomeMessage = new OutcomeMessage(msg);

  try {
    var packet = outcomeMessage.generate();
    var key = util.format('%s:%s', client.address, client.port);

    if (!self.senders.hasOwnProperty(key)) {
      self.senders[key] = new Sender(self._socket, client.port, client.address);
    }

    self.senders[key].on('error', function(err, port, host) {
      // dns error
      self.emit('error', err, port, host);
    });

    self.senders[key].on('dead', function(err, messageId, token) {
      self.emit('dead', err, messageId, token);
    });

    self.senders[key].on('sent', function(port, host) {
      self.emit('sent', port, host);
    });

    self.senders[key].send(packet, isBackOff);
  } catch(err) {
    // immediately exit
    console.error(err.stack);
    process.exit(1);
  }
};

/*
 * send reset message, it should be empty message
 */
Message.prototype.reset = function(client) {
  var self = this;

  var msg = empty('reset');
  var outcomeMessage = new OutcomeMessage(msg);
  var buf = outcomeMessage.generate();
  self._socket.send(buf, 0, buf.length, client.port, client.address);
};