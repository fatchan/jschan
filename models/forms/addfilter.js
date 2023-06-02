'use strict';

const { Filters } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;

	const filter = {
		'board': req.params.board ? req.params.board : null,
		'filters': req.body.filters.split(/\r?\n/).filter(n => n),
		'strictFiltering': req.body.strict_filtering ? true : false,
		'filterMode': req.body.filter_mode,
		'filterMessage': req.body.filter_message,
		'filterBanDuration': req.body.filter_ban_duration,
		'filterBanAppealable': req.body.filter_ban_appealable ? true : false,
	};

	await Filters.insertOne(filter);

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Added filter'),
		'redirect': req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html'
	});

};
