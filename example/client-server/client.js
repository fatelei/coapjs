/*
 * coap client demo
 */

const CoAPClient = require('../../index').CoAPClient;

if (require.main === module) {
  const client = new CoAPClient();
  const options = {
    host: 'localhost',
    port: 5638,
    method: 'GET',
    path: '/info',
    type: 'confirmable'
  }

  client.request(options, (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });
}