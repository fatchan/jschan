'use strict';

const Tripcodes = require(__dirname+'/../db-models/trips.js')
	, crypto = require('crypto');

module.exports = async (password) => {

	//return existing trip if exists
	let existing = await Tripcodes.findOne(password);
	if (existing) {
		return existing.code;
	}

	//same as lynxchan does it, but i dont think this is secure. welcome to change.
	const trip = crypto.createHash('sha256').update(password + Math.random()).digest('base64').substring(0, 6);
	await Tripcodes.insertOne(password, trip);
	return trip;

}
