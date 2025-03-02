'use strict';

const { NftRules } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;

	const updated = await NftRules.updateOne(
		req.params.board,
		req.body.nftrule_id,
		req.body.name,
		req.body.network,
		req.body.contract_address,
		req.body.abi,
		req.body.token_id,
		null, // req.body.permissions
	).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'error': __('NFT rule does not exist'),
			'redirect': req.headers.referer || (req.params.board ? `/${req.params.board}/manage/nfts.html` : '/globalmanage/nfts.html')
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Updated nft rule'),
		'redirect': req.params.board ? `/${req.params.board}/manage/nfts.html` : '/globalmanage/nfts.html'
	});

};
