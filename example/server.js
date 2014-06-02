/*
 * a basic coap server
 */

var CoAPServer = require("../index").CoAPServer;



if (require.main === module) {

  var info = function (req, res, callback) {
    console.log("here");
    return callback(res.end("hello world"));
  }

  var app = new CoAPServer();
  app.get('/info', info);
  app.listen();
}
