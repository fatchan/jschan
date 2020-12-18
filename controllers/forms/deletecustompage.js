'use strict';

const deleteCustomPage = require(__dirname+'/../../models/forms/deletecustompage.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedcustompages || req.body.checkedcustompages.length === 0) {
		errors.push('Must select at least one custom page to delete');
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage/custompages.html`
		})
	}

	try {
		await deleteCustomPage(req, res, next);
	} catch (err) {
		return next(err);
	}

}
