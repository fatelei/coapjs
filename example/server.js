/*
 * a basic coap server
 */

var CoAPServer = require("../index").CoAPServer;

if (require.main === module) {
  var server = new CoAPServer(5683);

  server.on("error", function (err) {
    console.error(err);
  });

  server.on("sent", function (msgType, packet) {
    console.log(packet);
  });
}
