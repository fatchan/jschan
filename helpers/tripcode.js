'use strict';

const Tripcodes = require(__dirname+'/../db/trips.js')
    , util = require('util')
    , crypto = require('crypto')
    , randomBytes = util.promisify(crypto.randomBytes);

module.exports = async (password) => {

	//return existing trip if exists
	let existing = await Tripcodes.findOne(password);
	if (existing) {
		return existing.code;
	}

	//fix, not sure how secure
	const salt = (await randomBytes(128)).toString('hex');
	const fullTripCodeHash = crypto.createHash('sha256').update(password + salt).digest('base64');
	const trip = fullTripCodeHash.substring(fullTripCodeHash.length-10);
	await Tripcodes.insertOne(password, trip);
	return trip;

}
