'use strict';

const { redis: redisConfig, ipHashPermLevel } = require(__dirname+'/configs/main.js')
	, roomRegex = /[a-z0-9]+-\d+/i
	, roomPermsMap = {
		'globalmanage-recent-hashed': 1,
		'globalmanage-recent-raw': ipHashPermLevel,
	}
	, authedRooms = new Set(Object.keys(roomPermsMap));

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
			socket.on('room', room => {
				if ((!roomRegex.test(room) && !authedRooms.has(room)) //if not a valid room name
					|| (authedRooms.has(room) && (!socket.request.locals.user //or the room requires auth and no session
					|| socket.request.locals.user.authLevel > roomPermsMap[room]))) { //or not enough perms for that room
					return socket.disconnect(true); //disconnect them
				}
				socket.join(room); //otherwise join the room
				socket.send('joined'); //send joined so frontend knows to show "connected"
			});
		});
	},

	emitRoom: (room, event, message) => {
		module.exports.io.to(room).emit(event, message);
	},

}
