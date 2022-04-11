'use strict';

const { ipHashSecret } = require(__dirname+'/../../configs/secrets.js')
	, { createHash } = require('crypto');

module.exports = (ip) => createHash('sha256').update(ipHashSecret + ip).digest('base64');
