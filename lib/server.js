'use strict';
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

const Cache = require('memory-storage');
const Message = require('coap-message').Message;
const Request = require("./request");
const Response = require("./response");
const util = require('util');

/*
 * coap application server
 * @param options: it is a object, contains type, port, address
 */
class CoAPServer {
  constructor(options) {
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

  /*
   * initialize
   *
   * set up listener
   */
  initialize() {
    let statusCode = null;
    let payload = null;
    let result = null;

    // listen message's request event
    this.message.on('data', (data) => {
      /*
       * process a client request
       */
      let client = data.client;
      let req = new Request(data.msg, client.address, client.port);
      let res = new Response(req);
      let handler = this.getHandler(req.path, req.method);

      if (handler === null) {
        // response 4.04
        res.setHeader('Content-Format', 'text/plain;charset=utf-8');
        result = res.end(4.04, 'not found');
        this.message.send(result, this.isBackOff, client);
      } else {     
        // process a request
        try {
          if (this.middleware.hasOwnProperty('cache')) {
            if (req.method === 'GET') {
              result = this.middleware.cache.get(req.path);
            }
          }

          if (result === null) {
            // cache miss
            handler(req, res, (info) => {
              // whether the response can be cached
              if (res.getStatusCode() === '2.05') {
                if (this.middleware.hasOwnProperty('cache')) {
                  let age = res.getHeader('Max-Age');
                  age = age === null ? 60 : age;
                  this.middleware.cache.setex(req.path, age * 1000, info.payload);
                }
              }
              this.message.send(info, this.isBackOff, client);
            });
          } else {
            let resInfo = res.end(result.toString());
            this.message.send(resInfo, this.isBackOff, client);
          }
        } catch(err) {
          // send 5.xx
          res.setHeader('Content-Format', 'text/plain;charset=utf-8');
          result = res.end(5.00, err.stack);
          this.message.send(result, this.isBackOff, client);
        }      
      }
    });

    // listen message's response event
    this.message.on('sent', (port, host) => {
      // send to client successfully
      const msg = util.format('[send to %s:%s ok]', host, port);
      console.info(msg);
    });

    // listen message's error event
    this.message.on('error', (err) => {
      console.error(err)
    });

    // unrecongnized message
    this.message.on('unrecongnized', (err, client) => {
      console.error(err);
      this.message.reset(client);
    });
  }

  /*
   * stop coap application server
   */
  stop() {
    this.message._socket.close();
  }

  /*
   * lookup handler
   *
   * @param path: uri-path
   * @param method: coap standard method
   * @return handler
   */
  getHandler(path, method) {
    let handlers = this.handlers[method.toLowerCase()];

    for (let i = 0; i < handlers.length; i++) {
      let regex   = handlers[i][0];
      let handler = handlers[i][1];

      if (regex.test(path)) {
        return handler;
      }
    }

    // find handler failed, return null
    return null;
  }

  /* register coap handler */
 

  /*
   * register handler for GET method
   */
  get(pattern, handler) {
    let regex = new RegExp(pattern);
    this.handlers.get.push([regex, handler]);
  }

  /*
   * register handler for POST method
   */
  post(pattern, handler) {
    let regex = new RegExp(pattern);
    this.handlers.post.push([regex, handler]);
  }

  /*
   * register handler for PUT method
   */
  put(pattern, handler) {
    let regex = new RegExp(pattern);
    this.handlers.put.push([regex, handler]);
  }

  /*
   * register handler for DELETE method
   */
  delete(pattern, handler) {
    let regex = new RegExp(pattern);
    this.handlers.delete.push([regex, handler]);
  }

  /*
   * set middleware
   */
  use(instance) {
    if (instance instanceof Cache) {
      this.middleware.cache = instance;
    }
  }

  /*
   * bind to port, listen for client request
   */
  listen(callback) {
    if (typeof callback !== "undefined") {
      this.message._socket.bind(this.port, this.address, callback);
    } else {
      this.message._socket.bind(this.port, this.address);
    }
  }
}

module.exports = CoAPServer;
