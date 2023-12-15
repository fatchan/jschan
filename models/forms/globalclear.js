'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, redis = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (req, res) => {

	const { __, __n } = res.locals;

	let deletedCount = 0;
	switch (req.body.table) {
		case 'blockbypass':
			deletedCount = await Bypass.deleteAll().then(res => res.deletedCount || 0);
			break;
		case 'sessions':
			deletedCount = await redis.deletePattern('sess:*');
			break;
		default:
			throw 'invalid table'; //Should never get here
	}
	
	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __n('Deleted %s records.', deletedCount),
		'redirect': '/globalmanage/settings.html'
	});

};
