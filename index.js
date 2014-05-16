// main entry

var CoAPServer = require("./lib/server");
var CoAPClient = require("./lib/client");

var agent = require("./lib/agent");

exports.CoAPServer = CoAPServer;
exports.CoAPClient = CoAPClient;
exports.agent = agent;
