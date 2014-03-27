// coap server

var dagram = require("dagram");
  , util   = require("util");
  , events = require("events");


function CoAPUDPServer (options, handlers) {
  var that = this;
  
  // handlers for handler client request
  var handlers = handers || {};

  options = options || {};

  if (options.type === undefined) {
    options.type = "udp4";
  }

  that._socket = dagram.createSocket(options.type, function (msg, rinfo) {
    // handle request
  });

  events.EventEmitter.call(this);
}

exports.CoAPUDPServer = CoAPUDPServer;

util.inherits(CoAPUDPServer, events.EventEmitter);

// handle request packet
CoAPUDPServer.prototype._handle = function (packet) {

};

// close udp socket
CoAPUDPServer.prototype.close = function () {
  var that = this;
  that._socket.close();
};

