'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, redis = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;

	switch (req.body.table) {
		case 'blockbypass':
			await Bypass.deleteAll();
			break;
		case 'sessions':
			await redis.deletePattern('sess:*');
			break;
		default:
			throw 'invalid table'; //Should never get here
	}
	
	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Cleared Table.'),
		'redirect': '/globalmanage/settings.html'
	});

};
