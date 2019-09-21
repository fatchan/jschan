'use strict';

const Mongo = require(__dirname+'/../../db/db.js')
	, { Posts } = require(__dirname+'/../../db/')
	, msTime = require(__dirname+'/../mstime.js')

module.exports = async (req, res) => {

	if (res.locals.permLevel <= 1) { //global staff bypass spam check
		return false;
	}

	const now = Date.now();
	const last120id = Mongo.ObjectId.createFromTime(Math.floor((now - (msTime.minute*2))/1000));
	const last30id = Mongo.ObjectId.createFromTime(Math.floor((now - (msTime.minute*0.5))/1000));
	const last15id = Mongo.ObjectId.createFromTime(Math.floor((now - 3000)/1000));
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
	//matching content from any IP in the past 30 seconds
	ors.push({
		'_id': {
			'$gt': last30id
		},
		'$or': contentOr
	});
	//matching content from same IP in last 2 minutes
	ors.push({
		'_id': {
			'$gt': last120id
		},
		'ip': res.locals.ip,
		'$or': contentOr
	});
	//any posts from same IP in past 15 seconds
	ors.push({
		'_id': {
			'$gt': last15id
		},
		'ip': res.locals.ip
	})

	let flood = await Posts.db.find({
		'$or': ors
	}).toArray();

	return flood.length > 0;

}
