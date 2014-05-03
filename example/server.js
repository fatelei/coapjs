/*
 * a basic coap server
 */

var CoAPServer = require("../index").CoAPServer;

var info = function (req, res) {
	return res.end("hello world");
}

if (require.main === module) {
  var server = new CoAPServer();

  server.get('info', info);

  server.listen();
  server.on("error", function (err) {
    console.error(err.stack);
  });

  server.on("response", function (client) {
    console.log("response");
  });
}
