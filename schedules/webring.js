'use strict';

const fetch = require('node-fetch')
	, { debugLogs, meta } = require(__dirname+'/../configs/main.js')
	, { logo, following, blacklist } = require(__dirname+'/../configs/webring.json')
	, { Boards, Webring } = require(__dirname+'/../db/')
	, { outputFile } = require('fs-extra')
	, cache = require(__dirname+'/../redis.js')
	, uploadDirectory = require(__dirname+'/../helpers/files/uploadDirectory.js')
	, timeDiffString = require(__dirname+'/../helpers/timediffstring.js');

module.exports = async () => {
	const label = `updating webring`;
	const start = process.hrtime();

	const visited = new Set();
	let known = new Set(following);
	let webringBoards = []; //list of webring boards
	while (known.size > visited.size) {
		//get sites we havent visited yet
		const toVisit = [...known].filter(url => !visited.has(url));
		let rings = await Promise.all(toVisit.map(url => {
			visited.add(url);
			return fetch(url, {agent:''}).then(res => res.json()).catch(e => console.error);
		}));
		for (let i = 0; i < rings.length; i++) {
			const ring = rings[i];
			if (!ring || !ring.name || !ring.endpoint || !ring.url) {
				continue;
			}
			if (ring.following && ring.following.length > 0) {
				//filter their folowing by blacklist/self and add to known sites
				ring.following
					.filter(url => !blacklist.some(x => url.includes(x)) && !url.includes(meta.url))
					.forEach(url => known.add(url));
			}
			if (ring.boards && ring.boards.length > 0) {
				//add some stuff for the boardlist and then add their boards
				ring.boards.forEach(board => {
					board.siteName = ring.name;
					//convert to numbers because old infinity webring plugin returns strings
					board.totalPosts = parseInt(board.totalPosts);
					board.postsPerHour = parseInt(board.postsPerHour);
					board.uniqueUsers = parseInt(board.uniqueUsers);
				});
				webringBoards = webringBoards.concat(ring.boards);
			}
		}
	}

	//remove and replace webring boards
	await Webring.deleteAll();
	await Webring.db.insertMany(webringBoards);
//TODO: insert into a temp colletion and use a $out aggregation stage to prevent small timeframe of empty collection

	//update webring.json
	const boards = await Boards.webringBoards();
	const json = {
		name: meta.siteName,
		url: meta.url,
		endpoint: `${meta.url}/webring.json`,
		logo,
		following,
		blacklist,
		known: [...known],
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

	const end = process.hrtime(start);
	debugLogs && console.log(timeDiffString(label, end));
}
