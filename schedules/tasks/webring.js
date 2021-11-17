'use strict';

const fetch = require('node-fetch')
	, { debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, config = require(__dirname+'/../../config.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Redis = require(__dirname+'/../../redis.js')
	, { Boards } = require(__dirname+'/../../db/')
	, { outputFile } = require('fs-extra')
	, SocksProxyAgent = require('socks-proxy-agent')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, timeDiffString = require(__dirname+'/../../helpers/timediffstring.js')
	, timeUtils = require(__dirname+'/../../helpers/timeutils.js');

module.exports = {

	func: async () => {

		const { meta, logo, following, blacklist, proxy } = config.get;
		const label = `updating webring`;
		const start = process.hrtime();

		const agent = proxy.enabled ? new SocksProxyAgent(require('url').parse(proxy.address)) : null;
		const visited = new Map();
		const siteNames = new Set();
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
				})
				.then(res => res.json())
				.catch(e => {});
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
				siteNames.add(ring.name);
				if (ring.boards && ring.boards.length > 0) {
					//add some stuff for the boardlist and then add their boards
					ring.boards.forEach(board => {
						board.siteName = ring.name;
						//convert to numbers because old infinity webring plugin returns string
						board.sequence_value = parseInt(board.totalPosts) || 0;
						board.pph = parseInt(board.postsPerHour) || 0;
						if (board.postsPerDay != null) {
							board.ppd = parseInt(board.postsPerDay) || 0;
						}
						board.ips = parseInt(board.uniqueUsers) || 0;
						board.settings = {
							sfw: !board.nsfw,
							name: board.title,
							description: board.subtitle,
						};
						if (board.lastPostTimestamp) {
							board.lastPostTimestamp = new Date(board.lastPostTimestamp.toString());
						}
					});
					webringBoards = webringBoards.concat(ring.boards);
				}
			}
		}

		await Boards.db.deleteMany({ webring: true });
		if (webringBoards.length > 0) {
			webringBoards = webringBoards.map(x => {
				x.webring = true;
				delete x._id; //would cause inserterror, but still dont wanna let that happen
				return x;
			});
			await Boards.db.insertMany(webringBoards);
			await Redis.set('webringsites', [...siteNames].sort((a, b) => a.localeCompare(b)));
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
					postsPerDay: b.ppd,
					totalPosts: b.sequence_value-1,
					uniqueUsers: b.ips,
					nsfw: !b.settings.sfw,
					tags: b.tags,
					lastPostTimestamp: b.lastPostTimestamp,
				};
			}),
		}
		await outputFile(`${uploadDirectory}/json/webring.json`, JSON.stringify(json));

		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
	},
	interval: timeUtils.MINUTE*15,
	immediate: true,
	condition: 'enableWebring'

};
