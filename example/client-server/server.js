/*
 * a basic coap server
 */

var CoAPServer = require('../../index').CoAPServer;
const Cache = require('memory-storage');


if (require.main === module) {

  var info = function (req, res, callback) {
    return callback(res.end('hello world'));
  }

  var app = new CoAPServer();
  app.use(new Cache());
  app.get('/info', info);
  app.listen();
}
