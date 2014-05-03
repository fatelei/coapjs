/*
 * coap client demo
 */

var agent = require("../index").agent;

if (require.main === module) {
  agent.request("coap://127.0.0.1/info", "GET", function (err, data) {
    if (err) {
      console.error(err);
    } else {
      console.info(data.payload);
    }
  });
}