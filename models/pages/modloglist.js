'use strict';

const { Posts, Modlogs } = require(__dirname+'/../../db/')
	, { buildModLogList } = require(__dirname+'/../../helpers/build.js')
	, dateArray = require(__dirname+'/../../helpers/datearray.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await buildModLogList(res.locals.board);
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html${req.path}`);

}
