'use strict';

const hashIp = require(__dirname+'/../helpers/haship.js')
	, { createCIDR, parse } = require('ip6addr')
	, config = require(__dirname+'/../config.js');

module.exports = async(db, redis) => {
	const postIps = await db.collection('posts').distinct('ip.raw');
	const logIps = await db.collection('modlog').distinct('ip.raw');
	const banIps = await db.collection('bans').distinct('ip.raw');
	const allDistinctIps = postIps.concat(logIps).concat(banIps);
	const bulkWrites = allDistinctIps.map(ip => {
		const ipSet = {};
		try {
			const ipParsed = parse(ip);
			const ipKind = ipParsed.kind();
			const ipStr = ipParsed.toString({
				format: ipKind === 'ipv4' ? 'v4' : 'v6',
				zeroElide: false,
				zeroPad: false,
			});
			let qrange
				, hrange;
			if (ipKind === 'ipv4') {
				qrange = createCIDR(ipStr, 24).toString();
				hrange = createCIDR(ipStr, 16).toString();
			} else {
				qrange = createCIDR(ipStr, 64).toString();
				hrange = createCIDR(ipStr, 48).toString();
			}
			ipSet['ip.cloak'] = `${hashIp(hrange).substring(0,8)}.${hashIp(qrange).substring(0,7)}.${hashIp(ipStr).substring(0,7)}.IP`;
		} catch (e) {
			//-1 old "iphashpermlevel" or bypass ids, just shorten them
			const shortenedOldHash = `${hashIp(ip).slice(-10)}.IP`;
			ipSet['ip.raw'] = shortenedOldHash;
			ipSet['ip.cloak'] = shortenedOldHash;
		}
		return {
			'updateMany': {
				'filter': {
					'ip.raw': ip
				},
				'update': {
					'$unset': {
						'ip.single': '',
						'ip.qrange': '',
						'ip.hrange': '',
					},
					'$set': ipSet,
				}
			}
		};
	});
	console.log('adjusting ip in modlogs, bans and posts');
	//the bulkwrites should work for ip, bans, and logs
	await db.collection('posts').bulkWrite(bulkWrites);
	await db.collection('modlog').bulkWrite(bulkWrites);
	await db.collection('bans').bulkWrite(bulkWrites);
	console.log('removing saved posts inside bans');
	await db.collection('bans').updateMany({}, {
		'$set':{
			'posts': null,
		}
	});
	console.log('clearing reports')
	await db.collection('posts').updateMany({}, {
		'$set':{
			'reports': [],
			'globalreports': [],
		}
	});
	//drop old ban indexes that indexed ip.single, then recreate
	console.log('recreating bans indexes');
	await db.collection('bans').dropIndexes();
	await db.collection('bans').createIndex({ 'ip.cloak': 1 , 'board': 1 });
	await db.collection('bans').createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 });
}
