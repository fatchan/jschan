'use strict';

const { buildModLogList } = require(__dirname+'/../../helpers/build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await buildModLogList(res.locals.board);
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html${req.path}`);

}
