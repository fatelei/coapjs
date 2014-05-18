/*
 * a basic coap server
 */

var CoAPServer = require("../index").CoAPServer;



if (require.main === module) {

  var info = function (req, res) {
    return res.end("hello world");
  }

  var app = new CoAPServer();
  app.get('/info', info);
  app.listen();
}
