/*
 * data format convert
 */

var url = require("url");
var util = require('util');
var normalizeUrl = require('normalizeurl');
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
  var port = 5638;

  if (obj.protocol === null || macro.schema.indexOf(obj.protocol) === -1) {
    return null;
  }

  if (obj.hash !== null) {
    return null;
  }

  host = obj.host;
  options.push({"Uri-Host": obj.host});

  if (obj.port === null) {
    options.push({"Uri-Port": 5638});
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

/*
 * convert content-format name to format number
 */
exports.toContentFormatNum = function(name) {
  if (name === 'text/plain;charset=utf-8') {
    return 0;
  }

  if (name === 'application/link-format') {
    return 40;
  }

  if (name === 'application/xml') {
    return 41;
  }

  if (name === 'application/octet-stream') {
    return 42;
  }

  if (name === 'application/exi') {
    return 47;
  }

  if (name === 'application/json') {
    return 50;
  }
};

/*
 * convert format number to content-format name
 */
exports.toContentFormatName = function(number) {
  if (typeof number === 'string') {
    number = parseInt(number);
  }

  if (number === 0) {
    return 'text/plain;charset=utf-8';
  }

  if (number === 40) {
    return 'application/link-format';
  }

  if (number === 41) {
    return 'application/xml';
  }

  if (number === 42) {
    return 'application/octet-stream';
  }

  if (number === 47) {
    return 'application/exi';
  }

  if (number === 50) {
    return 'application/json';
  }
};
