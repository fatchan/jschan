'use strict';

const { Posts, Modlogs } = require(__dirname+'/../../db/')
	, { buildModLogList } = require(__dirname+'/../../helpers/build.js')
	, dateArray = require(__dirname+'/../../helpers/datearray.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	let firstLog, lastLog;
	try {
		[ firstLog, lastLog ] = await Promise.all([
			Modlogs.getFirst(),
			Modlogs.getLast()
		]);
	} catch (err) {
		return next(err);
	}

	let dates = [];
	if (firstLog.length > 0 && lastLog.length > 0) {
		const firstLogDate = firstLog[0].date;
		firstLogDate.setHours(1,0,0,0);
		const lastLogDate = lastLog[0].date;
		dates = dateArray(firstLogDate, lastLogDate);
	}

	try {
		await buildModLogList(res.locals.board, dates);
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html${req.path}`);

}
