const crypto = require('crypto');
const createHash = (string) =>
  crypto.createHash('md5').update(string).digest('hex');

module.exports = createHash;
