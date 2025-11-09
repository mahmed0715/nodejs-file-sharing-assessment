const crypto = require('crypto');

function genKey() {
  return crypto.randomBytes(12).toString('hex');
}

module.exports = { genKey };
