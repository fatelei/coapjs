// coap server

// core module
var dagram = require("dgram");
var util   = require("util");
var events = require("events");


// own module
var CoAPRequest  = require("./request");
var CoAPResponse = require("./response");
var CoAPSend     = require("./send");

function CoAPServer (options) {
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

  // coap method object
  that.getHandlers    = [];
  that.postHandlers   = [];
  that.putHandlers    = [];
  that.deleteHandlers = [];

  events.EventEmitter.call(this);
}

module.exports = CoAPServer;
util.inherits(CoAPServer, events.EventEmitter);

// listen
CoAPServer.prototype.listen = function (port, address) {
  var that = this;

  var _port    = 5683;
  var _address = "127.0.0.1";

  if (typeof address !== 'undefined') {
    _address = address;
  }

  if (typeof port === 'number') {
    _port = port;
  } else if (typeof port === 'string') {
    _address = port;
  }

  that._socket.bind(_port, _address, function () {
    console.info("server start");
  });
};

// handle request packet
CoAPServer.prototype.handle = function (packet, rinfo) {
  var that      = this;
  var request   = new CoAPRequest(packet);
  var response  = null;

  request.once("request", function (req) {
    // reply with ack
    var handler  = that.getHandler(req.path, req.method);
    var res = new CoAPResponse(req.mid, req.token, req.msgType);

    if (handler === null) {
      res.setStatusCode('4.04');
      res.setHeader('Content-Format', 'application/json');
      that.sendError(res.end({'err': 'not found'}), rinfo);
    } else {
      try {
        var result = handler(req, res);
        that.write(result, rinfo);
      } catch (err) {
        console.log(err.stack);
        res.setStatusCode('5.00');
        res.setHeader('Content-Format', 'application/json');
        that.sendError(res.end({'err': err.stack}), rinfo);
      }
    }
  });
  request.handleRequest();
};

// write response to client
CoAPServer.prototype.write = function (packet, client) {
  var that = this;

  that._socket.send(packet, 0, packet.length, client.port, client.address, function (err, bytes) {
    if (err) {
      that.emit("error", err);
    } else {
      that.emit("response", client);
    }
  });
};


// send error to client
CoAPServer.prototype.sendError = function (diagnosis, client) {
  var that = this;

  that._socket.send(diagnosis, 0, diagnosis.length, client.port, client.address);
};

// close udp socket
CoAPServer.prototype.close = function () {
  var that = this;
  that._socket.close();
};

// lookup handler
CoAPServer.prototype.getHandler = function (path, method) {
  var that = this;

  var key = method.toLowerCase() + "Handlers";
  var handlers = that[key];

  for (var i = 0; i < handlers.length; i++) {
    var regex   = handlers[i][0];
    var handler = handlers[i][1];

    if (regex.test(path)) {
      return handler;
    }
  }

  // should return 404
  return null;
};


/*
 * coap method
 */

// get method
CoAPServer.prototype.get = function (pattern, handler) {
  var that = this;

  var regex = new RegExp(pattern);
  that.getHandlers.push([regex, handler]);
};

// post method
CoAPServer.prototype.post = function (pattern, handler) {
  var that = this;

  var regex = new RegExp(pattern);
  that.postHandlers.push([regex, handler]);
};

// put method
CoAPServer.prototype.put = function (pattern, handler) {
  var that = this;

  var regex = new RegExp(pattern);
  that.putHandlers.push([regex, handler]);
};

// delete method
CoAPServer.prototype.delete = function (pattern, handler) {
  var that = this;

  var regex = new RegExp(pattern);
  that.deleteHandlers.push([regex, handler]);
};
