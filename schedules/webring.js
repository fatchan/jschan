'use strict';

const fetch = require('node-fetch')
	, { debugLogs, meta } = require(__dirname+'/../configs/main.js')
	, { logo, following, blacklist, proxy } = require(__dirname+'/../configs/webring.json')
	, Mongo = require(__dirname+'/../db/db.js')
	, { Boards, Webring } = require(__dirname+'/../db/')
	, { outputFile } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../helpers/files/uploadDirectory.js')
	, timeDiffString = require(__dirname+'/../helpers/timediffstring.js')
	, SocksProxyAgent = proxy.enabled && require('socks-proxy-agent')
	, agent = SocksProxyAgent ? new SocksProxyAgent(require('url').parse(proxy.address)) : null

module.exports = async () => {
	const label = `updating webring`;
	const start = process.hrtime();

	const visited = new Map();
	let known = new Set(following);
	let webringBoards = []; //list of webring boards
	while (known.size > visited.size) {
		//get sites we havent visited yet
		const toVisit = [...known].filter(url => !visited.has(url));
		let rings = await Promise.all(toVisit.map(url => {
			visited.set(url, (visited.get(url)||0)+1);
			return fetch(url, {
				agent,
				headers: {
					'User-Agent':''
				}
			}).then(res => res.json()).catch(e => console.error);
		}));
		for (let i = 0; i < rings.length; i++) {
			const ring = rings[i];
			if (!ring || !ring.name || !ring.endpoint || !ring.url //malformed
				|| ring.endpoint.includes(meta.url) //own site
				|| visited.get(ring.endpoint) > 1) { //already seen endpoint (for multiple domain sites)
				continue;
			}
			visited.set(ring.endpoint, visited.get(ring.endpoint)+1);
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
					//convert to numbers because old infinity webring plugin returns string
					board.totalPosts = parseInt(board.totalPosts);
					board.postsPerHour = parseInt(board.postsPerHour);
					board.uniqueUsers = parseInt(board.uniqueUsers);
				});
				webringBoards = webringBoards.concat(ring.boards);
			}
		}
	}

	if (webringBoards.length > 0) {
		//$out from temp collection to replace webring boards
		const tempCollection = Mongo.db.collection('tempwebring');
		await tempCollection.insertMany(webringBoards);
		await tempCollection.aggregate([
			{ $out : 'webring' }
		]).toArray();
		await tempCollection.drop();
	} else {
		//otherwise none found, so delete them all
		await Webring.deleteAll();
	}

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
