'use strict';

const { tripcodeSecret } = require(__dirname+'/../../configs/secrets.js')
    , { createHash } = require('crypto')
	, { encode } = require('iconv-lite')
	, crypt = require('unix-crypt-td-js')
	, replace = {
		':': 'A',
		';': 'B',
		'<': 'C',
		'=': 'D',
		'>': 'E',
		'?': 'F',
		'@': 'G',
		'[': 'a',
		'\\': 'b',
		']': 'c',
		'^': 'd',
		'_': 'e',
		'`': 'f',
	};

module.exports = {

	getSecureTrip: async (password) => {
		const tripcodeHash = createHash('sha256').update(password + tripcodeSecret).digest('base64');
		const tripcode = tripcodeHash.substring(tripcodeHash.length-10);
		return tripcode;
	},

	getInsecureTrip: (password) => {
		const encoded = encode(password, 'SHIFT_JIS')
			.toString('latin1');
		let salt = `${encoded}H..`
			.substring(1, 3)
			.replace(/[^.-z]/g, '.');
		for (let find in replace) {
			salt = salt.split(find).join(replace[find]);
		}
		const hashed = crypt(encoded, salt);
		return hashed.slice(-10);
	},

}
