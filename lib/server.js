/*
 * coap application layer
 *
 * ---------------------
 * | application layer |
 * ---------------------
 * |   message  layer  |
 * ---------------------
 *
 * coap app server which wraps message layer
 * it supply restful style interface
 * 
 * you can register coap standard method: GET, POST, DELETE, PUT
 * through get, post, delete, put
 */ 

var Message = require('./message/message');
var Request = require("./request");
var Response = require("./response");

/*
 * coap application server
 * @param options: it is a object, contains type, port, address
 *
 *
 *
 */
function CoAPServer (options) {
  // wrap message layer
  this.message = new Message(options);

  // handlers
  this.handlers = {
    'get': [],
    'post': [],
    'delete': [],
    'put': []
  };

  events.EventEmitter.call(this);
}

module.exports = CoAPServer;
util.inherits(CoAPServer, events.EventEmitter);

/*
 * listen and wait for request
 * 
 */
CoAPServer.prototype.listen = function (callback) {
  var self = this;

  if (typeof callback === "undefined") {
    self.message.listen(callback);
  } else {
    self.message.listen();
  }

  return self;
};

/*
 * initialize
 *
 * set up listener
 */
CoAPServer.prototype.initialize = function () {
  var self = this;

  // listen message's formaterror event
  self.message.on('formaterror', function(err) {
    /*
     * parse or generate message error
     * should send 5.xx error to client
     */
     self.sendError();
  });

  // listen message's request event
  self.message.on('request', function(msg) {
    /*
     * process a client request
     */
    var handler = self.getHandler(path, method);

    if (handler === null) {
      // response 4.04
      self.sendError();
    } else {
      var req = null;
      var res = null;

      // process a request
      var result = handler(req, res);

      // send result back to client
      self.message.send();
    }
  });

  // listen message's response event
  self.message.on('response', function() {
    // send to client successfully
  });

  // listen message's error event
  self.message.on('error', function(err) {

  });

  // listen message's dead event
  self.message.on('dead', function() {

  });

  return self;
};


/*
 * set error info to client
 */ 
CoAPServer.prototype.sendError = function() {
  var self = this;

};

/*
 * stop coap application server
 */
CoAPServer.prototype.stop = function() {
  var self = this;
  
  self.message.close();

  return self;
};


/*
 * lookup handler
 *
 * @param path: uri-path
 * @param method: coap standard method
 * @return handler
 */
CoAPServer.prototype.getHandler = function(path, method) {
  var self = this;

  var handlers = self.handlers[method.toLowerCase()];

  for (var i = 0; i < handlers.length; i++) {
    var regex   = handlers[i][0];
    var handler = handlers[i][1];

    if (regex.test(path)) {
      return handler;
    }
  }

  // find handler failed, return null
  return null;
};


/* register coap handler */
 

/*
 * register handler for GET method
 */
CoAPServer.prototype.get = function(pattern, handler) {
  var self = this;

  var regex = new RegExp(pattern);
  self.handlers.get.push([regex, handler]);

  return self;
};


/*
 * register handler for POST method
 */
CoAPServer.prototype.post = function(pattern, handler) {
  var self = this;

  var regex = new RegExp(pattern);
  self.handlers.post.push([regex, handler]);

  return self;
};


/*
 * register handler for PUT method
 */
CoAPServer.prototype.put = function(pattern, handler) {
  var self = this;

  var regex = new RegExp(pattern);
  self.handlers.put.push([regex, handler]);

  return self;
};

/*
 * register handler for DELETE method
 */
CoAPServer.prototype.delete = function(pattern, handler) {
  var self = this;

  var regex = new RegExp(pattern);
  self.handlers.delete.push([regex, handler]);

  return self;
};
