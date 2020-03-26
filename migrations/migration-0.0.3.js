'use strict';

module.exports = async(db, redis) => {
	console.log('Moving user uploads from /img/ to /file/');
	require('fs').renameSync(__dirname+'/../static/img/', __dirname+'/../static/file/')
};
