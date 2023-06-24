'use strict';

//NOTE: unused (for now)
const { Web3 } = require('web3')
	, config = require(__dirname+'/../misc/config.js')
	, { addCallback } = require(__dirname+'/../redis/redis.js')
	, web3 = new Web3(config.get.ethereumNode);

const updateWeb3Provider = () => {
	web3.setProvider(config.get.ethereumNode);
};

addCallback('config', updateWeb3Provider);

module.exports = web3;
