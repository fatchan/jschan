'use strict';

module.exports = require('child_process')
	.execSync('git rev-parse --short HEAD')
	.toString()
	.trim();
