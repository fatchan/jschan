'use strict';

const { redis: redisConfig } = require(__dirname+'/configs/secrets.js')
	, hasPerms = require(__dirname+'/helpers/checks/hasperms.js')
	, config = require(__dirname+'/config.js')
	, roomRegex = /^(?<roomBoard>[a-z0-9]+)-(?<roomName>[a-z0-9-]+)$/i;

module.exports = {

	io: null, //null to begin with

	connect: (server, sessionMiddleware) => {
		const io = require('socket.io')(server);
		const redisAdapter = require('socket.io-redis');
		const sessionRefresh = require(__dirname+'/helpers/sessionrefresh.js');
		io.adapter(redisAdapter({ ...redisConfig }));
		io.use((socket, next) => {
			sessionMiddleware(socket.request, socket.request, next);
		});
		io.use((socket, next) => {
			sessionRefresh(socket.request, socket.request, next);
		});
		module.exports.io = io;
		module.exports.startRooms();
	},

	startRooms: () => {
		module.exports.io.on('connection', socket => {
			socket.on('ping', cb => {
				if (typeof cb === "function") {
					cb();
				}
			});
			socket.on('room', room => {
				const roomMatch = room.match(roomRegex);
				if (roomMatch && roomMatch.groups) {
					const { roomBoard, roomName } = roomMatch.groups;
					const { user } = socket.request.locals;
					let requiredAuth = 4; //default level is 4, anyone cos of public rooms
					let authLevel = user ? user.authLevel : 4;
					/* todo: maybe this could be a bit more flexible to support
						other *-hashed/raw pages, but its good for now */
					if (room === 'globalmanage-recent-raw'
						|| room === 'globalmanage-recent-hashed') {
						//if its globalmanage, level 1 required
						requiredAuth = 1;
					} else if (roomName === 'manage-recent-hashed'
						|| roomName === 'manage-recent-raw') {
						requiredAuth = 3; //board mod minimum
						if (user && authLevel === 4) {
							if (user.ownedBoards.includes(roomBoard)) {
								authLevel = 2; //user is BO
							} else if (user.modBoards.includes(roomBoard)) {
								authLevel = 3; //user is mod
							}
						}
					}
					if (room.endsWith('-raw')) {
						//if its a -raw room, prioritise ipHashPermLevel
						requiredAuth = Math.min(requiredAuth, config.get.ipHashPermLevel);
					}
					if (authLevel <= requiredAuth) {
						//user has perms to join
						socket.join(room);
						return socket.send('joined');
					}
				}
				//otherwise just disconnect them
				socket.disconnect(true);
			});
		});
	},

	emitRoom: (room, event, message) => {
		module.exports.io.to(room).emit(event, message);
	},

}
