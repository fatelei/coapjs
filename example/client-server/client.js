/*
 * coap client demo
 */

var CoAPClient = require('../../index').CoAPClient;

if (require.main === module) {
  var client = new CoAPClient();
  var options = {
    host: 'localhost',
    port: 5638,
    method: 'GET',
    path: '/info',
    type: 'confirmable'
  }

  client.request(options, function(err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });
}