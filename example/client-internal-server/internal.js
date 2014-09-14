// internal endpoint

var CoAPServer = require('../../index').CoAPServer;
var CoAPClient = require('../../index').CoAPClient;
var Cache = require('simple-lru-cache');
var fromUrlToOptions = require('../../lib/utils/convert').fromUrlToOptions;


if (require.main === module) {
  var proxy = function(req, res, callback) {
    var target = null;
    for (var i = 0; i < req.options.length; i++) {
      if (req.options[i].type === 'Proxy-Uri') {
        target = req.options[i].value;
        break;
      } 
    }

    if (target !== null) {
      var tmp = fromUrlToOptions(target);

      var options = {};
      options.host = tmp[0];
      options.port = tmp[1];
      options.method = req.method;

      if (req.type.confirm) {
        options.type = 'confirmable';
      } else if (req.type.unconfirm) {
        options.type = 'unconfirmable';
      }

      var tmpPath = [];
      for (var i = 0; i < tmp[2].length; i++) {
        if (tmp[2][i].hasOwnProperty('Uri-Path')) {
          tmpPath.push(tmp[2][i]['Uri-Path']);
        }
        options.path = '/' + tmpPath.join('/');
      }

      var client = new CoAPClient();
      client.request(options, function(err, result) {
        if (err) {
          return callback(res.end(4.00, err));
        } else {
          return callback(res.end(result));
        }
      });

    } else {
      return callback(res.end(4.00, 'bad request'));
    }
  };

  var app = new CoAPServer({port: 8000});
  app.use(new Cache(10));
  app.get("/", proxy);
  app.listen();
}