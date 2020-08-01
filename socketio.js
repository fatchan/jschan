'use strict';

const configs = require(__dirname+'/configs/main.js');

module.exports = {

	io: null, //null to begin with

	connect: (server, sessionMiddleware) => {
		const io = require('socket.io')(server);
		const redisAdapter = require('socket.io-redis');
		io.adapter(redisAdapter({ ...configs.redis }));
		io.use((socket, next) => {
			//make session available in socket.request.session
			sessionMiddleware(socket.request, socket.request, next);
		});
		module.exports.io = io;
		module.exports.startRooms();
	},

	startRooms: () => {
		module.exports.io.on('connection', socket => {
//TODO: if we need authed socket endpoints (e.g. modview pages), we can use socket.request.session
			socket.on('room', room => {
				socket.join(room);
				socket.send('joined');
			});
		});
	},

	emitRoom: (room, event, message) => {
		module.exports.io.to(room).emit(event, message);
	},

}
