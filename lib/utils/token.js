/*
 * generate coap token
 */

exports.generateToken = function () {
  var token = 0;

  return function () {
    token += 1;

    if (token > 256) {
      token = 0;
    }

    return 0xFF & (token);
  };
};
