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

var Message = require('coap-message').Message;
var Request = require("./request");
var Response = require("./response");
var Cache = require('simple-lru-cache');
var util = require('util');

/*
 * coap application server
 * @param options: it is a object, contains type, port, address
 *
 *
 *
 */
function CoAPServer(options) {
  if (!this instanceof CoAPServer) {
    return new CoAPServer(options);    
  }

  this.port = 5638;
  this.address = "0.0.0.0";

  if (typeof options === 'object') {
    if (options.port !== undefined) {
      this.port = options.port;
    }

    if (options.address !== undefined) {
      this.address = options.address;
    }
    delete options.port;
    delete options.address;
  }

  // wrap message layer
  this.message = new Message(options);


  // handlers
  this.handlers = {
    'get': [],
    'post': [],
    'delete': [],
    'put': []
  };

  // tasks for observer task register
  this.tasks = {};

  // server don't use retransit
  this.isBackOff = false;

  // server middleware
  this.middleware = {};
  this.initialize();
}

module.exports = CoAPServer;

/*
 * initialize
 *
 * set up listener
 */
CoAPServer.prototype.initialize = function() {
  var self = this;
  var statusCode = null;
  var payload = null;
  var result = null;

  // listen message's request event
  self.message.on('data', function(data) {
    /*
     * process a client request
     */
    var client = data.client;
    var req = new Request(data.msg, client.address, client.port);
    var res = new Response(req);
    var handler = self.getHandler(req.path, req.method);

    if (handler === null) {
      // response 4.04
      res.setHeader('Content-Format', 'text/plain;charset=utf-8');
      result = res.end('4.04', 'not found');
      self.message.send(result, self.isBackOff, client);
    } else {     
      // process a request
      try {
        if (self.middleware.hasOwnProperty('cache')) {
          if (req.method === 'GET') {
            result = self.middleware.get(req.path);
          }
        }

        if (result === null) {
          // cache miss
          result = handler(req, res);
          // whether the response can be cached
          if (res.getStatusCode() === '2.05') {
            if (self.middleware.hasOwnProperty('cache')) {
              var age = res.getHeader('Max-Age');
              age = age === null ? 60 : age;
              self.middleware.cache.setex(req.path, age, result);
            }
          }
        }
        self.message.send(result, self.isBackOff, client);
      } catch(err) {
        // send 5.xx
        res.setHeader('Content-Format', 'text/plain;charset=utf-8');
        result = res.end('5.00', err.stack);
        self.message.send(result, self.isBackOff, client);
      }      
    }
  });

  // listen message's response event
  self.message.on('sent', function(port, host) {
    // send to client successfully
    var msg = util.format('[send to %s:%s ok]', host, port);
    console.info(msg);
  });

  // listen message's error event
  self.message.on('error', function(err) {
    console.error(err)
  });

  // unrecongnized message
  self.message.on('unrecongnized', function(err, client) {
    console.error(err);
    self.message.reset(client);
  });

  return self;
};

/*
 * stop coap application server
 */
CoAPServer.prototype.stop = function() {
  var self = this;
  
  self.message._socket.close();

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

/*
 * set middleware
 */
CoAPServer.prototype.use = function(instance) {
  var self = this;

  if (instance instanceof Cache) {
    self.middleware.cache = instance;
  }
};

/*
 * bind to port, listen for client request
 */
CoAPServer.prototype.listen = function(callback) {
  var self = this;

  if (typeof callback !== "undefined") {
    self.message._socket.bind(self.port, self.address, callback);
  } else {
    self.message._socket.bind(self.port, self.address);
  }
  return self;
};
