'use strict';

const { Filters } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { __, __n } = res.locals;

	const deletedFilters = await Filters.deleteMany(req.params.board, req.body.checkedfilters).then(result => result.deletedCount);

	if (deletedFilters === 0 || deletedFilters < req.body.checkedfilters.length) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'error': __n('Deleted %s filters', deletedFilters),
			'redirect': req.headers.referer || (req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html')
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __n('Deleted %s filters', deletedFilters),
		'redirect': req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html'
	});

};
