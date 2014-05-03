/*
 * data format convert
 */

// core module
var url = require("url");

// 3rd module
var normalizeUrl = require('normalizeurl');

// config
var macro = require("../macro/macro.json");

// other format to binary format
exports.toBinary = function (data) {
  if (Buffer.isBuffer(data)) {
    return data;
  } else {
    return new Buffer(data);  
  }
};

// convert url to coap options
exports.fromUrlToOptions = function (urlStr) {
  var obj = url.parse(normalizeUrl(urlStr));
  var options = [];
  var host = "localhost";
  var port = 5683;

  if (obj.protocol === null || macro.schema.indexOf(obj.protocol) === -1) {
    return null;
  }

  if (obj.hash !== null) {
    return null;
  }

  host = obj.host;
  options.push({"Uri-Host": obj.host});

  if (obj.port === null) {
    options.push({"Uri-Port": 5683});
  } else {
    options.push({"Uri-Port": parseInt(obj.port)});
    port = obj.port;
  }

  if (obj.pathname !== null || obj.pathname !== '/') {
    var paths = obj.pathname.split('/');

    for (var i = 1; i < paths.length; i++) {
      options.push({"Uri-Path": paths[i]});
    }  
  }

  for (var k in obj.query) {
    if (obj.query.hasOwnProperty(k)) {
      var tmp = k + '=' + obj.query[k];
      options.push({"Uri-Query": tmp});
    }
  }

  return [host, port, options];
};

// convert coap options to url
// TODO
exports.fromOptionsToUrl = function (schema, options) {

};