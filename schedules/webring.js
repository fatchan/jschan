'use strict';

const fetch = require('node-fetch')
	, { meta } = require(__dirname+'/../configs/main.js')
	, { logos, following, blacklist } = require(__dirname+'/../configs/webring.json')
	, { Boards, Webring } = require(__dirname+'/../db/')
	, { outputFile } = require('fs-extra')
	, cache = require(__dirname+'/../redis.js')
	, uploadDirectory = require(__dirname+'/../helpers/files/uploadDirectory.js')
	, timeDiffString = require(__dirname+'/../helpers/timediffstring.js');

module.exports = async () => {
	const label = `updating webring`;
	const start = process.hrtime();

	//fetch stuff from others
	const fetchWebring = [...new Set((await cache.get('webring:sites') || []).concat(following))]
	let rings = await Promise.all(fetchWebring.map(url => {
		return fetch(url).then(res => res.json()).catch(e => console.error);
	}));

	let found = []; //list of found site urls
	let webringBoards = []; //list of webring boards
	for (let i = 0; i < rings.length; i++) {
		//this could really use some validation/sanity checking
		const ring = rings[i];
		if (!ring || !ring.name) {
			return;
		}
		if (ring.following && ring.following.length > 0) {
			found = found.concat(ring.following);
		}
		if (ring.known && ring.known.length > 0) {
			found = found.concat(ring.known);
		}
		if (ring.boards && ring.boards.length > 0) {
			ring.boards.forEach(board => {
				board.siteName = ring.name;
				//convert to numbers because infinity webring plugin returns strings
				board.totalPosts = parseInt(board.totalPosts);
				board.postsPerHour = parseInt(board.postsPerHour);
				board.uniqueUsers = parseInt(board.uniqueUsers);
			});
			webringBoards = webringBoards.concat(ring.boards);
		}
	}

	//get known sites by filtering found and removing blacklist or own site
	const known = [...new Set(found.concat(fetchWebring))]
		.filter(site => !blacklist.some(x => site.includes(x)) && !site.includes(meta.url));
	//add them all to cache for next time
	cache.set('webring:sites', known);

	//remove and replace webring boards
	await Webring.deleteAll();
	await Webring.db.insertMany(webringBoards);

	//output our own webring json
	const needsUpdate = await cache.del('webring_update'); //returns 1 if somethign was deleted, 0 if not exist
	if (needsUpdate) {
		const boards = await Boards.webringBoards();
		const json = {
			name: meta.siteName,
			url: meta.url,
			endpoint: `${meta.url}/webring.json`,
			logos,
			following,
			blacklist,
			known,
			boards: boards.map(b => {
				//map local boards to webring format
				return {
					uri: b._id,
					title: b.settings.name,
					subtitle: b.settings.description,
					path: `${meta.url}/${b._id}/`,
					postsPerHour: b.pph,
					totalPosts: b.sequence_value-1,
					uniqueUsers: b.ips,
					nsfw: !b.settings.sfw,
					tags: b.settings.tags,
					lastPostTimestamp: b.lastPostTimestamp,
				};
			}),
		}
		await outputFile(`${uploadDirectory}/json/webring.json`, JSON.stringify(json));
	}

	const end = process.hrtime(start);
	console.log(timeDiffString(label, end));
}
