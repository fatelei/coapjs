/*
 * coap client demo
 */

var CoAPClient = require("../index").CoAPClient;

if (require.main === module) {
  var client = new CoAPClient(5683, "localhost");

  client.on("message", function (message) {
    console.log(message);
  });

  client.sendConfirm();
}
