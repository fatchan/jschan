'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	const nReturned = await Bans.upgrade(res.locals.bansBoard, req.body.checkedbans, req.body.upgrade)
		.then(explain => {
			if (explain && explain.stages) {
				return explain.stages[0].nReturned;
			}
			return 0;
		});

	return nReturned;

};
