'use strict';

const { buildLogin } = require(__dirname+'/../../lib/build/tasks.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js');

module.exports = async (req, res, next) => {

	res.render('login', {
		'goto': (typeof req.query.goto === 'string' ? req.query.goto : null)
	});

}
