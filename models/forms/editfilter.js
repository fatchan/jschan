'use strict';

const { Filters } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;

	const updated = await Filters.updateOne(
		req.params.board,
		req.body.filter_id,
		req.body.filters.split(/\r?\n/).filter(n => n),
		req.body.strict_filtering ? true : false,
		req.body.filter_mode,
		req.body.filter_message,
		req.body.filter_ban_duration,
		req.body.filter_ban_appealable ? true : false
	).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'error': __('Filter does not exist'),
			'redirect': req.headers.referer || (req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html')
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Updated filter'),
		'redirect': req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html'
	});

};
