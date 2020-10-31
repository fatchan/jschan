'use strict';

const { redis: redisConfig } = require(__dirname+'/configs/main.js')
	, roomRegex = /[a-z0-9]+-\d+/i

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
				if ((!roomRegex.test(room) && room !== 'globalmanage-recent') //if not a valid room name
					|| (room === 'globalmanage-recent' && (!socket.request.locals.user
					|| socket.request.locals.user.authLevel > 1))) { //or no perms
					return socket.disconnect(true); //then disconnect them
				}
				socket.join(room);
				socket.send('joined');
			});
		});
	},

	emitRoom: (room, event, message) => {
		module.exports.io.to(room).emit(event, message);
	},

}
