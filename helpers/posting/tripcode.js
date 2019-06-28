'use strict';

const { tripcodeSecret } = require(__dirname+'/../../configs/main.json')
    , { createHash } = require('crypto')

module.exports = async (password) => {

	const tripcodeHash = createHash('sha256').update(password + tripcodeSecret).digest('base64');
	const tripcode = tripcodeHash.substring(tripcodeHash.length-10);
	return tripcode;

}
