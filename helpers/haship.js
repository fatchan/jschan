'use strict';

const { ipHashSecret } = require(__dirname+'/../configs/main.js')
	, { createHash } = require('crypto');

module.exports = (ip) => createHash('sha256').update(ipHashSecret + ip).digest('base64');
