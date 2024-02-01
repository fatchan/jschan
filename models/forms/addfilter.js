'use strict';

const { Filters } = require(__dirname+'/../../db/')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { globalLimits } = config.get;

	const { __ } = res.locals;

	if (req.params.board) {
		const filterCount = await Filters.count(req.params.board);
		if (filterCount >= globalLimits.filters.max) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'message': __('Total number of filters would exceed global limit of %s', globalLimits.filters.max),
				'redirect': `/${req.params.board}/manage/filters.html`,
			});
		}
	}

	const filter = {
		'board': req.params.board ? req.params.board : null,
		'filters': req.body.filters.split(/\r?\n/).filter(n => n),
		'strictFiltering': req.body.strict_filtering ? true : false,
		'filterMode': req.body.filter_mode,
		'filterMessage': req.body.filter_message,
		'filterBanDuration': req.body.filter_ban_duration,
		'filterBanAppealable': req.body.filter_ban_appealable ? true : false,
		'replaceText': req.body.replace_text,
	};

	await Filters.insertOne(filter);

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Added filter'),
		'redirect': req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html'
	});

};
