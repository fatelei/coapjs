/*
 * a basic coap server
 */

var CoAPServer = require("../index").CoAPServer;



if (require.main === module) {

  var info = function (req, res) {
    return res.end("hello world");
  }

  var app = new CoAPServer();

  app.get('info', info);

  app.listen();
  app.on("error", function (err) {
    console.error(err.stack);
  });

  app.on("response", function (client) {
    console.log("response");
  });
}
