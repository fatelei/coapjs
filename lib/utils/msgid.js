/* generate message id */


exports.generateMsgId = function () {
  var curId = 0;

  return function () {
    curId += 1;

    if (curId > 65535) {
    	curId = 0;
    }

    return 0xFFFF & (curId);
  };
};
