'use strict';

const { recover: web3EthAccountsRecover } = require('web3-eth-accounts')
	, paramConverter = require(__dirname+'/../input/paramconverter.js')
	, config = require(__dirname+'/../../misc/config.js');

const web3ParamConverter = paramConverter({
	trimFields: ['message', 'signature'],
});

module.exports = async (req, res, next) => {

	const { enableWeb3: globalWeb3 } = config.get;
	// True if not a board (global web3 functions dont exist yet but meh)
	const boardWeb3 = res.locals.board ? res.locals.board.settings.enableWeb3 === true : true;

	// Note: something new, running paramconverter within a middleware so it can rely on req.body/params
	web3ParamConverter(req, res, async () => { // Next called after paramconverter
		if (globalWeb3 === true && boardWeb3 === true
			&& req.body.message && req.body.signature && req.body.signature.length < 200) {
			try {
				const fixedMessage = req.body.rawMessage.replace(/\r\n/igm, '\n');
				res.locals.recoveredAddress = await web3EthAccountsRecover(fixedMessage, req.body.signature);
			} catch (e) {
				console.warn('Web3 signature verification failed:', e);
			}
		}
		next(); //Call this next
	});

};
