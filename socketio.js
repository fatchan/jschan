'use strict';

const configs = require(__dirname+'/configs/main.json');

module.exports = {

	io: null, //null to begin with

	connect: (server) => {
		const io = require('socket.io')(server);
		const redisAdapter = require('socket.io-redis');
		io.adapter(redisAdapter({ ...configs.redis }));
		module.exports.io = io;
		module.exports.startRooms();
	},

	startRooms: () => {
		module.exports.io.on('connection', socket => {
			socket.on('room', room => {
				socket.join(room);
			});
		});
	},

	emitRoom: (room, event, message) => {
		module.exports.io.to(room).emit(event, message);
	},

}
