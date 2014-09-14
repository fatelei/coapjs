/*
 * coap client demo
 */

var CoAPClient = require('../../index').CoAPClient;

if (require.main === module) {
  var client = new CoAPClient();
  var options = {
    host: 'localhost',
    port: 8000,
    method: 'GET',
    path: '/',
    type: 'confirmable'
  }

  client.setHeader('Proxy-Uri', 'coap://127.0.0.1:5638/info');

  client.request(options, function(err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
      client.request(options, function(err, result) {
        if (err) {
          console.error(err);
        } else {
          console.log(result);
        }
      });
    }
  });
}