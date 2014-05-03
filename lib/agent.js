/*
 * http agent to coap
 */


// own module
var convert    = require('./utils/convert');
var CoAPClient = require("./client");

// config
var macro = require("./macro/macro.json");


exports.request = function (url, method, headers, cb) {
  var result    = convert.fromUrlToOptions(url);
  var callback  = null;

  if (result === null) {
    throw new Error('url format error');
  }

  var host    = result[0];
  var port    = result[1];
  var options = result[2];

  var methodCode = null;

  methodCode = macro.method_codes[method.toLowerCase()];


  if (typeof headers === 'object') {
    for (var k in headers) {
      options.push({k: headers[k]});
    }
  } else if (typeof headers === 'function') {
    callback = headers;
  }

  var client = new CoAPClient(port, host);
  client.setOptions(options);

  client.once("failed", function (err) {
    return callback(err, null);
  });

  client.once("message", function (data) {
    return callback(null, data);
  });

  client.sendConfirm(methodCode);
};