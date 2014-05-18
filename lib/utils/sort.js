// sort array by its object property

// config
var reverse_options = require("../macro/macro.json").reverse_options;


exports.sortArrayByObject = function (a, b) {
  var aNumber = reverse_options[a.type];
  var bNumber = reverse_options[b.type];

  if (aNumber > bNumber) {
    return 1;
  } else if (aNumber < bNumber) {
    return -1;
  }
  return 0;
};
