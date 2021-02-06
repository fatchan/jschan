'use strict';

const Mongo = require(__dirname+'/../../db/db.js')
	, { Posts } = require(__dirname+'/../../db/')
	, timeUtils = require(__dirname+'/../timeutils.js')
	, config = require(__dirname+'/../../config.js');

module.exports = async (req, res) => {

	const { sameContentSameIp, sameContentAnyIp, anyContentSameIp } = config.get.floodTimers;

	if (res.locals.permLevel <= 1) { //global staff bypass spam check
		return false;
	}

	if (sameContentSameIp === 0
		&& sameContentAnyIp === 0
		&& anyContentSameIp === 0) {
		return false;
	}

	const now = Date.now();
	const ors = [];
	const contentOr = [];
	if (res.locals.numFiles > 0) {
		contentOr.push({
			'files': {
				'$elemMatch': {
					'hash': { //any file hash will match, doesnt need to be all
						'$in': req.files.file.map(f => f.sha256)
					}
				}
			}
		});
	}
	if (req.body.message) {
		contentOr.push({
			'nomarkup':  req.body.message
		})
	}

	if (sameContentAnyIp) {
		//matching content from any IP
		const sameContentAnyIpMongoId = Mongo.ObjectId.createFromTime(Math.floor((now - sameContentAnyIp)/1000));
		ors.push({
			'_id': {
				'$gt': sameContentAnyIpMongoId
			},
			'$or': contentOr
		});
	}

	if (sameContentSameIp > 0) {
		//matching content from same IP
		const sameContentSameIpMongoId = Mongo.ObjectId.createFromTime(Math.floor((now - sameContentSameIp)/1000));
		ors.push({
			'_id': {
				'$gt': sameContentSameIpMongoId
			},
			'ip.single': res.locals.ip.single,
			'$or': contentOr
		});
	}

	if (anyContentSameIp > 0) {
		//any posts from same IP
		const anyContentSameIpMongoId = Mongo.ObjectId.createFromTime(Math.floor((now - anyContentSameIp)/1000));
		ors.push({
			'_id': {
				'$gt': anyContentSameIpMongoId
			},
			'ip.single': res.locals.ip.single
		})
	}

	let flood = await Posts.db.find({
		'$or': ors
	}).toArray();

	return flood.length > 0;

}
