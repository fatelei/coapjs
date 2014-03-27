/* generate message id */


exports.generateMsgId = function () {
  var curId = 0;

  return function () {
    curId += 1;
    return 0xFFFF & (curId);
  };
};
