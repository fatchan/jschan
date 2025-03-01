'use strict';

const { NftRules } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { __, __n } = res.locals;

	const deletedNftRules = await NftRules.deleteMany(req.params.board, req.body.checkednftrules).then(result => result.deletedCount);

	if (deletedNftRules === 0 || deletedNftRules < req.body.checkednftrules.length) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'error': __n('Deleted %s nft rules', deletedNftRules),
			'redirect': req.headers.referer || (req.params.board ? `/${req.params.board}/manage/nfts.html` : '/globalmanage/nfts.html')
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __n('Deleted %s nft rules', deletedNftRules),
		'redirect': req.params.board ? `/${req.params.board}/manage/nfts.html` : '/globalmanage/nfts.html'
	});

};
