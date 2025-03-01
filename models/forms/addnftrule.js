'use strict';

const { NftRules } = require(__dirname+'/../../db/')
	// , config = require(__dirname+'/../../lib/misc/config.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;

	// const { globalLimits } = config.get;
	//TODO: in future enhancement limit  no of NFT rules per board
	// if (req.params.board) {
		// const filterCount = await Filters.count(req.params.board);
		// if (filterCount >= globalLimits.filters.max) {
			// return dynamicResponse(req, res, 400, 'message', {
				// 'title': __('Bad request'),
				// 'message': __('Total number of filters would exceed global limit of %s', globalLimits.filters.max),
				// 'redirect': `/${req.params.board}/manage/filters.html`,
			// });
		// }
	// }

	const nftRule = {
		'board': req.params.board ? req.params.board : null,
		'network': req.body.network,
		'contractAddress': req.body.contract_address,
		'abi': req.body.abi,
		'tokenId': req.body.token_id ? req.body.token_id : null,
		'permissions': null,
	};

	await NftRules.insertOne(nftRule);

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Added nft rule'),
		'redirect': req.params.board ? `/${req.params.board}/manage/nfts.html` : '/globalmanage/nfts.html' //Note: no global yet, lol
	});

};
