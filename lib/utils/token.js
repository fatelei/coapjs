/*
 * generate coap token
 */

exports.generateToken = function () {
  var token = 0;

  return function () {
    var tmp = 0xFF & (token);
    token += 1;

    if (token > 256) {
      token = 0;
    }

    return tmp;
  };
};
