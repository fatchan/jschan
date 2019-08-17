'use strict';

const { Posts, Modlogs } = require(__dirname+'/../../db/')
	, { buildModLog } = require(__dirname+'/../../helpers/build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	if (!res.locals.date) {
		return next();
	}

    const startDate = res.locals.date;
    const endDate = new Date(startDate.getTime());
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

	try {
		const logs = await Modlogs.findBetweenDate(res.locals.board, startDate, endDate);
		if (!logs || logs.length === 0) {
			return next();
		}
		await buildModLog(res.locals.board, startDate, endDate, logs);
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html${req.path}`);

}
