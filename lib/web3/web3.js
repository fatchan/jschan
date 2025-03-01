'use strict';

//NOTE: unused (for now)
const { Web3 } = require('web3'),
	config = require(__dirname + '/../misc/config.js'),
	{ addCallback } = require(__dirname + '/../redis/redis.js'),
	web3 = new Web3(config.get.ethereumNode);

const updateWeb3Provider = () => {
	web3.setProvider(config.get.ethereumNode);
};

addCallback('config', updateWeb3Provider);

async function checkNftOwnership(contractAddress, abi, tokenId, userAddress) {
	const contract = new web3.eth.Contract(abi, contractAddress);

	try {
		const owner = await contract.methods.ownerOf(tokenId).call();
		return owner.toLowerCase() === userAddress.toLowerCase();
	} catch (error) {
		console.error('Error checking ownership:', error);
		return false; // Return false if the token does not exist or any error occurs
	}
}

async function hasNftFromCollection(contractAddress, abi, userAddress) {
	const contract = new web3.eth.Contract(abi, contractAddress);

	try {
		const balance = await contract.methods.balanceOf(userAddress).call();
		return balance > 0; //balance is actually a bigint, but anything > 0 should mean "has an nft"
	} catch (error) {
		console.error('Error checking balance:', error);
		return false; // Return false if any error occurs
	}
}

module.exports = {
	web3,
	checkNftOwnership,
	hasNftFromCollection,
};
