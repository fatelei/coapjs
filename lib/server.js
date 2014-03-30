// coap server

// core module
var dagram = require("dagram");
  , util   = require("util");
  , events = require("events");


// own module
var CoAPRequest  = require("./request");
  , CoAPResponse = require("./response");


function CoAPUDPServer (options) {
  var that = this;

  // handlers for handler client request
  var handlers = {};
  var response = new CoAPResponse();

  options = options || {};

  if (options.type === undefined) {
    options.type = "udp4";
  }

  that._socket = dagram.createSocket(options.type, function (msg, rinfo) {
    // handle request
    that.handle(msg, rinfo);
  });

  events.EventEmitter.call(this);
}

exports.CoAPUDPServer = CoAPUDPServer;

util.inherits(CoAPUDPServer, events.EventEmitter);

// handle request packet
CoAPUDPServer.prototype.handle = function (packet, rinfo) {
  var that    = this;
  var request = new CoAPRequest(packet);


  request.on("error", function (err) {
    // reply with reset (empty message)
    that.response.genReset(reqInfo, function () {

    });
  });

  request.on("confirm", function (reqInfo) {
    // reply with ack
    that.response.genAck(reqInfo, function () {

    });
  });

  request.on("unconfirm", function (reqInfo) {
    // reply with unconfirm
    that.response.genUnconfim(reqInfo, function () {

    });
  });

  request.handle_request();
};

// close udp socket
CoAPUDPServer.prototype.close = function () {
  var that = this;
  that._socket.close();
};
