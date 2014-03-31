// coap server

// core module
var dagram = require("dgram");
var util   = require("util");
var events = require("events");


// own module
var CoAPRequest  = require("./request");
var CoAPResponse = require("./response");
var CoAPSend     = require("./send");

function CoAPServer (port, options) {
  var that = this;

  // handlers for handler client request
  that.handlers = {};

  options = options || {};

  if (options.type === undefined) {
    options.type = "udp4";
  }

  that._socket = dagram.createSocket(options.type, function (msg, rinfo) {
    // handle request
    that.handle(msg, rinfo);
  });

  that._socket.bind(5683);

  events.EventEmitter.call(this);
}

module.exports = CoAPServer;
util.inherits(CoAPServer, events.EventEmitter);

// handle request packet
CoAPServer.prototype.handle = function (packet, rinfo) {
  var that      = this;
  var request   = new CoAPRequest(packet);
  var send      = null;
  var isBackOff = false;
  var response  = null;
  var code      = "0.00";

  send = new CoAPSend(that._socket, rinfo.port, rinfo.address);

  request.on("error", function (err) {
    // reply with reset (empty message)
    response = new CoAPResponse(reqInfo);
    response.genReset(function (err, packet) {
      if (err) {
        that.sendError(err);
      } else {
        send.on("error", function (err) {
          that.emit("error", err);
        });

        send.on("sent", function () {
          that.emit("sent", "reset", packet);
        });

        send.send(packet, isBackOff);
      }
    });
  });

  request.on("confirm", function (reqInfo) {
    // reply with ack
    response = new CoAPResponse(reqInfo);
    response.genAck(function (err, packet) {
      if (err) {
        that.sendError(err);
      } else {
        
        send.on("error", function (err) {
          that.emit("error", err);
          // back off retransmit
          //send.backoff();
        });

        // complete sent data to client
        send.on("sent", function () {
          // easy clean timer
          that.emit("sent", "ack", packet);
          send.clearTimer();
        });

        // over exchange lifetime
        send.on("over", function () {
          send.clearTimer();
          // sliently ignore
        });

        isBackOff = true;
        send.send(packet, isBackOff);
      }
    });
  });

  request.on("unconfirm", function (reqInfo) {
    // reply with unconfirm
    response = new CoAPResponse(reqInfo);
    response.genUnconfim(function (err, packet) {
      if (err) {
        that.sendError(err);
      } else {
        send.on("error", function (err) {
          that.emit("error", err);
        });

        send.on("sent", function () {
          that.emit("sent", "unconfirm", packet);
        });

        send.send(packet, isBackOff);
      }
    });
  });

  request.handleRequest();
};

// send error to client
CoAPServer.prototype.sendError = function (err) {
  var payload = new Buffer(err.stack, err.stack.length);

};

// close udp socket
CoAPServer.prototype.close = function () {
  var that = this;
  that._socket.close();
};
