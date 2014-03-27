/*
 * data format convert
 */

// other format to binary format
exports.toBinary = function (data) {
  if (Buffer.isBuffer(data)) {
    return data;
  } else {
    return new Buffer(data);  
  }
};
